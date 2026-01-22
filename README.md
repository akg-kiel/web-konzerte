# Konzerte in der Petruskirche

Static landing page for concert information at Petruskirche, built with modern web technologies.

## 🎯 Project Overview

- **Type**: Static landing page
- **Framework**: Astro with React integration
- **Runtime**: Bun
- **Styling**: Tailwind CSS + shadcn/ui components
- **Hosting**: Cloudflare Workers
- **Repository**: [GitHub](https://github.com/your-org/web-konzerte)

## 🛠️ Tech Stack

- **Bun** - Package manager and runtime (DO NOT USE npm, pnpm or yarn!)
- **Astro** - Modern web framework
- **React** - UI library for interactive components
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Reusable component library
- **TypeScript** - Strict mode enabled
- **Cloudflare Workers** - Edge computing platform for static hosting

## 📁 Project Structure

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

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/docs/installation) installed on your system

### Installation

```bash
# Install dependencies
bun install
```

### Development

```bash
# Start dev server
bun run dev
```

### Build & Preview

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

### Linting

```bash
# Run linter
bun run lint
```

## 📦 Adding Components

### shadcn/ui Components

```bash
# Add a shadcn/ui component
npx shadcn@latest add [component-name]

# Example:
npx shadcn@latest add button
```

## 🎨 Code Style & Conventions

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

## 🔄 Git Workflow

- Create feature branches from `main` with the naming format: `feature/linear_ticket_id-short_description`
- Use descriptive commit messages
- Reference Linear ticket IDs in commits when applicable (e.g., `KON-123: Add hero section`)

## 🚢 Deployment

- **Hosting**: Cloudflare Workers handles deployment on push to main
- **Previews**: Preview deployments available for PRs
- **Build Command**: `bun run build`
- **Output Directory**: `dist`

### Cloudflare Workers Configuration

The project is configured to deploy to Cloudflare Workers, which provides:

- Edge deployment for global performance
- Automatic HTTPS
- DDoS protection
- Zero-cost static site hosting

## ✅ Do's and Don'ts

### ✅ Do

- Check Linear for current task context before starting work
- Use Context7 to look up documentation when uncertain
- Create GitHub issues for bugs or technical debt discovered during development
- Follow the component-first approach for all UI work
- Ensure all components are accessible and responsive
- Optimize for Cloudflare Workers static hosting (no server-side features)
- Use TypeScript types for all props and state
- Write meaningful commit messages
- Add comments for complex logic only

### ❌ Don't

- Don't directly modify files in `src/components/ui/` (use shadcn CLI)
- Don't add server-side features (Cloudflare Workers is static only)
- Don't skip linting or building before pushing
- Don't leave TODO comments without creating a GitHub issue
- Don't commit sensitive data (API keys, secrets)
- Don't use `any` type in TypeScript
- Don't ignore TypeScript errors
- Don't mix concerns in single components

## 🔗 External References

- [Astro Documentation](https://docs.astro.build)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Bun Documentation](https://bun.sh/docs)

## 📋 Project Management

- **Linear Workspace**: AKG Kiel
- **Linear Project**: Website Konzerte
- **Project Tracking**: Use Linear for issues, milestones, and project management
- **Documentation**: This README.md file

---

## Last Updated

2026-01-19
