import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a3a52',
          light: '#2c5f82',
          dark: '#0f2332',
          50: '#f0f7fb',
          100: '#dceef7',
          200: '#bddff0',
          300: '#8ec9e6',
          400: '#58acd5',
          500: '#3691c2',
          600: '#2875a4',
          700: '#235f86',
          800: '#1a3a52',
          900: '#0f2332',
        },
        secondary: {
          DEFAULT: '#0d9488',
          light: '#14b8a6',
          dark: '#0f766e',
        },
        accent: {
          DEFAULT: '#22c55e',
          light: '#4ade80',
          dark: '#16a34a',
        },
        cta: {
          DEFAULT: '#f97316',
          light: '#fb923c',
          dark: '#ea580c',
          hover: '#c2410c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
