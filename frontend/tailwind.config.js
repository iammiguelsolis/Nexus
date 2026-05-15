/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          900: '#0F1D37',
          800: '#162B52',
          700: '#1F3A6E',
          600: '#2E5FA3',
          500: '#3B7DD8',
          400: '#5A9AE8',
          300: '#8BB8F0',
          200: '#BDD6F7',
          100: '#E4EEFB',
          50: '#F2F7FD',
        },
        success: {
          700: '#15774A',
          600: '#1D9E75',
          500: '#25C596',
          400: '#4DD9AD',
          300: '#80E8C5',
          200: '#B3F2DD',
          100: '#E6FAF2',
        },
        danger: {
          600: '#DC2626',
          500: '#EF4444',
          400: '#F87171',
          100: '#FEE2E2',
        },
        warning: {
          600: '#D97706',
          500: '#F59E0B',
          400: '#FBBF24',
          100: '#FEF3C7',
        },
        dark: {
          900: '#0B0F1A',
          800: '#111827',
          700: '#1F2937',
          600: '#374151',
          500: '#4B5563',
          400: '#6B7280',
          300: '#9CA3AF',
          200: '#D1D5DB',
          100: '#F3F4F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(46,95,163,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(46,95,163,0.6)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
