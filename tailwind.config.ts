import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "neon-cyan": "#00f5ff",
        "neon-purple": "#b026ff",
        "neon-pink": "#ff2d95",
        "neon-green": "#39ff14",
        "neon-orange": "#ff6b35",
      },
      screens: {
        xs: "375px",
      },
    },
  },
  // Enable RTL variant for direction-aware utilities
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [],
};

export default config;
