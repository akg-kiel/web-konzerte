# Design Foundation Research Brief

Use this only for foundation-level UI decisions: new design-system work, token refactors, major redesigns, component-library strategy, accessibility/design audits, or high-impact UI architecture choices.

Do **not** load this for routine section/card/button implementation. For normal UI work, use `DESIGN.md` and `standards/interface-craft.md` instead.

## Project defaults

- Product type: brand-heavy static concert/church website.
- Primary users: concert visitors, parish/culture audiences, organizers, and mobile users planning a visit.
- Stack: Astro + React islands + Tailwind + Vite+.
- Accessibility target: WCAG 2.2 AA.
- Visual direction: `Nordic Resonance` / sacred modernity / restrained glassmorphism.
- Current density: editorial/marketing, not SaaS/admin/data-heavy.
- Hosting constraint: static Cloudflare Workers assets.
- Theming need: dark-first design; future light/high-contrast modes should be possible through semantic tokens.

## Depth control

Before researching, classify the task:

1. **Small UI change**: do not run broad research. Check only relevant sections in `DESIGN.md` + `interface-craft`.
2. **Component pattern**: compare 2–3 reference systems for that component/state only.
3. **Foundation decision**: use this brief; compare at least 3 reference systems and produce a recommendation.
4. **System redesign**: use this brief plus product/context discovery, visual references, and accessibility review.

Always produce decisions and tradeoffs, not just links.

## Starting context questions

Answer only what is relevant to the task:

- What product/workflow is being designed?
- Which users and devices matter most?
- Is the interface brand-heavy, utility-heavy, or mixed?
- Does it need dark mode, theming, density modes, or multi-brand support?
- What frontend/design assets already exist?
- What legal/accessibility target applies?

## Reference systems to compare

Use these as sources according to fit:

- **WCAG 2.2**: accessibility baseline for contrast, focus, keyboard, target size, input assistance.
- **ISO 9241-210**: human-centred design process and evaluation.
- **Nielsen Norman Group heuristics**: usability evaluation and interaction feedback.
- **Material Design 3**: tokens, color, typography, motion, adaptive layout, broad components.
- **Apple HIG**: platform polish, layout, typography, color, native behavior.
- **Fluent 2**: enterprise/productivity tokens, spacing, elevation, components.
- **IBM Carbon**: enterprise spacing, color, type, data-heavy components.
- **USWDS**: accessibility-first government tokens/utilities/components.
- **GOV.UK Design System**: forms, plain language, service patterns, accessibility.
- **Atlassian Design System**: SaaS/product foundations, tokens, interaction patterns.
- **Shopify Polaris**: commerce/admin tokens, components, content hierarchy.
- **W3C Design Tokens / Design Tokens Format Module**: token exchange and governance.

## Research checklist

### Product context

Define product type, users, devices, brand-vs-utility balance, theming needs, frontend stack, existing assets, and accessibility target.

### Tokens

Recommend primitive, semantic, and component-token layers where useful.

Categories to consider: color, spacing, typography, radius, border, shadow/elevation, motion, opacity, z-index, breakpoints, icon sizes.

Preferred pattern:

```text
Primitive:  blue-600 = #005EA8
Semantic:   color-action-primary = blue-600
Component:  button-primary-bg-default = color-action-primary
```

### Spacing

Decide base unit, component spacing, layout spacing, density, responsive spacing, vertical rhythm, and form spacing.

Common baseline:

```text
4/8px rhythm
small gaps: 4 / 8
UI gaps: 12 / 16
component groups: 16 / 24
sections: 32 / 48 / 64
page regions: 64+
```

### Layout, grids, and breakpoints

Decide columns, gutters, margins, max widths, readable line length, responsive behavior, navigation layout, and content reflow.

Common baseline:

```text
mobile: 4 columns
tablet: 8 columns
desktop: 12 columns
mobile margin: 16–20px
tablet margin: 24px
desktop margin: 32–64px
readable text: ~45–75 characters/line
```

### Color

Decide brand palette, neutral scale, semantic roles, interaction states, accessibility contrast, dark-mode mapping, focus color, and state communication beyond color.

Accessibility baseline:

```text
normal text: 4.5:1
large text: 3:1
UI components/graphics where required: 3:1
state must not rely on color alone
focus must be visible
```

### Typography

Decide typefaces, scale, line heights, weights, responsive type, language support, numeric style, and readable content widths.

Common baseline:

```text
caption: 12px
small UI: 14px
body: 16px
large body: 18px
heading sm/md/lg: 20 / 24 / 32px
display: 40px+
body line-height: 1.4–1.7
heading line-height: 1.1–1.3
```

### Components

Inventory current and future components. For each important component define anatomy, variants, states, keyboard behavior, accessible names/descriptions, responsive behavior, content rules, and design-code parity.

Prioritize only components needed for current product goals; avoid admin/data-grid bloat for this site unless scope changes.

### Interaction states and feedback

Specify default, hover, focus-visible, active, selected, disabled, loading, success, warning, error, empty, offline, and permission states as applicable.

Use Nielsen heuristics for visibility of system status, error prevention, user control, consistency, and recovery.

### Accessibility and inclusive design

Required target: WCAG 2.2 AA.

Testing matrix:

```text
keyboard-only
screen reader labels/roles/names
contrast
zoom/reflow
reduced motion
touch target size
form errors and instructions
ARIA validation where ARIA is used
```

### Forms and content design

Research labels, required/optional indicators, validation timing, helper text, error messages, grouping, autocomplete/inputmode, long-form behavior, voice/tone, navigation labels, empty states, and destructive-action copy.

Prefer GOV.UK/USWDS guidance for forms and plain-language content.

### Motion

Decide purpose, duration, easing, reduced-motion behavior, and performance constraints.

Common baseline:

```text
micro state: 100–150ms
standard transition: 150–250ms
large transition: 250–400ms
avoid nonessential motion for frequent actions
respect prefers-reduced-motion
```

### Shape, borders, elevation, icons, and media

Decide radius scale, border widths, focus ring width, shadow/elevation strategy, layering, icon style/sizes, decorative-vs-meaningful icon rules, image aspect ratios, and cropping behavior.

### Navigation and responsive behavior

Decide top nav/sidebar/tabs/breadcrumbs/search, current-location cues, mobile nav transformation, responsive media, table/card transformations if needed, and touch target rules.

### Governance and implementation

Decide ownership, contribution rules, token/component deprecation, versioning, documentation, testing, migration, and how Figma/design assets map to Tailwind/CSS variables/code.

## Required deliverables for foundation work

Return a concise recommendation with:

1. Product UI requirements summary.
2. Accessibility target and checklist.
3. Token taxonomy and examples.
4. Spacing scale and usage rules.
5. Grid, breakpoint, and container rules.
6. Typography scale and font-loading approach.
7. Color roles and contrast notes.
8. Component inventory and priority list.
9. Interaction state matrix.
10. Motion guidelines.
11. Content/microcopy guidance.
12. Implementation architecture.
13. Testing/QA plan.
14. Governance and migration plan.
15. Open questions, tradeoffs, and sources.

## Compact final pass

```text
Accessibility: WCAG 2.2 AA, keyboard, focus, contrast, labels, reduced motion, touch targets.
Foundations: tokenized color/spacing/type/radius/borders/elevation/motion/breakpoints.
Components: variants, states, accessibility, content rules, responsive behavior, code/design parity.
Governance: naming, contribution, versioning, deprecation, docs, QA/testing.
```
