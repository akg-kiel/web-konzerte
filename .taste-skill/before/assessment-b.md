# Design Critique: Assessment B — local production homepage

## Verdict

The homepage has no root overflow, unintended element collisions, or broken/distorted images at the six tested widths. Two measured P2 refinements remain: a mobile summary clamp/min-height interaction and a short programme-link hit area. The reported CTA text occlusion and blank church photograph are false positives, not missing content.

- **Smoke Test:** Seven detectors at 320, 375, 390, 414, 768, 1440; 247 main-page candidates and 70 actual-menu-open candidates, all triaged below. No confirmed defects among those candidates; the intentional-clamp exemption misses the separate precision finding F-01.
- **AI-Slop Risk:** Not assessed — B is deterministic evidence, not a second full visual inspector.
- **Execution:** Minor issues — two P2 findings, otherwise consistent measured gutters, grid gaps, controls, and type.
- **Spec Conformance:** Strong within measured scope against `DESIGN.md`; not a full token/style audit.
- **Findings:** 2 total — P0: 0 · P1: 0 · P2: 2 · P3: 0.
- **Verified:** Production build at `http://127.0.0.1:4321/`; widths × heights: 320/375/390/414 × 812, 768 × 1024, 1440 × 900; DPR 1. Three concert cards, two service CTA cards, seven images, and one H1 at every width. Native menu Enter, four Tabs and Escape verified at all five menu-enabled widths. Images scrolled into view and decoded; fonts awaited.

## Findings

### P0 — Critical

None.

### P1 — High

None.

### P2 — Medium

#### [F-01] Mobile clamped summary exposes part of an extra line · Inconsistency

- **Dimension:** Containment / precision.
- **Location:** “Home for Christmas” description, `.concert-card p.line-clamp-3.min-h-20`, at mobile widths 320–414.
- **Issue:** Three-line truncation is deliberate and should remain. Its 80px minimum height, however, exceeds three 22.75px line boxes (68.25px), leaving 11.75px in which a partial fourth line can paint after the third-line ellipsis.
- **Impact:** Minor visible cut-glyph/polish issue, not lost access to concert details.
- **Evidence:** At 320: client 206 × 80px vs scroll 206 × 159px; 14px text / 22.75px line height. The painted third-card paragraph in `b-320-concerts.png` shows the ellipsis and partial following “Kompositionen …” line. At 375/390/414, paragraph heights remain 80px and scroll heights are 137/137/114px. At 768/1440, three 26px line boxes total 78px, nearly matching 80px. The reference clipping detector intentionally exempts all line-clamped elements, so this does not appear in its raw counts.
- **Recommendation:** Keep `line-clamp-3`, but remove the paragraph's `min-h-20`; the three-line text box should be 68.25px at mobile text sizing and 78px at the larger sizing. If an 80px reserve is needed for card alignment, put that reserve on a separate wrapper rather than the clipped text box.

#### [F-02] Programme overview link has a 16px-high target · Suggestion

- **Dimension:** Target sizing.
- **Location:** “Alle Termine ansehen”, `#naechste-konzerte a[href="/programm/"]` (one visible responsive instance per width).
- **Issue:** Actual target is 179.55 × 16px at all six widths, versus 44px-high concert controls and 56px-high hero actions.
- **Impact:** Less forgiving touch access to the complete programme. This is a 44px usability recommendation, **not an asserted WCAG failure**; the link has surrounding space and target-spacing exceptions were not exhaustively adjudicated.
- **Evidence:** `smoke.json` → each viewport's `measurements.controls`; visible at the bottom of `b-320-concerts.png`, and top right in `b-1440-hero-focus.png`.
- **Recommendation:** Increase this standalone link from 16px to a minimum 44px-high inline-flex target, keeping its 12px/16px text styling.

### P3 — Low

None.

## What Looks Good (Strengths)

- **Containment:** `scrollWidth === clientWidth === viewport width` at all six widths; zero overflow offenders. `overflow-x: clip` does not merely mask a detected offscreen offender: the offender arrays are also empty.
- **Alignment:** Header, hero, concerts, architecture, service and footer content edges share exactly equal left/right margins: 24/24px at 320–414, 32/32px at 768, 64/64px at 1440; measured asymmetry 0px. The quotation intentionally uses a narrower centered measure (368/368px margins at 1440).
- **Spacing:** Both card grids use 32px gaps at every width; cards in a shared row have equal widths/heights. Concert body padding is consistently 24px top / 32px sides and bottom; CTA padding is 32px throughout (33px measured inset including 1px border). Calendar icons are uniformly 16 × 16px; service icon containers 48 × 48px. Section paddings use 8px multiples: mobile 64/64/64/80px for concerts/quote/architecture/service; tablet 80/176/96/128px; desktop 80/176/128/128px.
- **Type:** Hanken Grotesk and Merriweather both loaded successfully; no meaningful text below 11px. All three concert titles and both service-card titles remain one line at every tested width.
- **Controls:** Hero links are consistently 56px high; Details/Tickets links 44px high; mobile-menu summary 48 × 48px; menu links 64px high except the two naturally wrapped 73px-high links at 320. Primary/card keyboard focus uses a real 2px accent box-shadow ring with 2px dark offset, even though computed outline-style is `none`.
- **Menu:** Native Enter opens at all five mobile/tablet widths; Tab order is Programm → Besuch planen → Raum anfragen → Kontakt, with visible focus. Escape from Kontakt closes, returns focus to summary and restores page visibility in 5/5 cases. Open-menu root widths remain exact, with no overlap or overflow. Two-line labels at 320 are ordinary wrapping, not clipping.

## Spec Conformance (measured subset)

| Rule                            | Spec                               | Observed                                       | Status |
| ------------------------------- | ---------------------------------- | ---------------------------------------------- | ------ |
| Expressive/UI type              | Merriweather / Hanken Grotesk      | Correct loaded families                        | ✓      |
| Shared container gutters        | 24 / 32 / 64px                     | Exact, equal margins at applicable breakpoints | ✓      |
| Content H2 treatment            | Hanken 12px/16px uppercase, accent | Three content H2s match                        | ✓      |
| One dominant H1                 | One hero heading                   | Exactly one, two lines at every width          | ✓      |
| 8px spacing rhythm              | Even Tailwind spacing steps        | Grid 32px; CTA 32px; concert body 24/32px      | ✓      |
| Clamped description containment | Intentional 3-line excerpt         | 80px minimum vs 68.25px mobile line boxes      | F-01   |

### Heading and font measurements

Numbers below are CSS px; `size/line-height · lines`.

| Width | H1         | Content H2 (all 12/16) | Concert H3       | CTA H3         | Quote     |
| ----: | ---------- | ---------------------- | ---------------- | -------------- | --------- |
|   320 | 36/45 · 2  | 1 line; architecture 2 | 20/27.5 · 1 each | 24/32 · 1 each | 24/30 · 4 |
|   375 | 36/45 · 2  | 1 each                 | 20/27.5 · 1 each | 24/32 · 1 each | 24/30 · 4 |
|   390 | 36/45 · 2  | 1 each                 | 20/27.5 · 1 each | 24/32 · 1 each | 24/30 · 4 |
|   414 | 36/45 · 2  | 1 each                 | 20/27.5 · 1 each | 24/32 · 1 each | 24/30 · 3 |
|   768 | 72/90 · 2  | 1 each                 | 20/27.5 · 1 each | 30/36 · 1 each | 36/45 · 3 |
|  1440 | 96/120 · 2 | 1 each                 | 20/27.5 · 1 each | 30/36 · 1 each | 36/45 · 3 |

- Body: Hanken Grotesk. Hero intro and concert description: 14/22.75 on tested mobile widths; 16/26 at 768/1440. Architecture prose: 16/28 → 18/32. Service copy: 16/28 throughout. Footer/contact: 14/24, with copyright 16/28 from tablet. Metadata/control labels: 12/16, weight 600, tracking 1.2px. Heading tracking: H1 −0.9 / −1.8 / −2.4px; concert H3 −0.5px.
- The footer H2 contains a logo rather than text; text-line count 0 is intentional, with an accessible linked-image name.

### Exact card/grid dimensions

| Width | Concert column widths | Concert heights          | CTA widths | CTA heights |
| ----: | --------------------- | ------------------------ | ---------- | ----------- |
|   320 | 272                   | 421 / 421 / 567          | 272        | 382 / 438   |
|   375 | 327                   | 446.25 / 446.25 / 592.25 | 327        | 354 / 382   |
|   390 | 342                   | 457.5 / 457.5 / 603.5    | 342        | 354 / 382   |
|   414 | 366                   | 475.5 / 475.5 / 621.5    | 366        | 326 / 382   |
|   768 | 336 / 336             | 453 / 453; next row 599  | 336 / 336  | 386 / 386   |
|  1440 | 416 / 416 / 416       | 659 / 659 / 659          | 640 / 640  | 302 / 302   |

Different heights in different rows reflect different amounts of copy, not inconsistent padding. Cards on the same row align exactly. Other targets below 44px: offscreen-until-focused skip link 218.28 × 42px, footer contact links 24px high, footer Home 36.73 × 44px. Only the standalone programme link is below 24px in either dimension; no tiny-target claim is made about inner CTA text spans or decorative icons, because their whole ancestor card is the interactive target.

## Detector counts and false positives

Original seven reference algorithms were executed with result caps removed; no hits were silently truncated. These are **raw candidates**, not defect counts.

|          Width | Overflow offenders | Overlap pairs | Clipping |  Edge | Broken/distorted images | Zero/ghost | Unreadable |   Total |
| -------------: | -----------------: | ------------: | -------: | ----: | ----------------------: | ---------: | ---------: | ------: |
|            320 |                  0 |             2 |        2 |     1 |                       0 |         11 |         23 |      39 |
|            375 |                  0 |             2 |        2 |     1 |                       0 |         11 |         23 |      39 |
|            390 |                  0 |             2 |        2 |     1 |                       0 |         11 |         23 |      39 |
|            414 |                  0 |             3 |        2 |     1 |                       0 |         11 |         23 |      40 |
|            768 |                  0 |             6 |        2 |     1 |                       0 |         11 |         23 |      43 |
|           1440 |                  0 |            10 |        1 |     1 |                       0 |          8 |         27 |      47 |
| **Main total** |              **0** |        **25** |   **11** | **6** |                   **0** |     **63** |    **142** | **247** |

Actual menu-open state: each of 320/375/390/414/768 produces 0 overflow, 0 overlap, 1 clipping, 0 edge, 0 image, 7 zero/ghost and 6 unreadable candidates = 14 each, **70 total**. Overall **317 candidates**.

Triage:

- **25 overlaps:** Intentional hero photograph behind heading/copy/buttons and fixed navigation; some also intersect the offscreen skip-link box. Not text-on-text/control collisions. Detector visibility ignores viewport intersection and clipping ancestors, so raw y coordinates can be negative. Fold images confirm the actual presentation.
- **16 clipping candidates across both states:** Only `sr-only` accessibility spans, intentionally 1 × 1px. Not visible labels. Descriptions are intentionally line-clamped; all three title clamps are inactive with current one-line titles. Do not confuse generic truncation with the specific extra-line painting in F-01.
- **6 edge candidates:** The intentional full-bleed hero image, not copy or controls.
- **98 zero/ghost candidates across states:** Hidden desktop navigation, closed `<details>` descendants, responsive hidden arrows/spans; in menu-open measurements, the three pending concert-reveal articles are opacity 0 but also under the page region whose `visibility` is hidden. None covers an active menu control. The reference helper does not evaluate ancestor visibility, `<details>` rendering suppression, or whether a blocker overlaps an interactive target.
- **172 unreadable candidates across states:** The regex parser assumes numeric sRGB, but current CSS emits `oklab(...)` / alpha colors. Its 1.00–1.13 ratios are invalid. Canvas conversion to sRGB plus ancestor background/foreground alpha compositing finds **zero failures** among 33 text-bearing nodes per mobile/tablet width and 37 at desktop; minimum **5.90:1** on non-photo/non-header solid surfaces. This does not certify contrast against photographs, gradients, backdrop blur, or transient animation frames. Menu raw contrast warnings have the same parser issue; menu screenshots are retained, not claimed as a complete pixel-level WCAG contrast certification.

### CTA covered-text check: false positive

`CtaCard.astro` renders `<Card as="a">`; `Card.astro` makes that actual `<a>` contain the H3, paragraph and CTA span. This is a whole-card link, **not an unrelated stretched overlay**. Both cards have zero nested anchors and no generated overlay (`::before` content `none`). At all six widths, hit-testing the two H3 text centers returns that H3 itself, inside its own correctly routed card link: **12/12 correct, zero occlusions**. `b-320-cta-cards.png` and `b-1440-cta-cards.png` show the text unobstructed.

Concert cards are intentionally different: their empty absolute full-card anchor sits behind `pointer-events:none` copy, while explicit Details/Tickets links are above it. All **18/18** concert-title text-center tests return their own card's details-route overlay, not a foreign blocker. It is `aria-hidden` and `tabindex=-1`; named Details/Tickets links remain keyboard reachable. This is a deliberate card click target, not covered text.

### Church photograph: loaded and visibly rendered

The church image initially had `complete:false`, natural 0 × 0; it was lazy/unfinished, not a completed failure. After actual scrolling, **all 7/7 images decoded successfully**. The church then decoded and rendered at every width:

| Width | Natural dimensions\* | Rendered box |
| ----: | -------------------- | ------------ |
|   320 | 320 × 485            | 270 × 338    |
|   375 | 375 × 568            | 325 × 406.75 |
|   390 | 389 × 591            | 340 × 425.5  |
|   414 | 414 × 627            | 364 × 455.5  |
|   768 | 768 × 1164           | 326 × 408    |
|  1440 | 1440 × 2184          | 622 × 778    |

_Browser `naturalWidth/Height` values reflect responsive image density correction, not necessarily the response file's raw dimensions. `object-fit:cover` intentionally crops the portrait source; it does not stretch it. Opacity is 1, visibility visible, clip-path none on image/ancestors; center hit-testing returns IMG at all widths. \*\*Use `b-_-church-verified.png`\*\*: each was captured after scrolling to the image and decoding, and visibly contains the church photograph. Initial offscreen region/full-document screenshots can show compositor blanks even after decode; they are not proof of missing production content. No HTTP errors or runtime exceptions were recorded during the main pass.

### Static source detector

Executed exactly:

```sh
node .pi/skills/impeccable/scripts/detect.mjs --json src/pages/index.astro src/components/sections/Hero.astro src/components/sections/ConcertCard.astro src/components/sections/CtaCard.astro src/components/layout/Header.astro
```

Exit 0; JSON `[]`: **0 findings**. Saved as `assessment-b-static.json` (stderr empty).

## Top 3 Actions

1. Separate the 80px summary reserve from the three-line clipped text box (F-01).
2. Raise “Alle Termine ansehen” from 16px to a 44px-high target (F-02).
3. Preserve the native menu, whole-card CTA links, and decoded church photograph; do not “fix” the detector false positives.

## Evidence and limitations

- `b-measurements.json`: compact exact measurements, assertions and verified menu results.
- `smoke.json`: complete detector outputs, structure discovery, font/box/line measurements, decoded-image states and hit tests at six widths.
- `b-confirmations.json`: valid keyboard menu checks, rendered-photo confirmation, corrected solid-surface contrast and focus-ring evidence.
- `smoke-check.mjs`, `confirm-check.mjs`: zero-dependency runnable diagnostics; both close their browser in `finally`. Offline evidence consistency assertions passed.
- `b-*-fold.png`, `b-*-page.png`, region captures; prefer `*-verified.png` for menu/photo. `b-320-concerts.png` has offscreen compositor blanks in its earlier cards; only its painted third-card text is cited, not those blanks.
- Initial keyboard harness omitted Enter's CR character: its `smoke.json.menu.opened:false` results are **invalid menu-open evidence**, not a product defect. The bounded targeted confirmation supplied CR, verified 5/5 successes, and corrected the saved runnable script. No full general-purpose inspector was repeated.
- One early diagnostic attempt failed on an undefined local `selector` before finishing the matrix; it was corrected. The complete saved matrix and targeted confirmation both exited 0. These harness limitations are not UI findings.
- CSS viewport emulation in desktop Chromium, not physical mobile/AT/browser-matrix/zoom testing. No full contrast, performance, navigation destination or loading-error-state certification. Optical alignment was not assigned speculative pixel “fixes”.
- Read-only review only: no production source edits, subagents, server start/stop, emails/forms, external mutations, secrets, production checks, or reading `assessment-a.md`. Only diagnostic files under `.taste-skill/before` were written.
