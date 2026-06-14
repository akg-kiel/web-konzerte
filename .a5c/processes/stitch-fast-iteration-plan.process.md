# Stitch Fast-Iteration Implementation Plan Process

## Purpose

Update the project plan for `web-konzerte` so the team can quickly iterate on the Stitch-made **Kieler Konzertkirche** design while preserving a reliable Linear-backed project plan.

## Source inputs

- **Repo state:** Astro + React + Tailwind CSS + Vite+ static site; current `src/pages/index.astro` is still a scaffold.
- **Linear:** `Website Konzerte` project, Phase 1 MVP at 35%, active issue `AKG-17` for the homepage, and completed architecture issue/document `AKG-16`.
- **Stitch:** project `6221185249843486689` / `Kieler Konzertkirche`, dark-mode design system (`EB Garamond`, `Hanken Grotesk`, midnight/slate/champagne/brass palette) and exported screens for home, programme, concert detail, visit planning, and venue inquiry.
- **Repo artifacts:** local exports in `stitch-exports/kieler-konzertkirche/` and concept prototypes in `concepts/website-mvps/`.

## Workflow

1. **Update local planning artifact**: create/update `docs/stitch-implementation-plan.md` with source mapping, fast vertical-slice loop, acceptance criteria, milestones, and risks.
2. **Review and refinement loop**: reviewer checks traceability and implementation readiness; up to two refinement cycles apply changes.
3. **Diff checkpoint**: capture `git status` and plan diff.
4. **Human approval gate**: ask whether to sync the reviewed plan back to Linear.
5. **Linear sync**: create/update a Linear project document and comment on `AKG-17`.
6. **Final summary**: return changed files, Linear links, next implementation steps, and caveats.

## Quality principles

- Keep implementation planning incremental: design tokens + shared layout/navigation + homepage vertical slice before broad page coverage.
- Preserve traceability: every implementation wave maps back to Stitch screens and Linear issues/milestones.
- Use the Vite+ command surface (`vp check .`, `vp run build`, `vp run quality`) for project workflow.
- Keep the site static, accessible (WCAG AA), responsive, and Cloudflare-ready.
- Avoid editing production source code in this planning run.
