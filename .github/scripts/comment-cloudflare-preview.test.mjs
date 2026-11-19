import { expect, test } from 'vite-plus/test';
import { readFile } from 'node:fs/promises';
import updateComments from './comment-cloudflare-preview.cjs';

test('Preview-Kommentare: Lebenszyklus, Idempotenz und Vertrauensgrenzen', async () => {
  const marker = '<!-- cloudflare-pr-preview -->';
  const sha = 'd97b3524c4fad050e9806163e8ca2a410bc0f17d';
  const preview = 'https://a62bfceb-web-konzerte.noah-zepner.workers.dev';
  const pr = {
    number: 48,
    state: 'open',
    head: { sha, ref: 'feature/animations', repo: { full_name: 'akg-kiel/web-konzerte' } }
  };
  const run = {
    id: 7,
    head_sha: sha,
    name: 'Workers Builds: web-konzerte',
    app: { slug: 'cloudflare-workers-and-pages' },
    status: 'completed',
    conclusion: 'success',
    html_url: 'https://github.com/akg-kiel/web-konzerte/runs/7',
    output: {
      summary: `Build ID: example\nPreview URL: ${preview}\nPreview Alias URL: https://branch-web-konzerte.noah-zepner.workers.dev\n`
    }
  };
  let runs = [run];
  let current = pr;
  let comments = [
    { id: 1, user: { login: 'visitor' }, body: marker },
    {
      id: 2,
      user: { login: 'zepi2509' },
      body: '<!-- cloudflare-pr-preview-backfill -->\nOld preview'
    }
  ];
  let writes = [];
  const failures = [];
  const refs = [];
  const context = {
    repo: { owner: 'akg-kiel', repo: 'web-konzerte' },
    payload: { repository: { default_branch: 'main' } }
  };
  const github = {
    paginate: (method, args) => method(args),
    rest: {
      pulls: {
        list: async () => [
          pr,
          { ...pr, number: 49, head: { ...pr.head, repo: { full_name: 'visitor/fork' } } },
          { ...pr, number: 50, head: { ...pr.head, ref: 'main' } }
        ],
        get: async () => ({ data: current })
      },
      checks: {
        listForRef: async ({ ref }) => {
          refs.push(ref);
          return runs;
        }
      },
      issues: {
        listComments: async () => comments,
        updateComment: async (args) => {
          writes.push(args);
          comments.find((c) => c.id === args.comment_id).body = args.body;
        },
        createComment: async (args) => {
          writes.push(args);
          comments.push({ id: 3, user: { login: 'github-actions[bot]' }, body: args.body });
        }
      }
    }
  };
  const check = () =>
    updateComments({ github, context, core: { setFailed: (s) => failures.push(s) } });
  await check();
  expect(writes.length).toBe(1);
  expect(writes[0].comment_id, 'Adopt the existing trusted backfill comment').toBe(2);
  expect(writes[0].body.includes(preview)).toBeTruthy();
  expect(
    !writes[0].body.includes('branch-web-konzerte'),
    'Use immutable URLs, not moving aliases'
  ).toBeTruthy();
  expect(comments[0].body, 'Never adopt an untrusted marker').toBe(marker);
  expect(refs, 'Skip fork and production branches').toStrictEqual([sha]);
  writes = [];
  await check();
  expect(writes.length, 'Identical results must not create or update another comment').toBe(0);

  runs = [
    run,
    { ...run, id: 8, output: { summary: 'Build ID: metadata-only\nScript: web-konzerte' } }
  ];
  await check();
  expect(
    writes.length,
    'Metadata-only success must not replace a ready preview of the same SHA'
  ).toBe(0);
  expect(failures.length).toBe(0);

  runs = [run, { ...run, id: 8, conclusion: 'failure' }];
  await check();
  expect(
    !writes.at(-1).body.includes(preview),
    'A newer failure must remove an old ready link'
  ).toBeTruthy();
  runs = [run];
  await check();
  runs = [];
  await check();
  expect(writes.at(-1).body, 'Pending builds must remove old ready links').not.toContain(preview);

  for (const url of [
    'https://a62bfceb-web-konzerte.noah-zepner.workers.dev.evil.test',
    'https://user@a62bfceb-web-konzerte.noah-zepner.workers.dev',
    'http://a62bfceb-web-konzerte.noah-zepner.workers.dev',
    `${preview}:444`,
    `${preview}/redirect`,
    `${preview}?target=other`,
    `${preview}#fragment`
  ]) {
    runs = [{ ...run, output: { summary: `Preview URL: ${url}\n` } }];
    await check();
    expect(comments[1].body, 'Reject foreign or altered URLs').not.toContain('.workers.dev');
  }
  expect(failures.length).toBe(7);
  runs = [{ ...run, app: { slug: 'other-app' } }];
  await check();
  expect(comments[1].body, 'Reject same-named checks from other apps').not.toContain(
    '.workers.dev'
  );

  runs = [run];
  current = { ...pr, head: { ...pr.head, sha: '1'.repeat(40) } };
  writes = [];
  await check();
  expect(writes.length, 'Do not publish a stale head').toBe(0);
  current = { ...pr, state: 'closed' };
  await check();
  expect(writes.length, 'Do not update a closed PR').toBe(0);
  current = pr;
  comments = [comments[0]];
  await check();
  expect(writes.length).toBe(1);
  expect(writes[0].issue_number).toBe(48);
  writes = [];
  await check();
  expect(writes.length, 'New bot comments must also remain idempotent').toBe(0);

  const workflow = await readFile('.github/workflows/preview-comments.yml', 'utf8');
  expect(workflow.includes('github.event.repository.default_branch')).toBeTruthy();
  expect(workflow.includes('persist-credentials: false')).toBeTruthy();
  expect(!workflow.includes('github.event.pull_request.head.sha')).toBeTruthy();
  expect(!workflow.includes('secrets.CLOUDFLARE')).toBeTruthy();
});
