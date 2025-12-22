/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'tomorrow': ['Tomorrow', 'sans-serif'],
        'hoefler': ['Hoefler Text', 'serif'],
        'inter': ['Inter', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
        'nunito': ['Nunito', 'sans-serif'],
        'source-sans': ['Source Sans Pro', 'sans-serif'],
        'playfair': ['Playfair Display', 'serif'],
        'merriweather': ['Merriweather', 'serif'],
        'calibri': ['Calibri', 'sans-serif'],
      },
      colors: {
        'azure': '#3696A8',
        'azure-light': '#4BA8B8',
        'azure-dark': '#2A7A8A',
        'blue':'#052C43',
        'blue-light':'#0A3D57',
        'blue-dark':'#041E2B',
        'orange':'#FE6A0F',
        'orange-light':'#FF7E2A',
        'orange-dark':'#E65A00',
        // Design system colors for Dubai platform
        'dubai': {
          'blue': '#4A90A4',      // Muted blue
          'blue-light': '#6BA8B8',
          'blue-dark': '#2E6B7A',
          'green': '#5A9A8A',     // Muted green
          'green-light': '#7AB8A8',
          'green-dark': '#3A7A6A',
          'gray': {
            '50': '#F9FAFB',
            '100': '#F3F4F6',
            '200': '#E5E7EB',
            '300': '#D1D5DB',
            '400': '#9CA3AF',
            '500': '#6B7280',
            '600': '#4B5563',
            '700': '#374151',
            '800': '#1F2937',
            '900': '#111827',
          }
        }
      },
    },
  },
  plugins: [],
}