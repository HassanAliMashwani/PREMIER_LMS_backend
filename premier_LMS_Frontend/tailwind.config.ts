import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': {
          DEFAULT: '#1a4a3a',
          dark: '#0f2d24',
          light: '#2a6a52',
        },
        'accent-gold': {
          DEFAULT: '#c9a84c',
          dark: '#b8963e',
          light: '#d4b965',
        },
        'hero-dark': '#0f2d24',
        'hero-light': '#c9a84c',
        'live-blue': '#2563eb',
        'discount-gold': '#f59e0b',
        'text-primary': '#1a1a1a',
        'text-secondary': '#6b7280',
        'border-light': '#e5e7eb',
        'bg-light': '#f9fafb',
        'mint': '#9fd3b8',
        'forest': '#1a2e1a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)',
        'header': '0 1px 3px rgba(0,0,0,0.05)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
}
export default config
