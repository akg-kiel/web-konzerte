# Project Profile: Konzerte in der Petruskirche / Kieler Konzertkirche

Static Astro/React/Bun landing page for concerts at Petruskirche Kiel, deployed as Cloudflare Workers static assets. Current implementation is a scaffold with rich design references in concepts/ and Stitch exports to guide a polished Konzertkirche website.

> Last updated: 2026-06-11T17:15:38.781773+00:00 | Version: 1

## Goals

- **delivery** [high]: Implement a polished multi-page Konzertkirche website from Stitch exports and existing concept prototypes. (active)
- **quality** [high]: Keep the site static, fast, accessible, responsive, and verified through Bun lint/type/build plus manual responsive/accessibility review. (active)
- **workflow** [medium]: Maintain Linear/GitHub workflow with feature branches, PR review, and Cloudflare-ready build artifacts. (active)

## Tech Stack

### Languages

- undefined
- undefined
- undefined
- undefined
- undefined
- undefined
- undefined
- undefined
- undefined

### Frameworks

- undefined
- undefined
- undefined
- undefined
- undefined

### Infrastructure

- undefined
- undefined
- undefined
- undefined
- undefined

**Build tools:** Astro CLI, @astrojs/check, TypeScript strict via astro/tsconfigs/strict, ESLint 9 flat config, Prettier 3 with prettier-plugin-tailwindcss and prettier-plugin-astro, PostCSS with @tailwindcss/postcss, Husky, lint-staged, Wrangler configuration for deployment, Devbox for development environment

**Package managers:** Bun is the required package manager/runtime; README and agent docs explicitly prohibit npm, pnpm, and yarn for normal project usage., bun.lock is committed for reproducible installs., npx is documented only for shadcn CLI usage and Goose recipe MCP execution.

## Architecture

**Pattern:** Static Astro landing page using file-based routing, a shared Astro layout, Tailwind CSS global styling, and optional React islands for client-side interactivity. The current production source is a minimal scaffold/prototype rather than a full multi-section implementation.
**Data flow:** Astro resolves file-based routes from src/pages; / maps to src/pages/index.astro.,index.astro imports Layout.astro and Counter.tsx, renders static markup for the landing page, and requests client-side hydration for Counter via client:load.,Layout.astro imports src/styles/globals.css once and wraps page content through <slot /> while injecting metadata and title props.,Tailwind CSS utilities are authored directly in Astro/TSX markup; globals.css imports Tailwind v4.,Counter.tsx owns local React state only; there is no remote data fetching, persistence, API layer, CMS, or server-side runtime state.,Build flow is astro check followed by astro build, outputting static assets to dist for Cloudflare Workers static asset serving.

### Modules

| Module         | Path                                  | Description |
| -------------- | ------------------------------------- | ----------- |
| pages          | `src/pages`                           |             |
| layouts        | `src/layouts`                         |             |
| components/ui  | `src/components/ui`                   |             |
| lib            | `src/lib`                             |             |
| styles         | `src/styles`                          |             |
| concepts       | `concepts/website-mvps`               |             |
| stitch exports | `stitch-exports/kieler-konzertkirche` |             |
| assets         | `assets`                              |             |

## Team

- **Noah Zepner** (owner/developer): Product/design implementation, Frontend development, Deployment and workflow ownership

## Workflows

### GitHub Actions CI

Pull request validation workflow for linting, type checking, and production build verification.
**Triggers:** pull_request targeting main

1. Checkout repository with actions/checkout@v4
2. Install Bun with oven-sh/setup-bun@v2
3. Install dependencies with bun install
4. Run lint job with bun run lint
5. Run type-check job with bunx tsc --noEmit
6. Run build job with bun run build

### Local development workflow

Install dependencies and run Astro development/preview commands locally with Bun.
**Triggers:** manual developer command

1. Install dependencies with bun install
2. Start local development server with bun run dev or bun run start
3. Build production output with bun run build
4. Preview production build with bun run preview

### Pre-commit quality gate

Husky executes lint-staged before commits to auto-fix lint and formatting issues on staged files.
**Triggers:** git pre-commit hook

1. Husky pre-commit runs bunx lint-staged
2. lint-staged runs eslint --fix and prettier --write for JS/TS/Astro files
3. lint-staged runs prettier --write for JSON, Markdown, MDX, CSS, and HTML files

### Cloudflare static deployment

Documented deployment path for static Astro output to Cloudflare Workers assets using wrangler.toml.
**Triggers:** documented push to main deployment outside repository CI, manual or external Cloudflare deployment integration

1. Build the static site with bun run build to produce dist
2. Use wrangler.toml assets.directory ./dist for Cloudflare Workers static assets
3. Serve immutable cached assets under /\_astro/\* via configured cache-control header

### Dev container setup

VS Code/devcontainer workflow based on Jetpack Devbox.
**Triggers:** opening project in a devcontainer-compatible environment

1. Build .devcontainer/Dockerfile from jetpackio/devbox:latest
2. Copy devbox.json and devbox.lock into the image
3. Run devbox installation
4. Execute postCreateCommand devbox install

## Processes

- **undefined** (`cradle/project-install`, undefined) - Project onboarding/profile generation process used to install Babysitter project metadata.

## Tools

### Linting

- ESLint
- Astro Check
- lint-staged

### Testing

- TypeScript type check `bunx tsc --noEmit`
- Astro build verification `bun run build`

### Formatting

- Prettier
- Prettier via lint-staged

## Services

- **Cloudflare Workers** (hosting/edge static assets)
- **GitHub** (source control and CI)
- **Linear** (project management/documentation)

## CI/CD

**Provider:** GitHub Actions

## Pain Points

- **medium** [quality]: No dedicated unit/e2e test suite detected; quality gates rely on lint/type/build plus manual checks
- **high** [delivery]: Production src is still a minimal scaffold while rich design concepts/Stitch exports exist separately
- **medium** [workflow]: Large assets, concepts, stitch-exports, and .a5c are untracked; repo hygiene decisions needed

## Bottlenecks

- High-change file seen in 8 recent commits at package.json (8)
  Impact: Medium; coordinate edits and run quality gates when touching this area
- High-change file seen in 8 recent commits at AGENTS.md (8)
  Impact: Medium; coordinate edits and run quality gates when touching this area
- High-change file seen in 4 recent commits at postcss.config.mjs (4)
  Impact: Medium; coordinate edits and run quality gates when touching this area
- High-change file seen in 4 recent commits at tailwind.config.js (4)
  Impact: Medium; coordinate edits and run quality gates when touching this area
- High-change file seen in 4 recent commits at bun.lock (4)
  Impact: Medium; coordinate edits and run quality gates when touching this area
- High-change file seen in 4 recent commits at eslint.config.mjs (4)
  Impact: Medium; coordinate edits and run quality gates when touching this area
- High-change file seen in 4 recent commits at SITE_ARCHITECTURE.md (4)
  Impact: Medium; coordinate edits and run quality gates when touching this area
- High-change file seen in 3 recent commits at .prettierrc (3)
  Impact: Medium; coordinate edits and run quality gates when touching this area
- package.json lint:fix script appears to use exlint instead of eslint at package.json (current config)
  Impact: Low/Medium; automated fix command may fail until corrected

## Conventions

### Naming

- **components:** PascalCase.tsx or PascalCase.astro
- **utilities:** camelCase.ts
- **styles:** kebab-case.css or kebab-case.scss
- **pages:** Astro file-based route names such as index.astro and about.astro
- **branches:** feature/linear_ticket_id-short_description, for example feature/AKG-5-init

### Git

- **branching:** Create feature branches from main using Linear ticket IDs.
- **commits:** Reference ticket IDs in commit messages; .agents/linear-workflow.md uses AKG-XXX: message while README shows KON-123 as an example.
- **pullRequests:** Use GitHub PR template, link Linear ticket, and include local dev, responsive, accessibility, lint, and build checks.
- **codeowners:** @zepi2509 owns repository-wide changes plus source, styles, config, workflows, and documentation.
- **currentObservedBranch:** feature/AKG-17-website-mvps-restart
- **currentObservedUntrackedAreas:** .a5c/,assets/,concepts/,stitch-exports/

**Import order:** No explicit import-order rule is configured. > Observed style places external package imports before local imports in TS files, and local Astro imports in frontmatter. > Path alias @/_ maps to ./src/_ and shadcn aliases map components, ui, lib, utils, and hooks.

**Error handling:** Static app currently has no centralized error boundary or runtime error-handling abstraction.,ESLint warns on console usage except console.warn and console.error.,Build pipeline relies on astro check, TypeScript, ESLint, and CI to catch errors before deployment.,Do not add server-side features or API behavior because deployment target is static Cloudflare Workers assets.

**Testing:** No unit, integration, or e2e test framework is currently configured.,CI quality gates are lint, type-check via bunx tsc --noEmit, and bun run build.,PR template expects manual verification for local dev server, responsive behavior, accessibility, lint, and build.,devbox test script is a placeholder that exits with an error.

### Additional Rules

- Use Bun commands: bun install, bun run dev, bun run build, bun run lint.
- Do not directly modify src/components/ui/ generated shadcn/ui components; add components through the shadcn CLI.
- Do not add .vscode/ because team uses Vim/WebStorm, although the devcontainer currently contains VS Code customizations.
- Do not commit sensitive data or environment files; .env\* is ignored except .env.example.
- Build locally before pushing.
- Use frontend-design workflow for UI creation/refactoring, responsive layout, and accessibility improvements.
- Project docs mark node_modules, .astro, dist, and .env\* as ignored/generated areas.
- package.json contains a likely typo in lint:fix script: exlint . --fix instead of eslint . --fix.
- postcss.config.mjs references ./config/tailwind.config.js, while the repository has tailwind.config.js at the root; Tailwind v4 import in globals.css may reduce reliance on this config but the path is inconsistent.

## Repositories

- **undefined** [`/home/zepi/Projects/web-konzerte`]

## CLAUDE.md Instructions

- Use Bun for package management and scripts; do not use npm/pnpm/yarn for normal project workflow.
- Follow AGENTS.md and .agents/\*.md for coding, design, Linear, and git workflow rules.
- Use Stitch exports in stitch-exports/kieler-konzertkirche and concepts/website-mvps as design references for implementation.
- Before PR or handoff, run bun run lint, bunx tsc --noEmit, and bun run build; include manual responsive/accessibility notes for UI changes.
- Preserve static Cloudflare Workers deployment assumptions unless explicitly asked to add server-side behavior.
- Babysitter PR checks live in .github/workflows/babysitter.yml; enable full orchestration only after setting BABYSITTER_CI_ENABLED and a CI-compatible BABYSITTER_HARNESS.

## Installed Extensions

- Skills: frontend-create, context-mode, pi-subagents, ask-user, parse-document, conventional-commit
- Agents: planner, worker, reviewer, scout, delegate
- Processes: gsd/plan, gsd/execute, gsd/verify, gsd/iterative-convergence, methodologies/tdd-quality-convergence, specializations/ux-ui-design, cradle/project-install
