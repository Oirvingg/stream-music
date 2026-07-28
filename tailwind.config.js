/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'],
      },
      colors: {
        yt: {
          black: '#030303',
          surface: '#1d1d1d',
          'surface-hover': '#2c2c2c',
          'surface-elevated': '#292929',
          border: '#3d3d3d',
          white: '#ffffff',
          'text-secondary': '#aaaaaa',
          'text-tertiary': '#717171',
          accent: '#ff0000',
          pill: '#272727',
          'pill-active': '#ffffff',
          'player-bg': '#212121',
          'search-bg': '#1a1a1a',
          overlay: 'rgba(0, 0, 0, 0.6)',
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shake': 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
};
