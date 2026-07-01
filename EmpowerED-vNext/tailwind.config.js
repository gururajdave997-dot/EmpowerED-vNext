/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#0F6CBD", dark: "#103F91", light: "#DEEBF7" },
      },
    },
  },
  plugins: [],
};
