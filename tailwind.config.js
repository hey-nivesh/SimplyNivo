/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0813',
        primary: '#FF6B00',
        primaryLight: '#FF8800',
        primaryDark: '#CC5200',
        accent: '#FF8800',
        cardBg: '#18121E',
        cardBorder: '#2E2218',
        textPrimary: '#FFFFFF',
        textSecondary: '#A09CAB',
        textMuted: '#686375',
        border: '#2E2218',
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
