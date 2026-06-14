---
name: Nordic Resonance
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#38393a'
  surface-container-lowest: '#0d0e0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#292a2b'
  surface-container-highest: '#343535'
  on-surface: '#e3e2e2'
  on-surface-variant: '#c6c6cd'
  inverse-surface: '#e3e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#909097'
  outline-variant: '#45464d'
  surface-tint: '#bec6e0'
  primary: '#bec6e0'
  on-primary: '#283044'
  primary-container: '#0f172a'
  on-primary-container: '#798098'
  inverse-primary: '#565e74'
  secondary: '#e9c349'
  on-secondary: '#3c2f00'
  secondary-container: '#af8d11'
  on-secondary-container: '#342800'
  tertiary: '#b7c8e1'
  on-tertiary: '#213145'
  tertiary-container: '#06182b'
  on-tertiary-container: '#728299'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#121414'
  on-background: '#e3e2e2'
  surface-variant: '#343535'
  midnight-deep: '#020617'
  slate-mist: '#1E293B'
  champagne-glow: '#F3E5AB'
  brass-accent: '#B8860B'
typography:
  display-lg:
    fontFamily: Merriweather
    fontSize: 72px
    fontWeight: '500'
    lineHeight: 80px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Merriweather
    fontSize: 44px
    fontWeight: '500'
    lineHeight: 52px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Merriweather
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
  headline-md:
    fontFamily: Merriweather
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

The brand personality for this design system is sophisticated, architectural, and serene. It bridges the gap between the historic reverence of a sacred space and the precision of a high-end modern performance venue. The UI should evoke a sense of "sacred modernity"—a quiet, respectful digital environment that allows the artistry of music and the grandeur of architecture to take center stage.

The design style utilizes **Modern Minimalism with Glassmorphism**. This approach emphasizes heavy whitespace to represent the vastness of the church's nave, while frosted, translucent layers provide depth without clutter. The aesthetic is high-end and professional, inspired by editorial layouts where large-scale imagery and precise typography create a gallery-like experience. The emotional response should be one of calm, awe, and anticipation.

## Colors

The palette is rooted in a dark-mode-first approach to simulate the immersive, focused environment of a concert hall.

- **Primary (Midnight & Slate):** Represents the Baltic Sea and the architectural shadows of the church. These deep blues and grays provide the foundation for the "sacred" atmosphere.
- **Secondary (Champagne Gold):** Used sparingly for high-prestige elements, CTAs, and accents. It mimics the warmth of brass instruments and the glow of liturgical lighting.
- **Neutral (Crisp White):** Reserved for high-readability body text and essential navigational elements.

Backgrounds should primarily use `midnight-deep`, while surfaces and cards utilize `slate-mist` with varying levels of transparency to achieve the glassmorphic effect.

## Typography

This design system uses a high-contrast typographic pairing to reflect the intersection of history and modern performance.

- **Merriweather (Headlines):** The production display serif, locally hosted for privacy and performance. It carries the prestige and historical weight originally modeled by Stitch's EB Garamond direction. Use this for major titles and storytelling elements. Large display sizes should use tighter letter spacing.
- **Hanken Grotesk (Body & UI):** A clean, modern sans-serif that ensures accessibility and technical precision. It provides a contemporary counterpoint to the serif, making the information feel current and navigable.

**German Language Note:** Given the length of German compound words (e.g., _Abonnementvorstellungen_), line heights are slightly increased for body text to maintain vertical rhythm and avoid crowding.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model on desktop to create a curated, editorial feel, while transitioning to a **Fluid Grid** on mobile for maximum usability.

- **Desktop:** 12-column grid with a 1280px max-width. Use generous 64px side margins to create "breathing room" that mirrors architectural space.
- **Rhythm:** An 8px base unit drives all spacing decisions. Use Tailwind spacing utilities as the implementation layer. Prefer deliberate scale steps (`gap-2`, `gap-3`, `mb-5`, `pt-5`, `px-7`, `py-7`) over arbitrary one-off values.
- **Divider Rhythm:** When a divider separates content from actions, the space before and after the divider should match. Current concert cards use 20px from description to divider and 20px from divider to buttons (`mb-5` + `pt-5`).
- **Mobile:** 4-column grid with 20px margins. Content should reflow vertically, with typography scaling down to the defined `-mobile` variants to ensure readability on smaller screens.

## Elevation & Depth

Visual hierarchy is achieved through **Glassmorphic Tonal Layers** and subtle ambient glows rather than traditional heavy shadows.

1. **Base Layer:** Solid `midnight-deep` (#020617).
2. **Surface Layer:** Semi-transparent `slate-mist` (60% opacity) with a 12px backdrop blur. This is used for navigation bars and secondary cards.
3. **Elevation Glow:** For interactive elements or featured concert cards, use a very low-opacity "warm" shadow (using a tint of `secondary_color`) to simulate the reflection of light off brass or wood.
4. **Dividers:** Use 1px borders with 10% white opacity. Avoid solid lines; the goal is to suggest structure through light and transparency.

## Shapes

The shape language is **Soft (0.25rem)**. This subtle rounding maintains the architectural rigor of the building—honoring its stone and structure—while softening the edges for a modern digital interface.

- **Primary Buttons:** Use `rounded-lg` (0.5rem) to make them feel tactile but not "bubbly."
- **Image Containers:** Should remain sharp (0px) or use the standard soft radius to mimic framed art or architectural windows.
- **Interactive Tags/Chips:** Use the standard soft radius to maintain consistency with the body text blocks.

## Components

- **Buttons:** Primary buttons use a solid `secondary_color` (Gold) with `primary_color` text. Secondary buttons are "Ghost" style with a 1px white border and backdrop blur. In concert cards, action buttons are right-aligned ghost buttons: `Details` uses a low-contrast white outline, while `Tickets` uses the gold outline/accent.
- **Concert Cards:** Feature large-scale photography with `object-cover` image fill. Homepage cards follow this flow: image, date metadata, one-line title, short description, divider, right-aligned actions. Programme cards may use a horizontal media/text layout. On hover, the gold accent border appears.
- **Concert Card Text:** Homepage card titles are single-line with ellipsis. Only titles that actually overflow one line may auto-marquee, and only on card hover/focus-within; never expose a horizontal scroll box. Descriptions are clamped to three lines and keep the same 8px-system spacing to the action divider as the divider has to the buttons.
- **Homepage Programme Section:** Keep the visible `Programm` label. The `Nächste Konzerte` heading may be visually hidden for a cleaner Stitch-aligned composition, but it must remain available to assistive technology.
- **Input Fields:** Minimalist design with only a bottom border (1px white, 30% opacity). On focus, the border turns Gold.
- **Chips/Badges:** Used for concert categories (e.g., "Orgel," "Kammerkonzert"). Transparent background with `label-caps` typography and a 1px slate border.
- **Navigation:** A persistent top bar using glassmorphism. Navigation links use `label-caps` for a disciplined, organized feel.
- **Ticket Selector:** A high-contrast component using `slate-mist` surfaces and clear gold indicators for selected seats or dates.

## Project Implementation Rules

- Use **Tailwind CSS** for component styling. Custom CSS should be limited to global tokens/theme definitions or behavior that cannot be expressed clearly with Tailwind utilities.
- Prefer shadcn component over custom ones.
- If necessary change the systems introduced in the project instead of overriding it.
- Preserve Cloudflare static asset assumptions.
- For UI changes, validate responsive desktop/mobile behavior, accessibility/keyboard behavior, and visual fidelity to references.
