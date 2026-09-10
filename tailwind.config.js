/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sentinel: {
          950: '#06080d',
          900: '#0a0d14',
          850: '#0f1420',
          800: '#141b2b',
          700: '#1e293b',
          600: '#334155',
          500: '#475569',
        },
        cyber: {
          allow: '#10b981',
          'allow-glow': 'rgba(16, 185, 129, 0.25)',
          confirm: '#f59e0b',
          'confirm-glow': 'rgba(245, 158, 11, 0.25)',
          block: '#ef4444',
          'block-glow': 'rgba(239, 68, 68, 0.3)',
          cyan: '#06b6d4',
          indigo: '#6366f1',
          violet: '#8b5cf6'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'laser-scan': 'laserScan 3s linear infinite',
        'data-stream': 'dataStream 2s linear infinite',
      },
      keyframes: {
        laserScan: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '50%': { opacity: '0.8' },
          '100%': { transform: 'translateY(100%)', opacity: '0' }
        },
        dataStream: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' }
        }
      }
    },
  },
  plugins: [],
}
