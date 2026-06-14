# Konzerte in der Petruskirche

Static concert website for Petruskirche Kiel, built as a Cloudflare-ready Astro site.

## 🎯 Project Overview

- **Type**: Static concert/church website
- **Framework**: Astro with React integration
- **Tooling**: Vite+ command surface (`vp`)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Hosting**: Cloudflare Workers static assets
- **Repository**: [GitHub](https://github.com/your-org/web-konzerte)

## 🛠️ Tech Stack

- **Vite+** - Canonical workflow for install/dev/check/run commands
- **Astro** - Static site framework
- **React** - UI library for interactive islands
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Reusable component library
- **TypeScript** - Strict mode enabled
- **Cloudflare Workers** - Static asset hosting target

Vite+ delegates dependency installation to the package-manager backend detected from the workspace. Use `vp ...` commands for normal workflow instead of invoking the backend package manager directly.

## 📁 Project Structure

```txt
src/
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── layout/      # Header, Footer, Navigation
│   └── sections/    # Page sections
├── layouts/         # Page layouts
├── pages/           # Route pages
└── styles/          # Global styles
```

## 🚀 Getting Started

### Prerequisites

- [Vite+](https://viteplus.dev/) available as `vp`

### Installation

```bash
vp install
```

### Development

```bash
vp run dev
```

### Build & Preview

```bash
vp run build
vp run preview
```

### Quality Gate

```bash
vp run quality
```

This runs Vite+ static checks, the project context audit, and Astro check/build. Use `vp check .` for a faster local validation loop or `vp run context:check` when editing agent/context files.

## 📦 Adding Components

### shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

Use isolated `npx`/npm tooling only for external CLIs that are not part of the normal project workflow.

## 🎨 Code Style & Conventions

- Follow Astro best practices for component organization.
- Use TypeScript with strict mode enabled.
- Prefer Tailwind utilities; extract repeated patterns into reusable components.
- Use Astro islands for interactive components only.
- Ensure components are accessible, keyboard-operable, and responsive.
- For UI craft checks, see `DESIGN.md` and `standards/interface-craft.md`.

## 🔄 Git Workflow

- Create feature branches from `main` with the naming format: `feature/linear_ticket_id-short_description`.
- Use descriptive commit messages.
- Reference Linear ticket IDs in commits when applicable, e.g. `KON-123: Add hero section`.

## 🚢 Deployment

- **Hosting**: Cloudflare Workers static assets
- **Previews**: Preview deployments available for PRs
- **Build Command**: `vp run build`
- **Output Directory**: `dist`

### Cloudflare Workers Configuration

The project is configured for static Cloudflare Workers deployment:

- Edge deployment for global performance
- Automatic HTTPS
- DDoS protection
- Static asset hosting via `wrangler.toml`

## ✅ Do's and Don'ts

### ✅ Do

- Check Linear for current task context before starting work.
- Use Vite+ (`vp`) for normal project workflow.
- Run `vp run quality` before handoff after code changes.
- Follow the component-first approach for UI work.
- Ensure all components are accessible and responsive.
- Optimize for Cloudflare Workers static hosting.
- Use TypeScript types for all props and state.
- Add comments only for complex or non-obvious logic.

### ❌ Don't

- Don't bypass Vite+ with direct package-manager commands unless debugging that layer.
- Don't directly modify generated/vendor component files unless intentional.
- Don't add server-side features without approval.
- Don't skip checks before pushing or handing off.
- Don't leave TODO comments without tracking follow-up work.
- Don't commit sensitive data.
- Don't use `any` unless there is a documented reason.
- Don't ignore TypeScript or accessibility errors.

## 🔗 External References

- [Vite+ Documentation](https://viteplus.dev/)
- [Astro Documentation](https://docs.astro.build)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

## 📋 Project Management

- **Linear Workspace**: AKG Kiel
- **Linear Project**: Website Konzerte
- **Project Tracking**: Use Linear for issues, milestones, and project management
- **Repository Documentation**: Keep local docs code-adjacent and version-worthy

---

## Last Updated

2026-06-14
