import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'asrog': ['"ASROG GENOS"', 'serif'],
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        rainbow: "rainbow 2s linear infinite",
        shine: "shine 5s linear infinite",
      },
      keyframes: {
        shimmer: {
          from: {
            "background-position": "0 0",
          },
          to: {
            "background-position": "-200% 0",
          },
        },
        rainbow: {
          "0%": {
            "background-position": "0% 50%",
          },
          "50%": {
            "background-position": "100% 50%",
          },
          "100%": {
            "background-position": "0% 50%",
          },
        },
        shine: {
          "0%": {
            "background-position": "100%",
          },
          "100%": {
            "background-position": "-100%",
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
