const marker = '<!-- cloudflare-pr-preview -->';
const legacyMarker = '<!-- cloudflare-pr-preview-backfill -->';

module.exports = async ({ github, context, core }) => {
  const repo = context.repo;
  const fullName = `${repo.owner}/${repo.repo}`;
  const prs = await github.paginate(github.rest.pulls.list, {
    ...repo,
    state: 'open',
    per_page: 100
  });

  // Reconcile every open PR: repository-wide concurrency can coalesce events.
  for (const pr of prs) {
    if (
      pr.head.repo?.full_name !== fullName ||
      pr.head.ref === context.payload.repository.default_branch
    )
      continue;

    const runs = await github.paginate(github.rest.checks.listForRef, {
      ...repo,
      ref: pr.head.sha,
      check_name: 'Workers Builds: web-konzerte',
      filter: 'all',
      per_page: 100
    });
    const matchingRuns = runs
      .filter(
        (r) =>
          r.app?.slug === 'cloudflare-workers-and-pages' &&
          r.name === 'Workers Builds: web-konzerte' &&
          r.head_sha === pr.head.sha
      )
      .sort((a, b) => b.id - a.id);
    const latest = matchingRuns[0];
    // Cloudflare also completes metadata-only checks for the same commit.
    const run =
      latest?.status === 'completed' && latest.conclusion === 'success'
        ? (matchingRuns.find(
            (r) =>
              r.status === 'completed' &&
              r.conclusion === 'success' &&
              /^Preview URL:/m.test(r.output?.summary ?? '')
          ) ?? latest)
        : latest;

    let preview;
    if (run?.status === 'completed' && run.conclusion === 'success') {
      // ponytail: parse Cloudflare's summary until GitHub exposes a structured preview URL.
      const match = run.output?.summary?.match(/^Preview URL:[ \t]+(\S+)[ \t]*$/m);
      try {
        const url = new URL(match?.[1]);
        if (
          url.protocol === 'https:' &&
          /^[a-f0-9]{8}-web-konzerte\.noah-zepner\.workers\.dev$/.test(url.hostname) &&
          !url.username &&
          !url.password &&
          !url.port &&
          url.pathname === '/' &&
          !url.search &&
          !url.hash
        )
          preview = url.origin;
      } catch {
        // Missing or malformed URLs must never become ready links.
      }
      if (!preview) core.setFailed(`PR #${pr.number}: Cloudflare returned no trusted preview URL.`);
    }

    const status = preview
      ? `**[Vorschau öffnen](${preview})**`
      : run?.status === 'completed'
        ? '⚠️ Die Vorschau für diesen Commit ist nicht verfügbar. Bitte den Cloudflare-Check prüfen.'
        : '⏳ Die Vorschau für diesen Commit wird erstellt.';
    const body = [
      marker,
      '## Cloudflare-Preview',
      '',
      status,
      '',
      `Commit: \`${pr.head.sha}\``,
      ...(run ? [`[Cloudflare-Check](https://github.com/${fullName}/runs/${run.id})`] : []),
      '',
      'Versions-Vorschau mit bestehenden Ressourcen, kein Produktionsdeploy. Formularversand bleibt auf die Produktivdomain beschränkt.'
    ].join('\n');
    const comments = await github.paginate(github.rest.issues.listComments, {
      ...repo,
      issue_number: pr.number,
      per_page: 100
    });
    const comment = comments.find(
      (c) =>
        ['github-actions[bot]', 'zepi2509'].includes(c.user?.login) &&
        (c.body?.includes(marker) || c.body?.includes(legacyMarker))
    );
    if (comment?.body === body) continue;

    const { data: current } = await github.rest.pulls.get({ ...repo, pull_number: pr.number });
    if (current.state !== 'open' || current.head.sha !== pr.head.sha) continue;
    if (comment) await github.rest.issues.updateComment({ ...repo, comment_id: comment.id, body });
    else await github.rest.issues.createComment({ ...repo, issue_number: pr.number, body });
  }
};
