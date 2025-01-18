/** @type {import('tailwindcss').Config} */
module.exports = {
  // darkMode: ["class"],
  content: ["./src/**/*.{jsx,js,ts,tsx}"],
  theme: {
    fontFamily: {
      'sans': ["Inter", "sans-serif"],
    },
    extend: {},
  },
  plugins: [require("tailwindcss-animate")],
}
