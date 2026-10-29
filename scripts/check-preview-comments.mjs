import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import updateComments from '../.github/scripts/comment-cloudflare-preview.cjs';

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
assert.equal(writes.length, 1);
assert.equal(writes[0].comment_id, 2, 'Adopt the existing trusted backfill comment');
assert(writes[0].body.includes(preview));
assert(!writes[0].body.includes('branch-web-konzerte'), 'Use immutable URLs, not moving aliases');
assert.equal(comments[0].body, marker, 'Never adopt an untrusted marker');
assert.deepEqual(refs, [sha], 'Skip fork and production branches');
writes = [];
await check();
assert.equal(writes.length, 0, 'Identical results must not create or update another comment');

runs = [
  run,
  { ...run, id: 8, output: { summary: 'Build ID: metadata-only\nScript: web-konzerte' } }
];
await check();
assert.equal(
  writes.length,
  0,
  'Metadata-only success must not replace a ready preview of the same SHA'
);
assert.equal(failures.length, 0);

runs = [run, { ...run, id: 8, conclusion: 'failure' }];
await check();
assert(!writes.at(-1).body.includes(preview), 'A newer failure must remove an old ready link');
assert(writes.at(-1).body.includes('nicht verfügbar'));
runs = [];
await check();
assert(writes.at(-1).body.includes('wird erstellt'));

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
  assert(!comments[1].body.includes('[Vorschau öffnen]'), 'Reject foreign or altered URLs');
}
assert.equal(failures.length, 7);
runs = [{ ...run, app: { slug: 'other-app' } }];
await check();
assert(!comments[1].body.includes('[Vorschau öffnen]'), 'Reject same-named checks from other apps');

runs = [run];
current = { ...pr, head: { ...pr.head, sha: '1'.repeat(40) } };
writes = [];
await check();
assert.equal(writes.length, 0, 'Do not publish a stale head');
current = { ...pr, state: 'closed' };
await check();
assert.equal(writes.length, 0, 'Do not update a closed PR');
current = pr;
comments = [comments[0]];
await check();
assert.equal(writes.length, 1);
assert.equal(writes[0].issue_number, 48);
writes = [];
await check();
assert.equal(writes.length, 0, 'New bot comments must also remain idempotent');

const workflow = await readFile('.github/workflows/preview-comments.yml', 'utf8');
assert(workflow.includes('pull_request_target:'));
assert(workflow.includes('workflow_dispatch:'));
assert(workflow.includes('github.event.repository.default_branch'));
assert(workflow.includes('persist-credentials: false'));
assert(!workflow.includes('github.event.pull_request.head.sha'));
assert(!workflow.includes('secrets.CLOUDFLARE'));
console.log(
  'Preview comments: create/update, lifecycle, stale heads, URL and author guards passed.'
);
