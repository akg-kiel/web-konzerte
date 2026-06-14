# Interface Craft Gate

Use this only for UI/page/component work. It adapts Rauno Freiberg's web interface guidelines for this project without loading the full external checklist into startup context.

External reference: https://interfaces.rauno.me/

Treat this as a craft checklist, not dogma. Prefer accessibility, native platform behavior, and measured performance over visual tricks.

## Required review areas

### Semantics and forms

- Labels must activate their controls.
- Submit-capable inputs belong in a `<form>` where Enter should submit.
- Use appropriate input `type`, `required`, and autocomplete/spellcheck settings intentionally.
- Icon-only controls need explicit accessible names.
- Decorative layers must not intercept pointer events or pollute the accessibility tree.

### Keyboard and focus

- Interactive elements must be reachable and operable by keyboard.
- Focus rings must be visible and respect component shape.
- Sequential controls should have predictable tab order; list-like controls should support expected arrow-key behavior when applicable.
- Disabled controls must not hide required explanations behind inaccessible hover-only tooltips.

### Touch and responsive behavior

- Do not rely on hover for essential behavior.
- Scope hover styles with pointer-capable media queries when touch flashing would be harmful.
- Inputs should remain at least 16px on mobile to avoid iOS focus zoom.
- Avoid autofocus on touch layouts unless it is clearly the primary intent.

### Typography and layout stability

- Use fluid scales (`clamp()` or Tailwind equivalents) where viewport size changes matter.
- Do not change font weight on hover/selection if it causes layout shift.
- Prefer tabular figures for dates, times, counters, or aligned numbers.
- Preserve German readability: avoid cramped line-height and fragile one-line layouts for compound words.

### Motion and performance

- Keep interaction animations short and subtle; avoid novelty motion for frequent actions.
- Respect reduced-motion preferences where meaningful movement is used.
- Avoid large blur/backdrop-filter areas, permanent `will-change`, and unnecessary GPU promotion.
- Pause or avoid off-screen autoplay/looping media.

### Project visual fit

- Preserve the `Nordic Resonance` design language in `DESIGN.md`: sacred modernity, restrained glassmorphism, precise typography, warm gold accents.
- Prefer Tailwind utilities and existing component systems over local one-off CSS.
- Keep production implementation static and Cloudflare-friendly.

## UI handoff evidence

For UI changes, include:

- Viewports checked: desktop and mobile.
- Keyboard/accessibility notes.
- Touch/hover behavior notes.
- Motion/performance risks or explicit none.
- Visual fidelity notes against `DESIGN.md` and relevant references.
- Any intentional deviations from this gate.
