# Nordic Resonance

Production design rules for the Konzertkirche site.

## Tokens

Implementation lives in `src/styles/globals.css` and `tailwind.config.js`.

- Canvas: `midnight`; supporting surfaces: `surface` / `slate-mist`.
- Accent: `secondary`, `champagne`, `brass`; use sparingly for primary actions and active states.
- Text: `role-on` for body, lower opacity for metadata/helper copy.
- Type: Merriweather for expressive headings, Hanken Grotesk for UI and copy.
- Shape/elevation: `rounded-lg`/`rounded-xl`, `shadow-panel`/`shadow-glow` only when needed.

## Typography

- Use Tailwind type scale only; no arbitrary `text-*`, `leading-*`, or `tracking-*` values.
- Prefer slash line-height: `text-sm/6`, `text-base/7`, `text-4xl/tight`.
- One page hero title is dominant.
- Content H2s use Hanken Grotesk at `text-xs/4 font-semibold uppercase tracking-widest text-secondary`; do not add a separate label above them.

## Spacing

- Use Tailwind’s 8px rhythm: even spacing steps only (`2`, `4`, `6`, ...).
- `2`/`4`: tight UI. `6`/`8`: card internals. `10`/`12`/`16`: grids/blocks. `20+`: sections.
- Shared page containers use `mx-auto w-full max-w-screen-2xl px-6 md:px-8 lg:px-16`.

## Color hierarchy

- Primary CTA: filled accent on dark text.
- Secondary CTA: border/transparent or muted surface.
- Metadata, counts, helper text, and archive content are quieter than titles and actions.
- Prefer spacing/background contrast over outlining every box.

## Components

- Reuse `Layout`, `Header`, `Footer`, `PageHero`, `Concerts`, `ConcertCard`, `CtaCard`, and `Card`.
- Do not create one-off components or global class aliases for normal Tailwind utilities.
- Local class constants are OK inside a component when they prevent duplicated button/card strings.

## Accessibility

- Preserve one clear `h1`, landmarks, alt text, visible focus, and keyboard access.
- Motion must be optional; avoid hover-only meaning.
- Forms use native labels, fieldsets/legends where useful, and clear required-state copy.

## Tailwind exceptions

Allowed arbitrary values only for image gradients, object-position crops, special aspect ratios, hero viewport masks/sizes, image widths arrays, `gap-px`, and native selector cleanup.
