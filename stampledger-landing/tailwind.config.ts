import type { Config } from 'tailwindcss'

/**
 * COLOR STRATEGY (Based on conversion research):
 *
 * PRIMARY (Navy Blue) - Trust & Professionalism
 * - 40% of Fortune 500 use blue for trust signals
 * - Critical for B2G sales to risk-averse municipalities
 *
 * CTA (Orange) - High Contrast = Higher Conversions
 * - Orange CTAs convert 14% better than blue (OptinMonster)
 * - Red/orange creates urgency without feeling aggressive
 * - HIGH CONTRAST against navy = 21-34% conversion lift (HubSpot)
 *
 * ACCENT (Green) - Verification/Success States
 * - "Valid" stamps, checkmarks, success messages
 * - Signals growth and forward-thinking
 *
 * SECONDARY (Teal) - Innovation + Trust blend
 * - Combines blue stability with green growth
 */

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // TRUST - Navy blue for government/enterprise credibility
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
        // INNOVATION - Teal for modern tech feel
        secondary: {
          DEFAULT: '#0d9488',
          light: '#14b8a6',
          dark: '#0f766e',
        },
        // SUCCESS - Green for verification/valid states
        accent: {
          DEFAULT: '#22c55e',
          light: '#4ade80',
          dark: '#16a34a',
        },
        // CTA - Orange for HIGH CONTRAST conversion
        // Research: Orange converts 14%+ better than blue
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
