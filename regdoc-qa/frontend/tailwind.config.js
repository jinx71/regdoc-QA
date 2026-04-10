/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F4F7FA', // cool, clinical app background
        surface: '#FFFFFF',
        ink: { DEFAULT: '#14233A', soft: '#3A4A5E', faint: '#6B7A8D' },
        line: '#DCE3EC', // hairline rules
        brand: { DEFAULT: '#1B4F72', bright: '#2E6FA8', deep: '#143B57' },
        // "verify" = traceability/citation accent — used ONLY for citations & cited sources
        verify: { DEFAULT: '#1F7A5C', ink: '#155C44', soft: '#E7F3EE', ring: '#9ED3BE' },
        warn: { DEFAULT: '#9C6B16', soft: '#FAF1DC' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(20, 35, 58, 0.04), 0 8px 24px rgba(20, 35, 58, 0.06)',
        card: '0 1px 2px rgba(20, 35, 58, 0.05)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(31, 122, 92, 0)' },
          '50%': { boxShadow: '0 0 0 4px rgba(31, 122, 92, 0.22)' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        'pulse-ring': 'pulse-ring 1.1s ease-in-out 1',
        spin: 'spin 0.7s linear infinite',
      },
    },
  },
  plugins: [],
};
