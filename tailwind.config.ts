import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefdf3',
          100: '#d6fae3',
          200: '#aef2c9',
          300: '#79e4a8',
          400: '#43cf81',
          500: '#1fb267',
          600: '#149153',
          700: '#117445',
          800: '#115c39',
          900: '#0f4c31',
          950: '#052b1b',
        },
        ink: {
          50: '#f7f8f8',
          100: '#eef0f1',
          200: '#d9dde0',
          300: '#b6bec3',
          400: '#8b969d',
          500: '#6c7a82',
          600: '#56646c',
          700: '#46525a',
          800: '#3a444a',
          900: '#262e33',
          950: '#15191c',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(15, 76, 49, 0.08), 0 8px 24px -8px rgba(15, 76, 49, 0.10)',
        card: '0 1px 2px rgba(15, 76, 49, 0.04), 0 4px 12px -4px rgba(15, 76, 49, 0.08)',
        glow: '0 0 0 4px rgba(31, 178, 103, 0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
       'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite',
      },
      backgroundImage: {
        'brand-radial': 'radial-gradient(circle at top right, rgba(31,178,103,0.16), transparent 60%)',
        'brand-grid': 'linear-gradient(rgba(15,76,49,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15,76,49,0.05) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};

export default config;
