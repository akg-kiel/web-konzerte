# Stitch Implementation Plan — Kieler Konzertkirche

**Last updated:** 2026-06-11  
**Purpose:** Move quickly from the Stitch design to an implemented Astro site without losing Linear traceability or delivery discipline.

## 1. Sources of truth

| Source                  | Current state                                                                                                                                                 | How the plan uses it                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Linear project          | `Website Konzerte` is in progress; Phase 1 MVP is 35%; `AKG-17` is active for the homepage.                                                                   | Linear remains the project-management source of truth. Implementation waves map back to existing issues and milestones. |
| Linear architecture doc | `Site Architecture: Concert Landing Page` defines Home, Programm, Über uns, Für Veranstalter, Kontakt, legal pages, mobile navigation, and Phase 1 MVP scope. | Preserve the information architecture, but adapt the execution order to the Stitch screens.                             |
| Current repo            | Astro 5, React 19, Tailwind, TypeScript, Bun, Cloudflare Workers. `src/pages/index.astro` is still a scaffold.                                                | Start with shared tokens/layout and a homepage vertical slice before broad page implementation.                         |
| Stitch project          | `Kieler Konzertkirche` (`6221185249843486689`) with local exports in `stitch-exports/kieler-konzertkirche/`.                                                  | Treat exported screens and the dark `Nordic Resonance` design system as visual source of truth.                         |
| Concept prototypes      | `concepts/website-mvps/` contains earlier Mobbin-inspired experiments.                                                                                        | Use only as reference for interaction ideas; Stitch supersedes it for production direction.                             |

## 2. Stitch design baseline

**Visual direction:** sophisticated, architectural, serene, sacred-modern, dark editorial design with glassmorphic tonal layers.

**Core tokens to implement first:**

- Colors: `#020617` midnight deep, `#1E293B` slate mist, `#F3E5AB` champagne glow, `#B8860B` brass accent, `#121414` surface, `#e3e2e2` on-surface, `#e9c349` secondary.
- Typography: EB Garamond for display/headlines; Hanken Grotesk for body and UI labels.
- Layout: 1280px desktop container, 64px desktop margins, 20px mobile margins, 8px spacing unit, large section rhythm.
- Components: glass top navigation, gold CTA, ghost buttons, concert cards with image/gradient overlay, chips, minimal form inputs, ticket CTA states.

**Exported screens to preserve:**

1. `01-startseite` → Home: hero, next concerts, quote, architecture/room sound, visit/event CTAs.
2. `02-programm` → Programme: filters and concert listing.
3. `03-konzert-detail-die-passion-2026` → Concert detail template.
4. `04-besuch-planen` → Visit planning: directions, parking, access, café.
5. `05-raum-anfragen` → Event-host inquiry: technical basics, equipment, booking form.

## 3. Fast iteration loop

Use short loops that always leave the repo in a buildable state.

1. **Extract tokens, not pixels:** add design tokens to Tailwind/global CSS, then implement components against tokens.
2. **Build a thin vertical slice:** header, footer, homepage hero, one concert card, one CTA path. Do this before implementing all pages.
3. **Compare visually against Stitch:** run local dev server, compare desktop first, then mobile reflow.
4. **Tighten accessibility and responsiveness:** semantic landmarks, keyboard focus, contrast, reduced-motion safety, mobile tap targets.
5. **Commit/sync by Linear slice:** each implementation PR references the relevant AKG issue(s) and updates status/comments.

Recommended design review cadence for early implementation:

- First review after tokens + layout shell.
- Second review after homepage vertical slice.
- Third review after programme/detail pages share real components.
- Final MVP review after visit/contact/legal coverage and quality gates pass.

## 4. Implementation waves mapped to Linear

### Wave 0 — Planning and alignment

**Goal:** Make the repo and Linear plan reflect the Stitch-first implementation direction.

- Update this plan.
- Sync the plan to Linear as a project document/comment on `AKG-17`.
- Do not edit production source in this planning-only run.

**Linear:** `AKG-17`, project document.

### Wave 1 — Design foundation and layout shell

**Goal:** Establish reusable visual foundation while still shipping no broad page rewrite.

- Implement Tailwind/global tokens from Stitch (`AKG-10`).
- Create shared layout components: `Header`, `Footer`, nav state, CTA styles (`AKG-6`, `AKG-7`).
- Add content/data scaffolding for concerts and navigation.
- Keep header/footer usable on mobile and desktop.

**Quality gates:** `bun run lint`, `bunx tsc --noEmit`, `bun run build`; manual contrast/focus check for tokens and navigation.

### Wave 2 — Homepage vertical slice

**Goal:** Replace the scaffold with a production homepage that visibly follows Stitch.

- Implement home route sections from `01-startseite`: hero, next concerts preview, quote, architecture/room sound, visit and room CTAs (`AKG-17`, `AKG-8`, `AKG-9`).
- Show 3-4 concert cards and clear ticket CTA.
- Preserve sticky/glass nav behavior where practical without heavy client JS.

**Definition of done:** `AKG-17` acceptance criteria covered for the homepage, responsive at mobile/tablet/desktop, accessible landmarks/headings, build passes.

### Wave 3 — Programme and concert detail reuse

**Goal:** Reuse the homepage components/data to expand without duplicating layout logic.

- Create `/programm` from `02-programm` (`AKG-18`).
- Create a first static concert detail route/template from `03-konzert-detail-die-passion-2026`.
- Keep filters/tabs static or progressively enhanced only if needed.

**Quality gates:** build, responsive review, keyboard/focus review, link sanity.

### Wave 4 — Visit/contact/legal MVP completion

**Goal:** Close Phase 1 MVP user needs beyond the homepage.

- Implement visit/contact content using `04-besuch-planen` and existing `AKG-21` scope.
- Add `Impressum` and `Datenschutz` pages (`AKG-22`, `AKG-23`) with placeholder-safe legal content only if source content is missing.
- Ensure footer links and external Petruskirche link behavior.

### Wave 5 — Expansion for event hosts and organization

**Goal:** Move into Phase 2 without destabilizing the MVP.

- Implement `05-raum-anfragen` as `/fuer-veranstalter` or `/raum-anfragen`, then reconcile URL with Linear architecture (`AKG-20`).
- Implement organization/about pages (`AKG-19`).
- Add deeper accessibility audit (`AKG-11`).

## 5. Dependency order

1. `AKG-10` tokens and global typography.
2. `AKG-6` header and `AKG-7` footer.
3. `AKG-8` hero and `AKG-9` concert cards.
4. `AKG-17` homepage integration.
5. `AKG-18` programme/detail expansion.
6. `AKG-21`, `AKG-22`, `AKG-23` to complete Phase 1 support/legal flows.
7. `AKG-19`, `AKG-20`, `AKG-11` for Phase 2/3 expansion and hardening.

## 6. Acceptance criteria for the first implementation PR

- Stitch tokens are represented in reusable CSS/Tailwind configuration or global CSS custom properties.
- Header/footer and homepage sections use the dark editorial visual language from Stitch.
- Homepage covers `AKG-17` essentials: hero, ticket CTA, 3-4 concerts, about/venue teaser, contact/visit CTA, sticky or persistent navigation, mobile responsiveness.
- No production dependency changes without explicit reason.
- `bun run lint`, `bunx tsc --noEmit`, and `bun run build` pass.
- Manual checks documented: mobile layout, keyboard focus, contrast, image alt text, external link behavior.

## 7. Risks and mitigations

| Risk                                                 | Mitigation                                                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Stitch HTML is generated and not production-quality. | Use it as visual/content reference, not as copy-paste source. Rebuild with Astro components.                          |
| Fast visual iteration could bypass Linear.           | Keep each wave mapped to AKG issues; comment on `AKG-17` after major plan/design decisions.                           |
| Full multi-page scope is too large for one PR.       | Ship Wave 1 + Wave 2 first; expand with shared components afterward.                                                  |
| German legal/privacy content may be incomplete.      | Add legal pages only with verified source text or explicit placeholders requiring owner review.                       |
| Dark palette contrast/focus regressions.             | Make WCAG AA checks part of every visual review, not only final hardening.                                            |
| Asset pipeline uncertainty.                          | Decide early which `assets/` images move into `public/` or `src/assets/`; document chosen paths in implementation PR. |

## 8. Linear sync payload

### Suggested Linear document title

`Stitch Implementation Plan — Kieler Konzertkirche`

### Suggested AKG-17 comment

Plan update from Stitch/repo/Linear review:

- Stitch project `6221185249843486689` is now treated as visual source of truth for the implementation.
- Recommended first implementation slice: design tokens (`AKG-10`) + shared header/footer (`AKG-6`, `AKG-7`) + homepage vertical slice (`AKG-17`, `AKG-8`, `AKG-9`).
- Broader pages follow after shared components are stable: programme/detail (`AKG-18`), visit/contact/legal (`AKG-21`, `AKG-22`, `AKG-23`), then event-host/about/accessibility expansion (`AKG-20`, `AKG-19`, `AKG-11`).
- Quality gates remain Bun lint/type/build plus responsive and WCAG AA manual review.

Local plan: `docs/stitch-implementation-plan.md`

## 9. Immediate next actions

1. Sync this plan to Linear if approved.
2. Start a focused implementation branch for Wave 1 + Wave 2.
3. Convert Stitch design tokens into project-level CSS/Tailwind primitives.
4. Replace the homepage scaffold with the Stitch-aligned vertical slice.
5. Run Bun quality gates and document manual design/accessibility checks in the PR.
