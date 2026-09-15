/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
      },
    },
    extend: {
      colors: {
        // Primary — Deep Blue (headers, primary buttons)
        primary: {
          DEFAULT: '#1E3A8A',
          light: '#2E4FA8',
          dark: '#172B66',
          50: '#EEF2FB',
          100: '#D9E2F2',
        },
        // Secondary — Light Grey (backgrounds)
        secondary: {
          DEFAULT: '#F3F4F6',
          dark: '#E5E7EB',
        },
        // Accent — Amber (highlights, active states)
        accent: {
          DEFAULT: '#D97706',
          light: '#F59E0B',
          dark: '#B45309',
          50: '#FEF6E7',
        },
        // Marble White (cards, surfaces)
        marble: '#FFFFFF',
        // Text colors
        'text-dark': '#1F2937',
        'text-light': '#6B7280',
        // Border
        border: '#E5E7EB',
        // Status colors
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          dark: '#047857',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#B45309',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          dark: '#B91C1C',
        },
      },
      fontFamily: {
        // Urdu first (primary language) — Nastaliq script (CSS variables live in index.css)
        urdu: ['var(--font-urdu)', '"Noto Nastaliq Urdu"', 'serif'],
        // English / numbers
        english: ['var(--font-english)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Default stack: Urdu glyphs from Nastaliq, Latin/digits fall back to Inter
        sans: ['var(--font-urdu)', '"Noto Nastaliq Urdu"', 'var(--font-english)', 'Inter', 'serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
}
