/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        backgroundImage:{
          'hiph': "url('/frontend/src/assets/f1c7d8a6-1161-49b2-8e77-2386ae3348d4.jpg')",
        }
      },
    },
    plugins: [],
  }