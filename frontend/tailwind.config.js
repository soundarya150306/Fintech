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
          900: '#0B0F19',
          850: '#0F1626',
          800: '#141D32',
          750: '#1A253E',
          700: '#1E293B',
          600: '#334155'
        },
        brand: {
          teal: '#00F5D4',
          emerald: '#10B981',
          cyan: '#06B6D4',
          blue: '#3B82F6',
          indigo: '#6366F1',
          purple: '#8B5CF6',
          amber: '#F59E0B',
          rose: '#F43F5E',
          crimson: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        'glow-teal': '0 0 25px rgba(0, 245, 212, 0.15)',
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.15)',
        'glow-rose': '0 0 25px rgba(239, 68, 68, 0.15)',
        'glow-amber': '0 0 25px rgba(245, 158, 11, 0.15)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    },
  },
  plugins: [],
}
