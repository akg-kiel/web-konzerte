# Homepage refinement

Implemented within the existing Nordic Resonance design; no new dependencies, content, assets, routes or motion.

## Changes

- `Hero.astro`: stronger neutral photographic scrim at tablet sizes only; desktop and phone photo treatments retained. Introduction uses 16px and full body ink.
- `ConcertCard.astro`: dates use readable 14px sentence-case type without tracking. Descriptive copy uses 16px full body ink. Removed the minimum height from three-line homepage excerpts so no fourth line paints below the ellipsis. Shared programme/archive cards inherit the date and prose improvements.
- `Concerts.astro`: overview-link hit area is at least 48px high in both responsive locations; supporting introduction uses full body ink.
- `CtaCard.astro` and `index.astro`: service and architectural prose use full body ink, including during hover/focus.

The quotation, section-heading policy, cards, typography, programme data and page structure remain. The broader content/layout suggestions F-05 and F-06 were not treated as permission for a redesign; only programme hierarchy was strengthened.

## Verification

- `pnpm test`: passed.
- `pnpm exec astro check`: passed, 0 errors/warnings/hints.
- `pnpm exec astro build`: passed.
- Generated Cloudflare asset routing and built SEO checks: passed.
- Manual Impeccable source detector over all five modified files: no findings.
- `check-layout.mjs`: passed at 320, 375, 390, 414, 768 and 1440px. Verified two-line title, no horizontal overflow, full body ink, readable dates, real and worst-case three-line excerpts, and programme-link targets. Keyboard menu Enter/Tab/Escape and focus restoration verified at 320px.
- All seven final inspector screenshots were opened and reviewed, including tablet title separation and mobile concert excerpt.

The initial diagnostic assertion used a transformed bounding-box height during the card reveal (97% scale). The diagnostic now measures layout height with `offsetHeight`; this was a test-harness correction, not an implementation defect.

## Taste gate and remaining scope

The strict taste inspector still reports 8 FAIL and 4 WARN categories. This is not claimed as a clean taste gate. These include the already documented house-style conflicts (tiny uppercase section headings, hairlines, outlines, resting shadows, italic accent line), neutral photo scrims, retained quotation and the confirmed false-positive CTA occlusion. The established motion policy still takes precedence over the skill's animation/video quota.

No new picture licences, credits, sample content or direction seed apply to this scoped refinement. Physical-device/assistive-technology testing, complete photographic contrast certification, production deployment and form submission remain outside this check.

```text
ROUND 2 — scoped refinement
Seen in one second: Petruskirche's concert interior and the concert title.
Idea (one sentence): The church's real setting carries the atmosphere; its existing editorial structure is preserved.
Live thing: Real data-fed upcoming concerts and existing programme/details/ticket destinations.
Layout words by section: hero=image-overlay / concerts=card grid / quotation=centered statement / architecture=split / planning=paired icon cards / footer=sitemap.
Scores: design 7 · usability 8 · creativity 6 · content 7.5 → overall 6.0.
Caps applied: Strict taste cap of 6.0 while inspector FAILs remain; not a claim of broken layout.
Top three remaining problems (most visible first), each with screenshot and potential follow-up:
1. Generic quotation remains prominent (desktop-page-01.jpg): replace only in a separately approved content/composition change.
2. Repeated fallback venue photos and sparse desktop cards (desktop-page-01.jpg): use genuine event artwork or revisit programme layout.
3. Tiny uppercase section headings remain by design (mobile-page-01.jpg): change the shared heading policy before changing them locally.
```
