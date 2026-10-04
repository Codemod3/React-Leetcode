/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff8eb",
          100: "#feefc7",
          400: "#ffb84d",
          500: "#ffa116", // LeetCode primary orange
          600: "#ea8e08",
          700: "#c77405",
        },
        lc: {
          bg: "#1a1a1a",
          card: "#262626",
          cardDark: "#1e1e1e",
          header: "#282828",
          border: "#333333",
          borderLight: "#3e3e3e",
          hover: "#323232",
          input: "#282828",
          green: "#2cbb5d",
          greenHover: "#26a350",
          yellow: "#ffc01e",
          red: "#ff375f",
          cyan: "#00b8a3",
          text: "#eff2f6",
          muted: "#9ca3af",
          subtle: "#595959",
        },
      },
    },
  },
  plugins: [],
};

