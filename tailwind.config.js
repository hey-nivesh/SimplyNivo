/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0813',
        primary: '#9B51E0',
        accent: '#C07DF1',
        cardBg: '#161226',
        textPrimary: '#FFFFFF',
        textSecondary: '#A09CAB',
        border: '#2E274C',
      },
      fontFamily: {
        sans: [
          'System',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'SF Pro Display',
          'Inter',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
