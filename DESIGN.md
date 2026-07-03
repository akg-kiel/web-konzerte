# Nordic Resonance

Production design system for the Konzertkirche site.

## Tokens

Implementation lives in `src/styles/globals.css` and `tailwind.config.js`.

- Background: near-black church/canvas surfaces.
- Accent: brass/gold, used sparingly for primary CTAs and active states.
- Text: warm off-white on dark surfaces.
- Display font: Merriweather.
- Body/UI font: Hanken Grotesk.
- Radius: small, architectural, not bubbly.

## Rules

- Use existing Tailwind tokens before adding CSS.
- Use Astro components by default; React only for real interactivity.
- Keep pages static and Cloudflare-friendly.
- Keep contrast, keyboard access, image alt text, and mobile layout intact.
- No local process docs. Current work belongs in issues/PRs, not markdown plans.
