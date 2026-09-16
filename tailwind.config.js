/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5ff",
          100: "#d9e8ff",
          200: "#bcd7ff",
          300: "#8ebdff",
          400: "#5998ff",
          500: "#2f74ff",
          600: "#1b5ef3",
          700: "#1347df",
          800: "#1638b4",
          900: "#18328d",
          950: "#142157",
        },
        ink: {
          50: "#f6f8fb",
          100: "#eef2f7",
          200: "#e2e8f0",
          500: "#64748b",
          600: "#475569",
          800: "#1e293b",
          900: "#0f172a",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.04)",
        nav: "0 12px 40px rgba(15, 23, 42, 0.08)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
