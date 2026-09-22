/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          light: '#faf6ee',
          dark: '#1b1713',
        },
        /* ── Cream editorial neutrals (light) + warm charcoal (dark) ── */
        cream: {
          50: '#fffdf8',
          100: '#faf6ee',
          200: '#f4eee1',
          300: '#eae3d2',
          400: '#ddd2ba',
          500: '#c9bda1',
          600: '#a99b7e',
          700: '#85795f',
          800: '#5c5342',
          900: '#3c362b',
        },
        /* ── Signature orange (accents / active states) ── */
        flame: {
          50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
          400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
        },
        /* ── Bright blue (primary buttons / links) ── */
        azure: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
        },
        marble: {
          50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1',
          400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c',
          800: '#292524', 900: '#1c1917',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
        /* ── Legacy aliases so every existing utility resolves ── */
        primary: '#f97316',
        'primary-light': '#fb923c',
        secondary: '#f4eee1',
        main: '#2b2622',
        muted: '#8a8171',
        error: '#ef4444',
        border: '#eae3d2',
        accent: '#f97316',
        'accent-light': '#fdba74',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        urdu: ['"Noto Nastaliq Urdu"', 'serif'],
        english: ['Inter', 'system-ui', 'sans-serif'],
      },
      lineHeight: {
        urdu: '2.2',
        'urdu-lg': '2.6',
      },
      minHeight: {
        'urdu-line': '3rem',
      },
      boxShadow: {
        /* Soft warm shadows that sit nicely on cream */
        soft: '0 1px 2px rgba(60, 54, 43, 0.05), 0 4px 14px -4px rgba(60, 54, 43, 0.10)',
        lift: '0 2px 4px rgba(60, 54, 43, 0.06), 0 12px 28px -8px rgba(60, 54, 43, 0.18)',
        'glow-orange': '0 4px 16px -2px rgba(249, 115, 22, 0.45)',
        'glow-blue': '0 4px 16px -2px rgba(37, 99, 235, 0.45)',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(2.5rem, -2rem, 0) scale(1.06)' },
        },
        floatSlower: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1.04)' },
          '50%': { transform: 'translate3d(-3rem, 1.5rem, 0) scale(0.96)' },
        },
        bubbleRise: {
          '0%': { transform: 'translate3d(0, 0, 0) scale(0.6)', opacity: '0' },
          '12%': { opacity: '0.55' },
          '85%': { opacity: '0.35' },
          '100%': { transform: 'translate3d(var(--drift, 1.5rem), -105vh, 0) scale(1.05)', opacity: '0' },
        },
        spinSlow: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        slideUpFade: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        floatSlow: 'floatSlow 16s ease-in-out infinite',
        floatSlower: 'floatSlower 22s ease-in-out infinite',
        spinSlow: 'spinSlow 28s linear infinite',
        popIn: 'popIn 0.22s cubic-bezier(0.2, 0.9, 0.3, 1.2) both',
        slideUpFade: 'slideUpFade 0.28s ease both',
      },
    },
  },
  plugins: [],
}
