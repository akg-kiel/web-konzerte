<!-- Hallmark · pre-emit critique: P4 H4 E4 S5 R4 V4 -->

# Design Critique: Petruskirche homepage

Method: dual-agent — independent screenshot assessment A and deterministic browser assessment B, synthesized against the requested design-taste-frontend rubric. Contributions and raw evidence are in `before/assessment-a.md` and `before/assessment-b.md`.

## Verdict

Authentic church photography, a clear identity and a usable mobile composition give this page a strong foundation. The main opportunity is hierarchy: dates and practical content deserve more prominence than the generic quotation and repeated venue images. Review only; no production source, design policy, routes or content were changed.

- **Smoke Test:** No confirmed root overflow, unrelated occlusions or broken/distorted images at 320, 375, 390, 414, 768 and 1440px. Two additional precision findings below.
- **AI-Slop Risk:** Low to moderate, concentrated in the lower page: portable quotation, icon-topped service panels and repeated card treatment. Authentic imagery and deliberate typography prevent an anonymous template impression.
- **Execution:** Minor issues — one excerpt containment issue and one small standalone link target. Containers and repeated components otherwise align consistently.
- **Spec Conformance:** Strong overall; reduced-opacity running prose is a concern. Tiny uppercase section headings explicitly conform to `DESIGN.md`, even though the requested taste rubric rejects them.
- **Findings:** 6 — P0: 0 · P1: 2 · P2: 4 · P3: 0.
- **Verified:** Local production build, six emulated widths, loaded fonts/images, whole-card hit testing, keyboard menu open/Tab/Escape at five menu-enabled widths. Original inspector screenshots at 1440, 768 and 390 were all reviewed; selected targeted captures were also reviewed.
- **Not verified:** Physical phones, assistive technology, full photographic contrast, destination pages/forms, failed-data states, live production or launch readiness.

## Findings

### P0 — Critical

None confirmed within the tested scope.

### P1 — High

#### [F-01] Tablet headline crosses the brightest altar area · Gap

- **Dimension:** Readability / composition.
- **Location:** `src/components/sections/Hero.astro:15–49`; `before/tablet-fold.jpg`.
- **Issue:** White lettering and the gold location line lose separation against the illuminated altar at 768px. Desktop and phone compositions have darker backgrounds behind the title.
- **Impact:** The page's most important words are harder to read at this intermediate size.
- **Evidence:** Screenshot-based finding; no numerical photo-background WCAG failure is claimed.
- **Recommendation:** Adjust the tablet crop, title placement or localized neutral photographic scrim. Preserve the existing photo and type system; do not add a decorative gradient.

#### [F-02] Running prose is treated like secondary metadata · Inconsistency

- **Dimension:** Typography / hierarchy.
- **Location:** `src/components/sections/Hero.astro:52`, `src/pages/index.astro:46`, `src/components/sections/CtaCard.astro:26`.
- **Issue:** Primary explanatory paragraphs use `text-role-on/70` (hero `/75` from tablet). The phone introduction is 14px/22.75px. `DESIGN.md` specifies `role-on` for body, reserving reduced opacity for metadata/helper copy.
- **Impact:** Useful information recedes while decorative display content receives greater emphasis.
- **Evidence:** `before/mobile-fold.jpg`, `before/b-1440-church-verified.png`, and measured computed type values.
- **Recommendation:** Use full `text-role-on` for running prose. Consider `text-base` (16px) for the phone introduction while retaining the existing Tailwind scale. Keep genuinely secondary metadata quieter. This is not an asserted contrast failure: corrected checks on solid backgrounds found no failure.

### P2 — Medium

#### [F-03] Mobile excerpt paints part of a fourth line · Inconsistency

- **Dimension:** Containment / precision.
- **Location:** `src/components/sections/ConcertCard.astro:99–100`, “Home for Christmas” summary.
- **Issue:** `min-h-20 line-clamp-3` forces an 80px clipped box despite three mobile line boxes totaling 68.25px (3 × 22.75px). Part of another line paints below the ellipsis.
- **Impact:** Visibly cut glyphs make the excerpt look unfinished. The details destination remains available.
- **Evidence:** `before/b-320-concerts.png`; measured at 320–414px. Larger text uses three 26px lines, totaling 78px.
- **Recommendation:** Remove `min-h-20` from the clamped paragraph. Target its natural three-line height: 68.25px on phone, 78px at larger text sizing. If alignment needs an 80px reserve, apply that reserve outside the clipped paragraph.

#### [F-04] Programme overview has a short touch target · Suggestion

- **Dimension:** Target sizing.
- **Location:** `src/components/sections/Concerts.astro:44`, visible “Alle Termine ansehen” link.
- **Issue:** Its actual hit area is approximately 179.55 × 16px, compared with 44px-high card controls and 56px-high hero actions.
- **Impact:** A useful route to the full programme is less forgiving on touchscreens.
- **Evidence:** Same measured height at all six widths; `before/b-measurements.json`.
- **Recommendation:** Make the visible overview link an inline-flex target at least 44px high without necessarily enlarging its text. This is a usability recommendation, not a claimed WCAG target-spacing violation.

#### [F-05] Programme layout spends space on repetition rather than comparison · Suggestion

- **Dimension:** Information hierarchy / browsing efficiency.
- **Location:** Homepage concert grid; `before/desktop-page-01.jpg`, `before/tablet-page-01.jpg`, `before/mobile-page-01.jpg`.
- **Issue:** The first two cards repeat the same church image. Three desktop cards each measure 659px high despite sparse copy in the first two; tablet uses a 2+1 arrangement, and phone stacks substantial images before subsequent dates. Date labels remain 12px/16px with 1.2px tracking.
- **Impact:** Comparing upcoming events takes more scanning and scrolling than necessary.
- **Recommendation:** Reduce redundant image/empty-body height, emphasize dates and titles, and use event-specific artwork when genuinely available. Do not invent missing programme copy or imagery. Enlarging dates or changing the locked H2 treatment should be an explicit design-policy decision, not an incidental fix.

#### [F-06] The lower page loses the hero's local specificity · Suggestion

- **Dimension:** Concept / composition; taste-based opportunity.
- **Location:** `src/pages/index.astro:29–39,70–94`; quotation and service panels.
- **Issue:** A portable Hugo quotation and familiar icon-topped panels could be transferred to another venue. The quotation has 176px padding above and below from tablet, while functional section headings are 12px.
- **Impact:** Atmosphere continues, but the scroll adds less venue-specific substance than the first screen promises.
- **Recommendation:** Consider replacing the quotation slot with verified proof about this church's acoustics, timber structure or concert experience, using existing venue imagery. Keep the visitor and organizer destinations. Replacing factual copy or changing the documented homepage composition needs approval first.

### P3 — Low

None added merely to fill the report.

## What Looks Good (Strengths)

- **Orientation:** Concerts, Petruskirche Kiel and the next action are understandable within five seconds. The primary programme button is visibly distinct from visitor information.
- **Identity:** Real venue photography and Merriweather/Hanken Grotesk produce a credible cultural-venue atmosphere without invented proof.
- **Responsive craft:** One two-line H1 at every tested width; exact equal outer gutters of 24px on phones, 32px at 768 and 64px at 1440; repeated grids use consistent 32px gaps.
- **Interaction:** Hero controls are 56px high, card controls 44px, menu trigger 48 × 48px. Native menu opening, tab order and Escape/focus restoration passed at all five menu-enabled widths.
- **Real content:** The programme is data-fed. Do not add a gimmicky “live thing” simply to satisfy a gallery convention.

## Spec Conformance

| Rule           | Spec                                      | Observed                                | Status                                |
| -------------- | ----------------------------------------- | --------------------------------------- | ------------------------------------- |
| Type families  | Merriweather / Hanken Grotesk             | Both loaded correctly                   | Conforms                              |
| Palette        | Midnight canvas, warm accent              | Existing named tokens preserved         | Conforms                              |
| Content H2s    | 12px/16px, uppercase, tracked             | Matches all three content headings      | Conforms; conflicts with taste rubric |
| Shared gutters | 24 / 32 / 64px                            | Exactly equal at applicable breakpoints | Conforms                              |
| Body emphasis  | `role-on`; lower opacity for metadata     | Running paragraphs use `/70` or `/75`   | Concern: F-02                         |
| Motion         | Restrained, optional, no decorative loops | Existing approach retained              | Do not add animation to meet a quota  |

## Gate results and triage

- `pnpm install --frozen-lockfile --offline` and `pnpm exec astro build` succeeded. This was not a full `pnpm build`/quality run and no deployment occurred.
- Requested taste inspector, local production homepage at 1440/768/390: **8 FAIL categories, 4 WARN categories**, retained unchanged in `before/inspector.log` and `before/report.json`.
- Taste source lint across eight homepage-related files: **32 FAIL occurrences, 4 WARN occurrences**. These are style-rule matches, not 32 functional defects.
- Supplemental source detector: **0 findings**. It checks different rules and does not establish a clean taste gate.
- Inspector `covered-text` is a confirmed false positive: the service H3s belong to their own whole-card links, with 12/12 correct hit tests and no foreign blocker. No “occlusion fix” is needed.
- Initial blank church images were unfinished lazy/image processing captures, not broken content. All seven images decoded; targeted scrolled captures confirm the church image rendered at every width.
- Raw smoke detectors generated 317 candidates; documented triage excludes intentional image layering, hidden responsive/menu content, accessibility-only spans and a color parser that does not support computed Oklab colors. The independently confirmed excerpt issue remains F-03.
- Gradient flags need contextual review: neutral photographic scrims are allowed. Sticky-navigation depth also differs from shadows on resting content. Do not globally delete these declarations based on the lint count.
- Tiny uppercase H2s, conditional shadows and restrained motion are established project choices. They are not automatically implementation defects because a different house style rejects them. The taste gate is **not claimed passed**.

## Final taste critique

```text
ROUND 1 — review only
Seen in one second: A warmly lit Petruskirche concert interior.
Idea (one sentence): The church's real setting carries the atmosphere, but the organizing composition remains transferable to another concert venue.
Live thing: Data-fed upcoming programme with real Details/Tickets destinations; no new interaction built.
Layout words by section: hero=image-overlay / concerts=card grid / quotation=centered statement / architecture=split / planning=paired icon cards / footer=sitemap.
Scores: design 7 · usability 7.5 · creativity 6 · content 7.5 → overall 6.0.
Caps applied: Weighted assessment 7.05; strict taste overall capped at 6.0 because inspector FAILs remain. This is house-style compliance, not a finding that the site is broken.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. Tablet title loses separation against the altar (tablet-fold.jpg): adjust tablet placement/crop or neutral scrim.
2. Dates and useful explanatory text are subordinate to display content (mobile-fold.jpg, desktop-page-01.jpg): strengthen prose and programme hierarchy, with approval for locked heading changes.
3. The local concept becomes generic after the hero (desktop-page-01.jpg, desktop-page-02.jpg): replace the portable quotation with approved, verified venue-specific proof.
```

## Top 3 Actions

1. Correct tablet title separation and restore body-text emphasis within the existing brand.
2. Fix the two bounded implementation details: excerpt minimum height and programme-link hit area.
3. If a broader refinement is wanted, approve programme-density and quotation-slot changes before changing the locked design policy.

No direction/seed was dealt: this is the existing-page review branch, which stops before redesign. No redraws, imported images, clips, replacement drawings, sample content or new credit obligations were introduced. Existing asset provenance was not re-audited. No additional animation is recommended against the project's explicit motion policy.

Questions skipped: this invocation was conservatively scoped to a read-only homepage review; implementation and brand-policy changes remain a separate decision.
