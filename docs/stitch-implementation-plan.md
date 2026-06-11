# Stitch Implementation Plan — Website Konzerte

**Project:** Linear `Website Konzerte` (`03e54a9b-442c-4b00-bba0-fff36b06466e`)  
**Active delivery issue:** `AKG-17` — Build Home page (`/`) with hero and concert preview  
**Design source of truth:** Stitch project `6221185249843486689` — **Kieler Konzertkirche** / theme **Nordic Resonance**  
**Repo source of truth:** Astro + React + Tailwind + Bun static site in `/home/zepi/Projects/web-konzerte`  
**Last updated:** 2026-06-11

## 1. Goal

Implement the Stitch-made Konzertkirche design quickly enough for visual iteration, while keeping Linear as the project-management source of truth and preserving a coherent milestone plan.

The delivery strategy is **vertical-slice first**:

1. establish design tokens and shared page shell,
2. ship a homepage slice that exercises real navigation, hero, and concert-card patterns,
3. validate visually and technically,
4. then expand the same system to programme, detail, visit/contact/legal, event-host, and accessibility work.

This plan is intentionally a planning artifact only. It does not change production source code.

## 2. Source mapping: repo × Linear × Stitch

| Source               | Current facts                                                                                                                                                                                                  | Implementation implication                                                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repo                 | Astro 5, React 19, Tailwind CSS 4, TypeScript, Bun, Cloudflare Workers static assets. `src/pages/index.astro` is still a scaffold with a React Counter island. `src/styles/globals.css` only imports Tailwind. | Start with low-risk static Astro components and Tailwind tokens. Use React islands only if interactivity is required.                                                        |
| Repo structure       | Expected structure: `src/components/layout`, `src/components/sections`, `src/components/ui`, `src/layouts`, `src/pages`, `src/styles`.                                                                         | Keep generated shadcn/ui in `src/components/ui`; build bespoke layout/section components outside that folder.                                                                |
| Repo workflow        | Bun is the required runtime/package manager. Normal gates: `bun run lint`, `bunx tsc --noEmit`, `bun run build`, `bun run preview`.                                                                            | Every implementation slice should stay buildable; quality gates can be tiered so visual iteration is not blocked by non-critical polish.                                     |
| Linear project       | `Website Konzerte`, status `In Progress`, target date `2026-07-05`. Milestones: Phase 1 MVP (35%), Phase 2 Expansion (0%), Phase 3 Enhancement (0%).                                                           | Linear remains the planning source of truth. Work should map to AKG issues and milestone phases.                                                                             |
| Linear active issue  | `AKG-17` is In Progress for homepage with dependencies `AKG-6`, `AKG-7`, `AKG-8`, `AKG-9`.                                                                                                                     | Treat AKG-17 as the first integration issue; complete its dependency surface through the first vertical slice.                                                               |
| Linear architecture  | Linear document “Site Architecture: Concert Landing Page” defines `/`, `/programm`, `/kontakt`, legal pages, later `/ueber-uns` and `/fuer-veranstalter`.                                                      | Preserve existing IA unless a deliberate Linear update changes it. Stitch navigation labels can be implemented as routes or anchors after route confirmation.                |
| Stitch project       | `6221185249843486689`, title `Kieler Konzertkirche`, desktop design, updated 2026-06-11.                                                                                                                       | Use Stitch as visual/design source of truth for layout, hierarchy, colors, typography, cards, nav, CTAs, and page rhythm.                                                    |
| Stitch design system | Dark-mode editorial “Nordic Resonance”: EB Garamond headings, Hanken Grotesk body/UI, `#020617` midnight, `#1E293B` slate, `#e9c349` gold, glassmorphism, 12-column desktop grid, 4-column mobile grid.        | First coding task should translate tokens into CSS custom properties/Tailwind utilities before page sections are built.                                                      |
| Stitch local exports | Expected path: `stitch-exports/kieler-konzertkirche/` with HTML/image exports for five screens.                                                                                                                | Implementation should reference local exports for copy/layout extraction and screenshot comparison. If a worktree lacks the exports, restore them before coding from Stitch. |

## 3. Stitch screen mapping to implementation scope

| Stitch screen                                                  | Target route/component                                                            | Linear issue(s)                                        | Priority                       | Notes                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `01-startseite` — Startseite / Konzertkirche Petruskirche Kiel | `/`, shared nav/footer, hero, upcoming concerts, location/story, visit/event CTAs | `AKG-17`, `AKG-6`, `AKG-7`, `AKG-8`, `AKG-9`, `AKG-10` | Phase 1 / first vertical slice | Primary fidelity target. Must satisfy AKG-17 acceptance criteria.                                              |
| `02-programm` — Programm & Tickets                             | `/programm` and reusable concert-list/card patterns                               | `AKG-18`, reuse `AKG-9`, `AKG-10`                      | Phase 1 after homepage slice   | Build after homepage card and token patterns settle.                                                           |
| `03-konzert-detail-die-passion-2026`                           | Static detail page or programme detail section                                    | `AKG-18` plus likely follow-up subtask                 | Phase 1.5                      | Use as prototype for future per-concert detail pages; avoid dynamic routing initially unless approved.         |
| `04-besuch-planen` — Besuch planen                             | Visit-planning section/page; reconcile with `/kontakt` IA                         | `AKG-21`, maybe AKG-17 homepage CTA                    | Phase 1                        | Open route decision: either dedicated `/besuch-planen` or folded into `/kontakt`. Do not block homepage slice. |
| `05-raum-anfragen` — Raum anfragen                             | `/fuer-veranstalter` or `/fuer-veranstalter/anmietung`                            | `AKG-20`                                               | Phase 2                        | Keep as expansion after attendee MVP is stable.                                                                |

## 4. Scope boundaries

### In scope for the first implementation wave

- Translate the Stitch design system into project tokens and base styles (`AKG-10`).
- Implement shared static layout shell: header/nav, ticket CTA, footer (`AKG-6`, `AKG-7`).
- Implement homepage vertical slice from `01-startseite` (`AKG-17`, `AKG-8`, `AKG-9`).
- Keep content static and local, with simple typed data objects if helpful.
- Preserve WCAG AA basics: semantic landmarks, accessible link/button names, visible focus, contrast checks, alt text strategy.
- Keep deployment-compatible static output for Cloudflare Workers.

### Out of scope for the first implementation wave

- CMS/data backend, live ticketing integration, dynamic routing, authentication, payments, or forms with server-side submission.
- Full pixel-perfect implementation of every Stitch page before the homepage feedback loop proves the system.
- Production deployment changes.
- Legal text finalization beyond placeholder page structure unless approved by the project owner.

## 5. Fast iteration model

### Loop cadence

Use short implementation loops that keep the site runnable after every slice:

1. **Pick one visual slice** from this plan and link it to a Linear issue.
2. **Implement the smallest useful version** in Astro/Tailwind.
3. **Run light checks**: route loads, responsive spot-check, no obvious accessibility regressions.
4. **Capture feedback**: screenshot/manual notes against the relevant Stitch export.
5. **Patch immediately** for high-impact design mismatches.
6. **Run hard gates** before marking a Linear issue ready for review.
7. **Update Linear** with the delta, screenshots/manual notes, and next slice.

### Quality gates by speed tier

| Tier         | When                            | Required checks                                                                                                               | Purpose                                                            |
| ------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Preview gate | During visual experimentation   | `bun run dev`, browser spot-check at mobile/tablet/desktop, compare against Stitch export, note obvious contrast/focus issues | Keeps iteration fast and visual.                                   |
| Slice gate   | Before asking for design review | `bun run lint`, `bunx tsc --noEmit`, responsive manual notes, key keyboard navigation checks                                  | Catches code and accessibility regressions without over-polishing. |
| Merge gate   | Before PR/review completion     | `bun run build`, Cloudflare static output sanity, WCAG AA checklist for touched routes, all links functional                  | Protects production quality and AKG acceptance.                    |

### Visual feedback protocol

- Use the Stitch screen name in every review note, e.g. `01-startseite`.
- Track fidelity in three passes:
  - **Pass A — structure:** page sections, IA, content hierarchy, responsive stack.
  - **Pass B — style:** colors, typography, spacing, glass layers, card treatment.
  - **Pass C — polish:** hover/focus states, imagery crop, microcopy, final spacing.
- Do not let Pass C block another route from reaching Pass A/B unless it affects accessibility, brand perception, or a Linear acceptance criterion.

## 6. Dependency order and milestone plan

### Phase 0 — Planning and design handoff readiness

| Order | Work                                                                                                      | Linear target                       | Done when                                                                                                             |
| ----- | --------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 0.1   | Confirm Stitch exports/design system are present in the implementation worktree or re-export from Stitch. | Project note / AKG-17 comment       | `stitch-exports/kieler-konzertkirche/` (or equivalent export bundle) is available for implementation and screenshots. |
| 0.2   | Keep this plan linked from Linear.                                                                        | Project document + `AKG-17` comment | Linear has a synced plan document and AKG-17 points to it.                                                            |

### Phase 1 — MVP for concert attendees

| Order | Work                                                                                                                                           | Linear target                | Dependencies      | Done when                                                                                       |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| 1.1   | Design tokens and global base styles from Stitch (`EB Garamond`, `Hanken Grotesk`, midnight/slate/gold palette, spacing rhythm, focus styles). | `AKG-10`                     | Phase 0           | Tokens are documented in code and used by the first page shell.                                 |
| 1.2   | Header/navigation with Stitch glassmorphic top bar, ticket CTA, responsive menu strategy.                                                      | `AKG-6`                      | `AKG-10`          | Nav supports Stitch labels and existing IA, is keyboard accessible, and works on mobile.        |
| 1.3   | Footer with navigation, legal links, external Petruskirche link, contact basics.                                                               | `AKG-7`                      | `AKG-10`          | Footer satisfies AKG-7 basics and does not fight the dark editorial design.                     |
| 1.4   | Homepage hero from `01-startseite`: headline, subcopy, primary/secondary CTAs, imagery treatment.                                              | `AKG-8`, `AKG-17`            | `AKG-6`, `AKG-10` | Hero passes AKG-17 CTA and responsive acceptance criteria.                                      |
| 1.5   | Upcoming concerts section/card pattern from `01-startseite`, ready to reuse for `/programm`.                                                   | `AKG-9`, `AKG-17`            | `AKG-10`          | 3–4 concerts display with date/time/title/price/ticket/detail states.                           |
| 1.6   | Integrate homepage sections: brief architecture/room-sound story, visit/event CTAs, sticky nav behavior if chosen.                             | `AKG-17`                     | `AKG-6`–`AKG-10`  | AKG-17 acceptance criteria are met; page is ready for review.                                   |
| 1.7   | Programme page from `02-programm`, reusing concert data/cards.                                                                                 | `AKG-18`                     | `AKG-9`, `AKG-10` | `/programm` shows schedule, filters/categories if static, ticket CTAs, and archive placeholder. |
| 1.8   | Contact/visit/legal foundation.                                                                                                                | `AKG-21`, `AKG-22`, `AKG-23` | Shared layout     | Required user paths and German legal routes exist before public launch.                         |

### Phase 2 — Expansion for organization and event hosts

| Order | Work                                                          | Linear target | Dependencies                    | Done when                                                               |
| ----- | ------------------------------------------------------------- | ------------- | ------------------------------- | ----------------------------------------------------------------------- |
| 2.1   | About/organization page based on IA and available content.    | `AKG-19`      | Shared layout, content approval | `/ueber-uns` communicates mission, history, partners/team placeholders. |
| 2.2   | Event-host/venue inquiry page from Stitch `05-raum-anfragen`. | `AKG-20`      | Shared layout, route decision   | Venue specs, inquiry CTA, and rental path are coherent and static.      |

### Phase 3 — Enhancement and hardening

| Order | Work                                                    | Linear target         | Dependencies   | Done when                                                                                       |
| ----- | ------------------------------------------------------- | --------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| 3.1   | Accessibility audit/remediation across delivered pages. | `AKG-11`              | Phase 1 pages  | WCAG AA checklist passes for semantics, keyboard, focus, contrast, images.                      |
| 3.2   | Performance/SEO polish.                                 | `AKG-11` or follow-up | Stable pages   | Build output is small, static, and Cloudflare-ready; metadata is complete.                      |
| 3.3   | Archive/detail page expansion.                          | `AKG-18` follow-up    | Programme page | Detail and archive patterns are implemented without introducing unnecessary dynamic complexity. |

## 7. AKG-17 acceptance coverage

| AKG-17 acceptance criterion                      | Planned evidence                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Home page displays correctly with all sections   | Screenshot/manual comparison to `01-startseite` after Pass B.                                          |
| Hero has concert highlight with clear ticket CTA | `AKG-8` slice includes hero CTA and prominent next-event context.                                      |
| Upcoming concerts preview shows 3–4 concerts     | `AKG-9` cards rendered on `/` and reused for `/programm`.                                              |
| Sticky navigation works on scroll                | Confirm expected behavior during `AKG-6`; implement if still desired after responsive review.          |
| All links are functional                         | Slice/merge gate checks nav, CTAs, legal, external link `rel="noopener noreferrer"`.                   |
| Page is fully responsive                         | Manual notes at mobile, tablet, desktop; no horizontal overflow.                                       |
| Accessibility standards met (WCAG AA)            | Semantic landmarks, keyboard navigation, focus states, contrast notes; later hardening under `AKG-11`. |
| Performance optimized for Cloudflare Workers     | Static Astro output, lazy images below fold, minimal React islands, `bun run build`.                   |

## 8. Implementation notes for the first vertical slice

- Prefer Astro components for static sections:
  - `src/components/layout/Header.astro`
  - `src/components/layout/Footer.astro`
  - `src/components/sections/Hero.astro`
  - `src/components/sections/ConcertPreview.astro`
- Use React only for genuinely interactive elements (e.g. mobile menu if Astro-only behavior is insufficient).
- Consider a static data file for concerts once multiple pages share content, e.g. `src/data/concerts.ts`, with strict TypeScript types.
- Keep image handling explicit: choose source assets, define alt text, and document crop choices against Stitch screenshots.
- Keep design tokens close to existing Tailwind v4 setup: CSS variables in `src/styles/globals.css` first; only expand Tailwind config if needed.
- Route decision checkpoint before coding visit/event-host pages:
  - Stitch nav uses `Besuch planen`, `Die Petruskirche`, `Raum anfragen`, `Kontakt`.
  - Linear architecture uses `/kontakt`, `/ueber-uns`, `/fuer-veranstalter` plus legal pages.
  - Recommendation: do not block homepage; resolve route labels during `AKG-21`/`AKG-20` planning and document the final mapping in Linear.

## 9. Risk register

| Risk                                                               | Impact                                            | Mitigation                                                                                                |
| ------------------------------------------------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Stitch exports are missing from a local worktree                   | Implementation loses reliable visual reference    | Phase 0 preflight: restore `stitch-exports/kieler-konzertkirche/` or re-export from Stitch before coding. |
| Visual experimentation bypasses Linear                             | Project plan drifts and tickets become inaccurate | Every slice links to an AKG issue and receives a Linear comment with shipped delta, gates, and next step. |
| Trying to pixel-perfect all screens before homepage feedback       | Slow delivery and large rework                    | Vertical-slice model: homepage first, Pass A/B before Pass C polish across all pages.                     |
| Stitch IA and Linear IA diverge (`Besuch planen`, `Raum anfragen`) | Route churn and broken navigation                 | Explicit route decision checkpoint before `AKG-21`/`AKG-20`; keep homepage CTAs resilient.                |
| Dark glassmorphism harms contrast/readability                      | Accessibility failures                            | Contrast checks at slice and merge gates; gold accents used sparingly; visible focus styles.              |
| Image assets/crops are not production-ready                        | Design fidelity and performance issues            | Select/crop images in the first slice; document alt text and responsive sizes; lazy-load below fold.      |
| Placeholder legal/contact content ships unnoticed                  | Compliance risk                                   | Track `AKG-22` and `AKG-23` as Phase 1 launch blockers unless owner explicitly scopes launch otherwise.   |

## 10. Linear sync payload

### Suggested Linear document title

`Stitch Implementation Plan — Website Konzerte`

### Suggested AKG-17 comment

```markdown
Plan update for fast Stitch implementation:

- Design source of truth: Stitch project `6221185249843486689` / `Kieler Konzertkirche`, local exports under `stitch-exports/kieler-konzertkirche/`.
- First vertical slice: `AKG-10` design tokens → `AKG-6` header → `AKG-7` footer → `AKG-8` hero → `AKG-9` concert cards → integrate in `AKG-17` homepage.
- Fast loop: implement one visual slice, preview at mobile/tablet/desktop, compare with `01-startseite`, patch high-impact mismatches, then run `bun run lint`, `bunx tsc --noEmit`, and `bun run build` before review/merge.
- Phase 1 keeps `/`, `/programm`, contact/visit/legal launch basics; Phase 2 expands `AKG-19` and `AKG-20`; Phase 3 hardens accessibility/performance under `AKG-11`.
- Main open decision before later pages: reconcile Stitch nav labels (`Besuch planen`, `Raum anfragen`) with the existing Linear IA routes.

See project document: “Stitch Implementation Plan — Website Konzerte”.
```

### Suggested Linear document body

Use this Markdown document as the Linear project document body so the repo and Linear plan stay aligned. After each slice, append a short dated Linear comment with:

- issue ID,
- Stitch screen/pass targeted,
- files changed,
- gates run,
- manual screenshot/responsive notes,
- next slice.

## 11. Next actions

1. Sync this plan to Linear as a project document and link it from `AKG-17`.
2. Before coding, restore/verify `stitch-exports/kieler-konzertkirche/` in the implementation worktree if absent.
3. Start Phase 1.1 with `AKG-10` design tokens and base styles.
4. Implement `AKG-6`/`AKG-7` shared shell, then `AKG-8`/`AKG-9` homepage sections.
5. Complete `AKG-17` with responsive/accessibility/manual Stitch comparison notes and Bun quality gates.
