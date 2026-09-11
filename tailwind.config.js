/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cockpit: {
          DEFAULT: "#0e1116",
          panel: "#161b22",
          border: "#2a3038",
        },
        accent: "#5a8a9a",
        route: "#8a6a3a",
        vfr: "#3d7a5c",
        mvfr: "#3a6a9a",
        ifr: "#b04545",
      },
      fontFamily: {
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
        sans: ["var(--font-ibm-plex)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-barlow)", "var(--font-ibm-plex)", "ui-sans-serif", "sans-serif"],
      },
    },
  },
  plugins: [],
};
