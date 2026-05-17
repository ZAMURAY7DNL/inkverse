/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#141414",
          surface: "#181818",
          card: "#1f1f1f",
          muted: "#2b2b2b",
          border: "#2a2a2a",
        },
        ink: {
          50: "#ffe6e8",
          100: "#ffc8ce",
          200: "#ff9aa4",
          300: "#ff6b7b",
          400: "#f43b4f",
          500: "#e50914",
          600: "#c10812",
          700: "#9a060f",
          800: "#73050b",
          900: "#4e0308",
        },
        manga: {
          50: "#f6f6f6",
          100: "#e7e7e7",
          200: "#d3d3d3",
          300: "#bbbbbb",
          400: "#9f9f9f",
          500: "#808080",
          600: "#666666",
          700: "#4c4c4c",
          800: "#323232",
          900: "#1f1f1f",
        },
        panel: {
          50: "#fafafa",
          100: "#f4f4f4",
          200: "#e5e5e5",
          300: "#cfcfcf",
          400: "#b0b0b0",
          500: "#8d8d8d",
          600: "#6f6f6f",
          700: "#505050",
          800: "#323232",
          900: "#1c1c1c",
        },
      },
      fontFamily: {
        display: ["'Inter'", "'Segoe UI'", "system-ui", "sans-serif"],
        body: ["'Inter'", "'Segoe UI'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        comic: ["'Inter'", "'Segoe UI'", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "halftone": "radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)",
        "panel-grid": "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        "halftone": "8px 8px",
        "panel-grid": "24px 24px",
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "pop": "pop 0.2s ease-out",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.95)" },
          "60%": { transform: "scale(1.03)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
