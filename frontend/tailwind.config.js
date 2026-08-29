/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#070A10',
          900: '#0C111C',
          800: '#141C2E',
          700: '#1E293B',
          600: '#334155'
        },
        teal: {
          accent: '#00F5D4',
          glow: '#00F5D422'
        },
        amber: {
          warning: '#F59E0B'
        },
        crimson: {
          critical: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
