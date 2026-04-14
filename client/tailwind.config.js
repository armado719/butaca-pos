/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg:   '#12151A', // Fondo oscuro principal
        surface:  '#1C1F26', // Superficie de tarjetas
        primary:  '#F5A623', // Dorado/Ámbar — color firma La Butaca
        secondary:'#B5201E', // Rojo carmesí — color logo La Butaca
        accent:   '#D4880A', // Dorado oscuro para hovers
        textLight:'#FFFFFF',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
