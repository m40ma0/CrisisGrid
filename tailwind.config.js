/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        command: "0 18px 50px rgba(15, 23, 42, 0.12)",
      },
      colors: {
        command: {
          ink: "#161616",
          panel: "#f8fafc",
          line: "#d8dde6",
        },
      },
    },
  },
  plugins: [],
};
