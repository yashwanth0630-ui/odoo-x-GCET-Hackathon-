import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Industrial Warehouse Palette
        wh: {
          ash:       "#C3B4AA", // Ash Grey - light warm text
          junkrat:   "#988879", // Junkrat - secondary text
          badger:    "#6E655C", // Grouchy Badger - muted text
          rust:      "#AD543C", // Brown Rust - primary accent
          truffle:   "#584D44", // Dark Truffle - card/panel bg
          orchestra: "#221D1A", // Dark Orchestra - deepest bg
        },
        brand: {
          50:  "#fdf2ee",
          100: "#f9ddd3",
          200: "#f3b9a5",
          300: "#e99577",
          400: "#d4886e",
          500: "#AD543C",
          600: "#974832",
          700: "#7e3c29",
          800: "#653020",
          900: "#4c2418",
          950: "#33170f",
        },
        inventory: {
          emerald: "#10b981",
          amber:   "#f59e0b",
          rose:    "#f43f5e",
          cyan:    "#06b6d4",
          violet:  "#8b5cf6",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "conic-gradient": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
