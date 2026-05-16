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
        ink: {
          50: "#f0eaff",
          100: "#d9c9ff",
          200: "#b89dff",
          300: "#9370f5",
          400: "#7c4dff",
          500: "#6729e8",
          600: "#5318c4",
          700: "#400ea0",
          800: "#2e0880",
          900: "#1e0560",
        },
        manga: {
          50: "#fff0f5",
          100: "#ffd0df",
          200: "#ff9fbb",
          300: "#ff6b96",
          400: "#f03e72",
          500: "#d01a53",
          600: "#a80e3d",
          700: "#82082d",
          800: "#5e031f",
          900: "#3c0113",
        },
        panel: {
          50: "#f8f7f2",
          100: "#edebe0",
          200: "#d6d2ba",
          300: "#b8b390",
          400: "#9a9468",
          500: "#7d784a",
          600: "#625e38",
          700: "#4a4629",
          800: "#33301c",
          900: "#1e1c0f",
        },
      },
      fontFamily: {
        display: ["'Bebas Neue'", "Impact", "sans-serif"],
        body: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        comic: ["'Bangers'", "cursive"],
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
