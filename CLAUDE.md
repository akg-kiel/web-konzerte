# CLAUDE.md

This file provides guidance to Claude Code and compatible agents working in this repository.

For the primary project instructions, also read `AGENTS.md` and the `.agents/*.md` files.

## Babysitter

This project is configured for Babysitter-assisted development.

### Project context

- Project: Konzerte in der Petruskirche / Kieler Konzertkirche
- Stack: Astro 5, React 19, Tailwind CSS 4, Bun, Cloudflare Workers static assets
- Primary design references:
  - `stitch-exports/kieler-konzertkirche/`
  - `concepts/website-mvps/`
  - `inspiration/`
- Production source currently lives under `src/` and should remain a static Astro site unless explicitly requested otherwise.

### Recommended Babysitter workflows

Use Babysitter for larger, quality-gated work rather than one-off edits:

- Planning: `gsd/plan`
- Implementation: `gsd/execute`
- Verification: `gsd/verify`
- Visual/design convergence: `gsd/iterative-convergence`
- Quality convergence when adding tests or regression gates: `methodologies/tdd-quality-convergence`
- Project onboarding/profile refresh: `cradle/project-install`

Recommended methodology: UX-led iterative convergence with TDD-style quality gates. Plan against Stitch/concept references, implement incrementally in Astro/Tailwind, then verify with Bun lint/type/build plus responsive/accessibility review.

### Recommended skills and agents

- Use `frontend-create` for polished UI/page work and visual refinements.
- Use `context-mode` for large outputs, design exports, build logs, and git-history analysis.
- Use `pi-subagents` for larger implementation/review handoffs.
- Use `ask-user` before high-impact design, CI/CD, or architecture decisions.
- Use `parse-document` for PDFs or visual design-reference documents.
- Use `conventional-commit` when preparing commits.

### Quality gates

Before PR/handoff, run:

```bash
bun run lint
bunx tsc --noEmit
bun run build
```

For UI changes, also record manual checks for:

- responsive desktop/mobile behavior
- accessibility and keyboard navigation where relevant
- visual fidelity to Stitch/concept references
- Cloudflare static deployment assumptions

### CI/CD integration

Babysitter project checks are configured in `.github/workflows/babysitter.yml` for PR events. Full Babysitter PR orchestration is gated behind repository variable `BABYSITTER_CI_ENABLED == 'true'`; set `BABYSITTER_HARNESS` to a CI-compatible harness before enabling.

### Project-specific cautions

- Use Bun for normal package and script operations.
- Do not use npm/pnpm/yarn for project workflow unless working inside isolated tooling such as `.a5c/`.
- Keep design/reference artifacts separate from production source until intentionally integrated.
- Preserve static Cloudflare Workers asset hosting unless server behavior is explicitly requested.
- Follow `AGENTS.md` and `.agents/*.md` as authoritative repository instructions.
