ROUND 1
Seen in one second: A warmly lit church interior and a large concert headline.
Idea (one sentence): The Petruskirche's real concert setting supplies the atmosphere, but the composition remains a transferable concert-venue template.
Live thing: A data-fed upcoming programme with Details/Tickets destinations; no distinctive on-page interaction is evident, and links were not exercised.
Layout words by section: hero=image-overlay / concerts=card grid (tablet 2+1; mobile stack) / quotation=centered statement / architecture=split (mobile image then text) / planning=paired icon cards / footer=split sitemap (mobile stack).
Scores: design 7 · usability 7.5 · creativity 6 · content 7.5 → overall 6.5
Caps applied: Weighted score 7.05, capped at 6.5 by visible decorative attribution hairlines and resting-panel shadows. The portable concept also sets a non-binding creativity ceiling of 7. These are strict taste-rubric penalties, not automatically production-design defects. No inspector, motion, placeholder, image-count or clipping cap inferred.
Top three problems (most visible first), each with the screenshot it shows in and the fix:

1. Local imagery, generic organizing idea. After the authentic hero, a portable Victor Hugo quotation and two familiar icon-topped service cards supply most of the editorial character (desktop-page-01.jpg, desktop-page-02.jpg; mobile-page-01.jpg). Another church venue could inherit this sequence almost unchanged. Fix: give the quotation slot venue-specific, verified acoustic/architectural proof and carry that subject into the surrounding editorial structure; preserve the established brand rather than adding decoration. This is a specificity opportunity, not a DESIGN.md violation.
2. The tablet headline crosses the brightest part of the altar. White “in der” and the gold place-name lose separation against the illuminated wall, unlike the darker desktop placement and mobile text field (tablet-fold.jpg versus desktop-fold.jpg and mobile-fold.jpg). Fix: strengthen the localized neutral scrim or adjust tablet crop/text placement. This is a readability defect; neutral photographic scrims are allowed by the taste rules.
3. The programme spends too much space repeating the room instead of differentiating events. The first two cards reuse the same interior image and have large vacant bodies beneath short titles on desktop; tablet leaves the third card alone on a second row; mobile requires successive large image-led cards to compare dates (desktop-page-01.jpg, tablet-page-01.jpg, mobile-page-01.jpg). Fix: retain recognizable event cards but reduce empty height/repeated imagery, use event-specific artwork when available, and make dates/titles the scanning anchors. This is browsing friction, not proof of missing event data.

## Design-specificity verdict

Credible and locally grounded, but not conceptually distinctive. The real church photograph, Kiel-Wik references and concrete visitor/organizer information prevent an anonymous stock-site impression; the hierarchy and lower-page modules remain category-default.

## Fourth ranked issue

4. Primary explanatory copy is visually treated like metadata. The mobile hero's four-line introduction is small and muted; architecture prose is similarly subdued, while its actual section heading reads as a tiny label (mobile-fold.jpg, mobile-page-01.jpg; tablet-page-01.jpg). Hero.astro confirms `text-sm` and reduced-opacity body copy; index.astro also applies `/70` to architecture paragraphs. Fix: restore full body-ink emphasis/readability first. The tiny uppercase H2 treatment is explicitly locked by DESIGN.md, so enlarging those headings requires a design-policy decision, not a conformance fix. Reduced-opacity running prose is a source-backed conformance concern because DESIGN.md assigns that treatment to metadata/helper text. No measured WCAG contrast failure is claimed.

## Strengths

- The five-second answer is clear at all three widths: concerts, Petruskirche Kiel, and a visible programme action. Gold primary versus dark secondary buttons creates a useful action hierarchy.
- The hero uses an authentic, dominant image with a coherent midnight/warm-light palette and a decisive serif/body-type contrast.
- Mobile is deliberately recomposed: its crop, darker text field, two-line title and full-width buttons hold together without visible horizontal overflow. Visit, venue-hire and contact routes remain clearly named.

## Locked design versus taste preferences

- Tiny tracked uppercase H2s, Merriweather/Hanken Grotesk, quieter metadata and restrained motion are explicit brand decisions. Rounded reusable cards and conditional panel shadows are also permitted. Their disagreement with taste house rules is not itself nonconformance.
- The italic gold hero line and attribution hairlines are house-style mismatches, but are not explicitly forbidden by DESIGN.md. Do not report every house-rule mismatch as a brand defect.
- Do not add decorative loops or extra animated elements to satisfy the skill's motion quota: that would conflict with the locked homepage motion policy. Still images cannot establish animation quality anyway.

## Nielsen heuristics — 0–4 severity

| Heuristic                       | Severity | Screenshot-based assessment                                                                            |
| ------------------------------- | -------: | ------------------------------------------------------------------------------------------------------ |
| Visibility of system status     |      n/a | Loading/availability transitions not observed.                                                         |
| Match with the real world       |        0 | Familiar venue language and readable German event dates.                                               |
| User control and freedom        |      n/a | Menu and destination flows not exercised.                                                              |
| Consistency and standards       |        0 | Repeated action, palette and component treatments are coherent.                                        |
| Error prevention                |      n/a | No input/submission flow assessed.                                                                     |
| Recognition rather than recall  |        1 | Duplicate event images offer little recognition support.                                               |
| Flexibility and efficiency      |        1 | Tall mobile cards and tablet's 2+1 arrangement slow comparison.                                        |
| Aesthetic and minimalist design |        2 | Generic quotation and sparse cards consume attention/scroll; tablet hero readability needs correction. |
| Error recognition and recovery  |      n/a | No error state captured.                                                                               |
| Help and documentation          |        0 | Visit/contact routes are signposted; their contents remain untested.                                   |

Cognitive load is mainly perceptual, not choice overload: navigation and actions are manageable, but small headings, subdued prose and repeated imagery weaken scanning. On mobile, large programme cards plus the quotation push practical information farther down; the large action targets and stable frame are compensating strengths. Keyboard access, open-menu behavior and motion are outside screenshot evidence.

## Evidence boundary

Read all seven supplied screenshots and DESIGN.md, index.astro, Hero.astro and globals.css. No inspector/lint logs, report.json, detector findings or public production website were consulted. No implementation changes or interaction tests were performed.

The Christmas poster is visible on tablet/mobile but absent in the desktop capture; the exterior photograph appears on tablet while other captures show a dark image area. These may be transient image-processing/capture states: no permanently broken-image, placeholder or failed-reveal conclusion is justified. Grey unused contact-sheet cells are not website whitespace.
