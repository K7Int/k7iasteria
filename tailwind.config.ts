import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        beige: {
          50: "#faf6ec",
          100: "#f4ecd8",
          200: "#ece0c0",
          300: "#dccca0",
          400: "#c9b382",
          500: "#b39a64",
          600: "#8f7a4a",
        },
        console: {
          bg: "#cfc6b1",
          panel: "#d8d0bd",
          panelHi: "#e3dcc8",
          inset: "#b8af9a",
          insetHi: "#a89f8a",
          line: "#5a5346",
          ink: "#1d1a14",
          accent: "#7b2d2d",
          accentHi: "#9e3a3a",
          ok: "#3f6b3a",
          warn: "#b07b2d",
        },
      },
      fontFamily: {
        bit: ['"ChicagoFLF"', '"Chicago"', '"Geebie Slab"', "monospace"],
        mono: ['"Px437 PS2SlimVC9)"', "monospace"],
        ui: ['"GenevaFLF"', '"Geneva"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        bevelOut: "inset -1px -1px 0 #7a726440, inset 1px 1px 0 #ffffff88",
        bevelIn: "inset 1px 1px 0 #7a726440, inset -1px -1px 0 #ffffff88",
        win: "2px 2px 0 #00000055, inset -1px -1px 0 #8a826f, inset 1px 1px 0 #f8f4ea",
      },
    },
  },
  plugins: [],
};

export default config;
