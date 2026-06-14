# Project Profile: Konzerte in der Petruskirche / Kieler Konzertkirche

Static Astro/React/Vite+ website for concerts at Petruskirche Kiel, deployed as Cloudflare Workers static assets.

> Last updated: 2026-06-14 | Version: 2

## Goals

- **delivery** [high]: Implement a polished multi-page Konzertkirche website from Stitch exports and existing concept prototypes.
- **quality** [high]: Keep the site static, fast, accessible, responsive, and verified through Vite+ checks, Astro build, and manual responsive/accessibility review.
- **workflow** [medium]: Maintain Linear/GitHub workflow with feature branches, PR review, and Cloudflare-ready build artifacts.

## Stack

- **Frameworks**: Astro, React, Tailwind CSS, shadcn/ui conventions.
- **Canonical workflow**: Vite+ (`vp install`, `vp run dev`, `vp check .`, `vp run build`, `vp run quality`).
- **Build target**: Cloudflare Workers static assets from `dist`.
- **Package-manager backend**: Vite+ delegates installation to the backend detected from `package.json`/lockfiles. `bun.lock` is currently committed for reproducible delegated installs; avoid direct backend commands in normal work.
- **Design references**: `DESIGN.md`, `standards/interface-craft.md`, `stitch-exports/kieler-konzertkirche/`, `concepts/website-mvps/`, `inspiration/`, and selected files under `assets/`.

## Architecture

- Production source lives under `src/`.
- Astro file-based routes render static pages.
- React should remain limited to interactive islands.
- Styling should use Tailwind utilities and project tokens before custom CSS.
- Preserve static hosting assumptions; do not add server-side/API/runtime behavior without explicit approval.

## Workflows

### Local development

1. Install dependencies: `vp install`.
2. Start dev server: `vp run dev` or `vp run start`.
3. Run fast checks: `vp check .`.
4. Run full handoff gate: `vp run quality`.
5. Preview production output when relevant: `vp run preview`.

### CI

`.github/workflows/babysitter.yml` uses `voidzero-dev/setup-vp@v1`, installs dependencies through Vite+, runs `vp run quality`, then validates the Babysitter project profile.

### UI/design work

Read `DESIGN.md` and `standards/interface-craft.md`. Handoffs must include responsive, keyboard/accessibility, touch/hover, visual-fidelity, and motion/performance notes.

### Project management

Linear is the source of truth for planning, triage, sprint scope, and status updates. Do not create local PM docs unless explicitly requested.

## Quality Gates

- Required before handoff after code changes: `vp run quality`.
- `vp run quality` runs Vite+ static checks, the context audit, and Astro check/build.
- `vp run context:check` validates startup/lazy context budgets and stale instruction drift.
- UI changes additionally require manual responsive/accessibility review notes.
- Add dedicated tests once interactive behavior grows beyond static checks.

## Context Management

- Startup context should stay small: `AGENTS.md` is the routing contract.
- The context system is documented in `standards/context-management.md` and enforced by `context.config.json` + `scripts/context-audit.mjs`.
- Load this file only for Babysitter/orchestration work.
- Load `DESIGN.md` and `standards/interface-craft.md` only for UI/page/component work.
- Load `standards/design-foundation-research.md` only for foundation-level design, token, component-system, or major redesign decisions.
- Avoid crawling `.a5c/runs`, `.a5c/node_modules`, `node_modules`, `dist`, `.astro`, raw image folders, and design exports unless directly relevant.

## Constraints

- Use Vite+ command surface for normal workflow.
- Keep reference/design artifacts separate from production source until intentionally integrated.
- Preserve Cloudflare static asset deployment.
- Ask before high-impact design, architecture, CI/CD, deployment, data, or privacy/legal decisions.
