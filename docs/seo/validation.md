# Pre-launch integration validation

Checked 2026-10-05 on `t3code/prelaunch-seo-and-copy`. This is an implementation/preview record, not production-domain or Google validation.

## Passed

- `pnpm quality`: mapping/image, availability, Event/alias and indexing regressions; formatting/lint; generated bindings; Astro diagnostics (zero errors/warnings/hints); build; generated Cloudflare/static-HTML assertions.
- `git diff --check`.
- Generated `dist/server/wrangler.json`: `main: entry.mjs`, `assets.directory: ..`, `assets.binding: ASSETS`, **`assets.run_worker_first: true`**. The independent review's possible dropped-routing flag was not reproduced by the actual build. The build check explicitly guards this flag.
- Local built Worker (`astro preview`, `http://127.0.0.1:4323`): noindex headers on prerendered HTML, SSR, favicon, fonts, JS and PDF; current concert HTTP 200; renamed title alias HTTP 301; unknown/invalid-date/ambiguous-recurring aliases HTTP 404 with no-store and no Event JSON-LD; canonical host never local/Worker.
- Native Chromium against that explicitly recorded local URL: poster details at requested 1280/768/375/430 widths, plus home/programme/archive/visit/room-request/contact/imprint/privacy and a future no-ticket detail at desktop/mobile. One H1, no horizontal overflow/broken images/contrast-detector failures; 4:3 responsive focal poster, eager/high-priority loading, full-poster link and centered image-failure fallback retained. Past no-ticket action is “Aktuelle Konzerte”; future no-ticket action is “Besuch planen”.
- Bounded browser inspection found date-year placeholders at approximately 4.36:1 contrast. Raising the shared date segment opacity from 50% to 60% removed the failure in the confirmation round. Geometry overlap detections came from intentional hero-photo overlays and full-card hit areas, not intersecting reading text. This is not a full accessibility certification or performance audit.

- A follow-up regression caught date-only/all-day concerts moving to the archive at the start of their final calendar day. The shared state helper now compares Berlin calendar dates when the time is unknown; timed events retain exact end-time handling. Same-day, multi-day and Berlin-midnight checks passed, followed by another full `pnpm quality` run. No visual changes or extra polishing round were needed.

## Cloudflare preview only

Initial accepted version: `086fa6ba-1ebe-47cd-abac-df130e8f8b20`. Final preview after the calendar-day state regression fix: `b476a571-ba92-45a2-b9ec-3f36a273c836`.

- Immutable URL: https://b476a571-web-konzerte.noah-zepner.workers.dev
- Alias: https://prelaunch-seo-copy-web-konzerte.noah-zepner.workers.dev
- Uploaded with `--keep-vars`; no production-traffic deployment or trigger/domain changes.
- HTTP acceptance passed on 16 paths spanning static/SSR/filtered/paginated HTML, sitemap, robots, renamed/ambiguous/error details, fonts, JS and PDF. Effective preview header is `X-Robots-Tag: noindex`; Cloudflare preview responses do not preserve the exact local `noindex, follow` value. SSR also contains noindex metadata. Prerendered HTML intentionally retains production index metadata; the effective preview response header forbids indexing.
- Sitemap URLs were deduplicated and used only the configured canonical domain. Preview robots allows crawling so noindex can be read. A collaborative-browser snapshot confirmed the deployed preview homepage title and rendered copy.
- Latest production deployment observed remains the pre-existing `731acc94-923f-4e0e-8518-6ee3f16800ba` from 2026-10-02. This wave was not promoted to production.

## Deliberate policy and remaining acceptance

- Public `/_image/` transforms render concert posters. They are not treated as private APIs or disallowed in production robots. Blocking public rendering resources was not accepted as a review fix. Private API/actions/server-island/internal Astro routes remain protected; preview protection covers images as well.
- AKG-83: the configured canonical domain still needs final approval and functioning DNS/HTTPS. A local Host-header override did not change Astro preview's internal request URL and is **not** a passed production-host simulation. Real production indexing/canonical acceptance remains pending.
- AKG-88/94: missing ChurchTools facts and Google Rich Results acceptance remain open; see [event-data.md](event-data.md). No external-validator approval is claimed.
- Copy facts/legal approval/parking confirmations remain listed in [../copy-audit.md](../copy-audit.md). Old-host mappings/redirect rollout remain in [../migration/README.md](../migration/README.md).

Temporary evidence: `/tmp/web-konzerte-prelaunch-quality-calendar.log`, `/tmp/web-konzerte-ui-report.json`, `/tmp/web-konzerte-prelaunch-http.json`, `/tmp/web-konzerte-prelaunch-remote-http.json`. Local preview was stopped after acceptance. Production promotion requires a separate merge/deployment decision.
