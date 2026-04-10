/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#12151A', // Fondo oscuro profundo inspirado en la foto
        primary: '#f9d25b', // Amarillo de la firma y botón (más cálido y claro)
        secondary: '#d97706', // Naranja/Dorado oscuro para hovers y acentos
        textLight: '#ffffff'
      }
    },
  },
  plugins: [],
}
