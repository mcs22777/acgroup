/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // AC Grup Proje — Kurumsal Renkler
        primary: {
          50: '#E8EDF5',
          100: '#C5D1E8',
          200: '#9FB3D9',
          300: '#7995CA',
          400: '#5C7FBF',
          500: '#1B3A6B',
          600: '#172F56',
          700: '#132542',
          800: '#0F1C32',
          900: '#0A1220',
        },
        accent: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#D4A017',
          600: '#B8860B',
          700: '#996515',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
