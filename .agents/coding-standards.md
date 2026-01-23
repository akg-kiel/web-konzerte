## Code Style & Conventions

### Guidelines

- **Astro Islands**: Use only for interactive components.
- **Components**: Functional components with hooks.
- **Types**: Strict TypeScript. No `any`.
- **Styling**: Use Tailwind. Extract repeated patterns into components.

### File Naming

- Components: `PascalCase.tsx` / `.astro`
- Utilities: `camelCase.ts`
- Styles: `kebab-case.css`

### Do's & Don'ts

- ✅ Use `frontend-design` for UI tasks.
- ✅ Build locally (`bun run build`) before pushing.
- ✅ Spin up Subagents for big tasks.
- ✅ Paralalize Subagents if possible.
- ❌ DON'T modify `src/components/ui/` directly (use shadcn CLI).
- ❌ DON'T add `.vscode/` (Team uses Vim/WebStorm).
