/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Be Vietnam Pro', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['Source Code Pro', 'ui-monospace', 'monospace'],
      },
      colors: {
        anth: {
          parchment: '#f5f4ed',
          ivory: '#faf9f5',
          ink: '#141413',
          surface: '#30302e',
          terracotta: '#c96442',
          coral: '#d97757',
          text: '#5e5d59',
          border: '#f0eee6',
        },
      },
    },
  },
  plugins: [],
};
