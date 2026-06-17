/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light Orange theme for all standard blue/teal/indigo elements
        blue: {
          50: '#fffcf5',
          100: '#fffaed',
          200: '#ffedd5',
          300: '#fed7aa',
          400: '#fdba74',
          500: '#fb923c',
          600: '#f97316',
          700: '#ea580c',
          800: '#c2410c',
          900: '#9a3412',
        },
        indigo: {
          50: '#fffcf5',
          100: '#fffaed',
          200: '#ffedd5',
          300: '#fed7aa',
          400: '#fdba74',
          500: '#fb923c',
          600: '#f97316',
          700: '#ea580c',
          800: '#c2410c',
          900: '#9a3412',
        },
        teal: {
          50: '#fffcf5',
          100: '#fffaed',
          200: '#ffedd5',
          300: '#fed7aa',
          400: '#fdba74',
          500: '#fb923c',
          600: '#f97316',
          700: '#ea580c',
          800: '#c2410c',
          900: '#9a3412',
        },
        // ── Primary Brand ──────────────────────────────────────────
        primary: {
          50: '#fffcf5',
          100: '#fffaed',
          200: '#ffedd5',
          300: '#fed7aa',
          400: '#fdba74',
          500: '#fb923c',
          600: '#f97316',
          700: '#ea580c',
          800: '#c2410c',
          900: '#9a3412',
        },
        // ── Surface / Layout ───────────────────────────────────────
        surface: {
          bg:      '#F5F7FB',  // App background
          card:    '#FFFFFF',  // Card surface
          sidebar: '#FFFFFF',  // Sidebar surface
          header:  '#FFFFFF',  // Top bar
          hover:   '#fff7ed',  // Hover state on nav items (orange-50)
          active:  '#ffedd5',  // Active nav item bg (orange-100)
        },
        // ── Border ─────────────────────────────────────────────────
        border: {
          DEFAULT: '#E8EDF5',
          light:   '#F0F4FA',
          medium:  '#D4DCE9',
          strong:  '#BAC4D6',
        },
        // ── Text ───────────────────────────────────────────────────
        text: {
          primary:   '#0F172A',  // Headings
          secondary: '#334155',  // Body text
          muted:     '#64748B',  // Secondary labels
          subtle:    '#94A3B8',  // Placeholders / captions
          inverse:   '#FFFFFF',
        },
        // ── Status Colors ──────────────────────────────────────────
        success: {
          50:  '#F0FDF4',
          100: '#DCFCE7',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
        },
        warning: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        danger: {
          50:  '#FFF1F2',
          100: '#FFE4E6',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
        },
        info: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
        },
        // ── Legacy academic aliases (keep for backward compat) ─────
        academic: {
          dark:        '#1E293B',
          darker:      '#0F172A',
          primary:     '#ea580c',
          secondary:   '#f97316',
          accent:      '#F59E0B',
          accentHover: '#D97706',
          success:     '#16A34A',
          warning:     '#F59E0B',
          danger:      '#E11D48',
          border:      '#E8EDF5',
          lightBg:     '#F5F7FB',
        },
      },
      fontFamily: {
        sans:     ['Inter', 'system-ui', 'sans-serif'],
        display:  ['Poppins', 'Inter', 'sans-serif'],
        mono:     ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        'card': '16px',
        'btn':  '10px',
        '2xl':  '16px',
        '3xl':  '20px',
      },
      boxShadow: {
        // Soft elevated cards
        'card':       '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'card-md':    '0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -2px rgba(15, 23, 42, 0.04)',
        'card-lg':    '0 8px 24px -4px rgba(15, 23, 42, 0.10), 0 4px 8px -4px rgba(15, 23, 42, 0.04)',
        'sidebar':    '2px 0 12px -2px rgba(15, 23, 42, 0.06)',
        'topbar':     '0 1px 4px 0 rgba(15, 23, 42, 0.05)',
        // Legacy
        'premium':    '0 4px 20px -2px rgba(15, 23, 42, 0.08)',
        'premium-lg': '0 10px 30px -5px rgba(15, 23, 42, 0.12)',
        'matrix-hover': '0 0 12px 2px rgba(59, 130, 246, 0.25)',
        'glow-orange': '0 0 20px rgba(255,107,0,0.25)',
        'premium-glass': '0 25px 60px rgba(0,0,0,0.25)',
      },
      animation: {
        'fadeIn':     'fadeIn 0.2s ease-out',
        'slideInLeft':'slideInLeft 0.25s ease-out',
        'slideUp':    'slideUp 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'parallax':   'parallax 20s ease-in-out infinite alternate',
        'float-slow': 'float 6s ease-in-out infinite',
        'float-medium':'float 4s ease-in-out infinite',
        'shine':      'shine 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        parallax: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shine: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
      },
    },
  },
  plugins: [],
}
