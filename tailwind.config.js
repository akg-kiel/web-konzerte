/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.25rem',
        lg: '4rem'
      },
      screens: {
        '2xl': '1280px'
      }
    },
    extend: {
      colors: {
        midnight: '#020617',
        surface: '#121414',
        'slate-mist': '#1e293b',
        champagne: '#f3e5ab',
        brass: '#b8860b',
        secondary: '#e9c349',
        'on-surface': '#e3e2e2',
        paper: '#faf7ee',
        role: {
          dominant: 'rgb(var(--color-midnight-rgb) / <alpha-value>)',
          support: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
          'support-elevated': 'rgb(var(--color-slate-mist-rgb) / <alpha-value>)',
          accent: 'rgb(var(--color-champagne-rgb) / <alpha-value>)',
          'accent-strong': 'rgb(var(--color-brass-rgb) / <alpha-value>)',
          on: 'rgb(var(--color-on-surface-rgb) / <alpha-value>)',
          muted: 'rgb(var(--color-muted-rgb) / <alpha-value>)'
        },
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring) / <alpha-value>)'
      },
      fontFamily: {
        display: ['EB Garamond', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        body: [
          'Hanken Grotesk',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif'
        ],
        sans: [
          'Hanken Grotesk',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif'
        ],
        serif: ['EB Garamond', 'Georgia', 'Cambria', 'Times New Roman', 'serif']
      },
      fontSize: {
        eyebrow: ['clamp(0.875rem, 0.84rem + 0.16vw, 0.95rem)', { lineHeight: '1.2' }],
        lead: ['clamp(1.125rem, 1rem + 0.62vw, 1.5rem)', { lineHeight: '1.55' }],
        display: [
          'clamp(3rem, 2rem + 5vw, 7rem)',
          { lineHeight: '0.86', letterSpacing: '-0.045em' }
        ],
        headline: [
          'clamp(2.25rem, 1.62rem + 3.12vw, 4.5rem)',
          { lineHeight: '0.94', letterSpacing: '-0.035em' }
        ]
      },
      spacing: {
        'grid-1': 'var(--space-grid)',
        'grid-2': 'var(--space-unit)',
        'grid-3': 'var(--space-sm)',
        'grid-4': 'var(--space-md)',
        'grid-6': 'var(--space-lg)',
        'grid-8': 'var(--space-xl)',
        'grid-12': 'var(--space-2xl)',
        'grid-20': 'var(--space-3xl)',
        gutter: 'var(--page-gutter)',
        'section-sm': 'clamp(3rem, 8vw, 6rem)',
        section: 'clamp(5rem, 12vw, 10rem)',
        'section-lg': 'clamp(7rem, 16vw, 14rem)'
      },
      maxWidth: {
        measure: 'var(--measure-copy)',
        'measure-narrow': 'var(--measure-narrow)',
        'measure-wide': 'var(--measure-wide)'
      },
      lineHeight: {
        body: 'var(--leading-body)',
        compact: 'var(--leading-compact)',
        display: 'var(--leading-display)'
      },
      letterSpacing: {
        label: 'var(--tracking-label)',
        display: 'var(--tracking-display)',
        heading: 'var(--tracking-heading)'
      },
      borderRadius: {
        '4xl': '2rem',
        inherit: 'inherit'
      },
      boxShadow: {
        glow: '0 0 48px rgb(243 229 171 / 0.12)',
        panel: '0 24px 80px rgb(0 0 0 / 0.35)'
      },
      backgroundImage: {
        'editorial-radial':
          'radial-gradient(circle at 12% -10%, rgb(243 229 171 / 0.13), transparent 28rem), radial-gradient(circle at 88% 8%, rgb(30 41 59 / 0.42), transparent 30rem)'
      }
    }
  },
  plugins: []
};
