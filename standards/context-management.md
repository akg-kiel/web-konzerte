# Context Management System

This project uses a small, enforced context system so agents get the right information without loading the whole repository into every session.

## Research basis

Established systems converge on the same pattern:

- **AGENTS.md**: a repo-root agent contract for stable, always-true instructions.
- **Scoped rules / skills / prompt files**: task-specific context that loads only when relevant.
- **Context engineering**: write, select, compress, and isolate context instead of stuffing the window.
- **Compaction and memory**: preserve decisions and summaries, not raw logs or full transcripts.
- **Automated gates**: encode enforceable standards in scripts/CI instead of relying on long prose.

Sources considered: agents.md, Anthropic context-engineering guidance, LangChain's write/select/compress/isolate taxonomy, VS Code/Copilot context-engineering guidance, and current coding-agent rules-file practice.

## Project layers

### L0: Startup router

`AGENTS.md` is the only intended startup context. It must stay small and only answer:

- What is always true?
- Which command surface is canonical?
- Which context file should be loaded for which task?
- Which directories must not be crawled casually?

Budget: configured in `context.config.json` and enforced by `vp run context:check`.

### L1: Lazy project context

Load only when task-relevant:

- UI/page/component work: `DESIGN.md` + `standards/interface-craft.md`.
- Foundation-level design/token/component-system decisions: add `standards/design-foundation-research.md`.
- Babysitter/orchestration: `.a5c/project-profile.md` + `.a5c/quality-gates.json`.
- CI/deployment: `.github/workflows/babysitter.yml`, `wrangler.toml`, `package.json`.
- Context-system changes: this file + `context.config.json` + `scripts/context-audit.mjs`.

### L2: Indexed or external context

Large references should be indexed/searched or fetched on demand, not pasted into startup files. Examples: full interface guidelines, design exports, build logs, screenshots, and large asset inventories.

### L3: Feature context

Linear remains the source of truth for feature planning. If a feature needs local context, keep it short-lived and explicit:

- one ticket/feature per brief;
- include scope, non-goals, relevant files, acceptance gates, and open decisions;
- avoid raw transcripts/log dumps;
- delete or archive after merge/handoff.

Do not create local PM artifacts unless explicitly requested.

## Enforcement

Run:

```bash
vp run context:check
```

The audit checks:

- startup/lazy context file size budgets;
- required context files exist;
- `.rgignore` / `.gitignore` protect noisy directories;
- stale direct package-manager commands have not re-entered agent docs;
- `AGENTS.md` still acts as a router rather than a full manual.

`vp run quality` includes this audit, so context drift fails the normal handoff gate.

## Adding new standards

1. Do not paste a full standard into `AGENTS.md`.
2. Create or update a lazy file under `standards/`.
3. Add depth control so agents know when not to load or fully apply the standard.
4. Add a one-line route in `AGENTS.md` only if agents need to discover it.
5. Add/update budgets and stale-pattern checks in `context.config.json`.
6. Prefer scripts/CI for anything objectively enforceable.
7. Summarize manual-only checks as handoff evidence.
