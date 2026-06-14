# Agent Contract

Load this file at startup. Load deeper project context only when the task needs it.

## Always

- Use the Vite+ command surface (`vp ...`) for normal project workflow. Do not call package-manager commands directly unless debugging the package-manager layer.
- Keep production source under `src/` and preserve the static Astro + React + Tailwind architecture unless explicitly asked otherwise.
- Preserve Cloudflare static asset hosting assumptions; do not introduce server/runtime behavior without approval.
- Ask before high-impact design, architecture, CI/CD, deployment, data, or privacy/legal decisions.
- Keep design/reference artifacts separate from production source until intentionally integrated.
- Use Linear for planning, triage, sprint scope, and status updates. Do not create local PM docs unless explicitly asked.
- Before handoff after code changes, run `vp run quality` and summarize results. For UI changes, also include responsive/accessibility/manual review notes.

## Task-specific context

- UI/page/component work: read `DESIGN.md` and `standards/interface-craft.md`.
- Foundation-level design/token/component-system decisions: also read `standards/design-foundation-research.md`.
- Babysitter/orchestration work: read `.a5c/project-profile.md` and `.a5c/quality-gates.json`.
- CI/deployment changes: read `.github/workflows/babysitter.yml`, `wrangler.toml`, and `package.json`.
- Context-system changes: read `standards/context-management.md`, `context.config.json`, and `scripts/context-audit.mjs`.
- Visual-reference work: inspect `stitch-exports/`, `inspiration/`, `concepts/`, or `assets/` only as needed.

## Context hygiene

- Do not crawl `.a5c/runs`, `.a5c/node_modules`, `node_modules`, `dist`, `.astro`, raw image folders, or design exports unless directly relevant.
- Prefer project scripts and small targeted reads over broad repository dumps.
- Run `vp run context:check` after changing context-management files.
- Treat external UI guidance such as https://interfaces.rauno.me/ as craft guidance, not blind law; encode enforceable parts in checks or handoff evidence.
