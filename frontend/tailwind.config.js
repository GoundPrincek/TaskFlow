/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
        },
        canvas: "#F8FAFC",
        ink: "#0F172A",
        muted: "#64748B",
        line: "#E2E8F0",
        success: "#15803D",
        warning: "#B45309",
        danger: "#B91C1C",
        info: "#1D4ED8",
      },
      boxShadow: {
        card: "0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px rgb(15 23 42 / 0.04)",
      },
    },
  },
  plugins: [],
};
