# Goose AI Agent Configuration

## Project Overview

- **Project Name**: Konzerte in der Petruskirche
- **Type**: Static landing page
- **Framework**: Astro with React integration
- **Runtime**: Bun
- **Styling**: Tailwind CSS + shadcn/ui components
- **Hosting**: Cloudflare Pages
- **Repository**: GitHub

---

## Linear

Linear acts as the single source of truth for project management and tracking.

- Workspace: AKG Kiel
- Project: Website Konzerte

- **Usage**: Create/manage issues, milestones, and project tracking
  - Use **README.md** for documentation (technical specs, guidelines, etc.)
  - Use Linear Issues for task management and bug tracking

- **Integration**: CodeRabbit has access to Linear for PR context

---

## Tech Stack

- Bun (DO NOT USE npm, pnpm or yarn!)
- Astro
- React
- Tailwind CSS
- shadcn/ui
- TypeScript (strict mode)

---

## Project Structure

```
src/
├── components/
│   ├── ui/          # shadcn/ui components (do not modify directly)
│   ├── layout/      # Header, Footer, Navigation
│   └── sections/    # Landing page sections
├── layouts/         # Page layouts
├── pages/           # Route pages
└── styles/          # Global styles
```

---

## Git Workflow

- Create feature branches from `main` with the naming format feature/linear_ticket_id-short_description
- Use descriptive commit messages
- Reference Linear ticket IDs in commits when applicable (e.g., `KON-123: Add hero section`)

---

## Testing & Deployment

- **Build locally**: `bun run build` before pushing
- **Linting**: `bun run lint` to catch issues
- **Development**: `bun run dev` to start dev server
- **Hosting**: Cloudflare Pages handles deployment on push to main
- **Previews**: Preview deployments available for PRs

---

## Code Style & Conventions

### General Guidelines

- Follow Astro best practices for component organization
- Use TypeScript with strict mode enabled
- Follow Tailwind CSS class ordering conventions (use Prettier plugin)
- Extract repeated Tailwind patterns into reusable components
- Use functional components with hooks for React

### Component Guidelines

- Follow the component-first approach for all UI work
- Keep components small and focused (single responsibility)
- Use Astro islands for interactive components only
- Ensure all components are accessible (ARIA labels, keyboard navigation)
- Make all components responsive (mobile-first approach)

### File Naming

- Components: `PascalCase.tsx` or `PascalCase.astro`
- Utilities: `camelCase.ts`
- Styles: `kebab-case.css` or `kebab-case.scss`
- Pages: `index.astro`, `about.astro`, etc.

---

## Do's and Don'ts

### ✅ Do

- Check Linear for current task context before starting work
- Use Context7 to look up documentation when uncertain
- Create GitHub issues for bugs or technical debt discovered during development
- Follow the component-first approach for all UI work
- Ensure all components are accessible and responsive
- Optimize for Cloudflare Pages static hosting (no server-side features)
- Update `AGENTS.md` with learnings
- Use TypeScript types for all props and state
- Write meaningful commit messages
- Add comments for complex logic only

### ❌ Don't

- Don't directly modify files in `src/components/ui/` (use shadcn CLI)
- Don't add server-side features (Cloudflare Pages is static only)
- Don't skip linting or building before pushing
- Don't leave TODO comments without creating a GitHub issue
- Don't commit sensitive data (API keys, secrets)
- Don't use `any` type in TypeScript
- Don't ignore TypeScript errors
- Don't mix concerns in single components

---

## Common Tasks

### Adding a New Component

1. Determine if it's a layout component, section, or UI component
2. Place in appropriate directory (`components/layout/`, `components/sections/`, or `components/ui/`)
3. Use `npx shadcn@latest add` for shadcn/ui components
4. Follow naming conventions
5. Ensure TypeScript types are properly defined
6. Test for accessibility and responsiveness

### Creating a New Page

1. Create `.astro` file in `src/pages/`
2. Use existing layouts from `src/layouts/`
3. Import required components from `src/components/`
4. Add navigation links in header if needed
5. Test at the appropriate route

### Modifying shadcn/ui Components

1. Use the CLI: `npx shadcn@latest add [component-name]`
2. This creates a local copy in `src/components/ui/`
3. Modify the local copy as needed
4. Do not modify the original library

### Debugging

1. Check browser console for errors
2. Use `bun run dev` with hot reload
3. Verify Tailwind classes are applied correctly
4. Check Astro/React hydration issues for interactive components
5. Use TypeScript compiler errors for type issues

---

## File Patterns

### Files to Focus On

- `src/components/**/*.{tsx,astro}` - Component implementations
- `src/layouts/*.astro` - Page layouts
- `src/pages/*.astro` - Page routes
- `src/styles/**/*.css` - Global styles
- `astro.config.mjs` - Astro configuration
- `tailwind.config.ts` - Tailwind configuration
- `tsconfig.json` - TypeScript configuration

### Files/Folders to Ignore

- `node_modules/` - Dependencies
- `.astro/` - Astro build cache
- `dist/` - Production build output
- `.git/` - Git metadata
- `.env*` - Environment files (if present)

---

## Security & Secrets

- Never commit API keys, secrets, or sensitive credentials
- Never commit `.env` files or `.env.local`
- Use environment variables for sensitive configuration
- Review all code changes for exposed secrets before committing
- GitHub Secrets should be used for any CI/CD secrets

---

## External References

- [Astro Documentation](https://docs.astro.build)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Bun Documentation](https://bun.sh/docs)

---

## Quick Reference

### Useful Commands

```bash
# Development
bun run dev              # Start dev server
bun run build            # Build for production
bun run preview          # Preview production build
bun run lint             # Run linter

# Dependencies
bun install              # Install dependencies
bun add [package]        # Add a package
bun remove [package]     # Remove a package

# shadcn/ui
npx shadcn@latest add [component]  # Add a shadcn component
npx shadcn@latest update           # Update shadcn components
```

### Linear Integration

- Check Linear before starting new tasks
- Reference Linear IDs in commits: `KON-XXX: message`
- Link GitHub PRs to Linear tickets when applicable
- Update Linear if necessary

---

## Updating This File

When you learn something new about this project or encounter patterns that should be documented:

1. Update this file (`AGENTS.md`)
2. Commit with message: `docs: update AGENTS.md with [topic]`
3. Reference the relevant Linear ticket if applicable

---

## Last Updated

2025-01-18
