/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  safelist: [
    { pattern: /bg-(blue|emerald|amber|rose|purple|orange|red)-(50|100|600|700)/ },
    { pattern: /text-(blue|emerald|amber|rose|purple|orange|red)-(200|400|500|600|700)/ },
    { pattern: /border-(blue|emerald|amber|rose|purple|orange|red)-(100|200|300)/ },
  ],
  plugins: [],
};
