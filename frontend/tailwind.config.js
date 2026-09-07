/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#23281F',
        'ink-soft': '#4B5346',
        paper: '#EEF0EA',
        'paper-raised': '#F8F9F5',
        moss: {
          DEFAULT: '#3F5344',
          dark: '#2C3C31',
          light: '#5B7160',
        },
        gold: {
          DEFAULT: '#B8863A',
          light: '#D6AE71',
        },
        line: '#D8DBD0',
        danger: '#A6432F',
      },
      fontFamily: {
        serif: ['"Lora"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};
