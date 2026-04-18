import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#06111f",
        surface: "#0a1729",
        line: "#18314f",
        accent: "#2dd4bf",
        rose: "#fb7185",
        gold: "#fbbf24",
        sky: "#38bdf8"
      },
      boxShadow: {
        panel: "0 24px 60px rgba(2, 8, 23, 0.45)"
      },
      animation: {
        rise: "rise 0.6s ease-out forwards",
        pulseGlow: "pulseGlow 3s ease-in-out infinite"
      },
      keyframes: {
        rise: {
          "0%": {
            opacity: "0",
            transform: "translateY(16px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        pulseGlow: {
          "0%, 100%": {
            boxShadow: "0 0 0 rgba(45, 212, 191, 0)"
          },
          "50%": {
            boxShadow: "0 0 30px rgba(45, 212, 191, 0.18)"
          }
        }
      }
    }
  },
  plugins: []
};

export default config;
