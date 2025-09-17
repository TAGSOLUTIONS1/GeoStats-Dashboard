/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'azure': '#3696A8',
        'azure-light': '#4BA8B8',
        'azure-dark': '#2A7A8A',
      },
    },
  },
  plugins: [],
}