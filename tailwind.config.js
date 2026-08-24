/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Warm, parent-friendly pastel palette. Single source of truth —
        // never hardcode hex values in components.
        paper: "#FBF8F4", // app background (warm off-white)
        card: "#FFFFFF",
        ink: "#3D3A4A", // primary text
        "ink-soft": "#8A8699", // secondary text
        line: "#EFEAE2", // hairlines / separators
        blush: { DEFAULT: "#F2A7B3", soft: "#FDEEF0" },
        peach: { DEFAULT: "#F0A47E", soft: "#FDEFE5" },
        mint: { DEFAULT: "#79C4A4", soft: "#E6F4ED" },
        sky: { DEFAULT: "#82B4DC", soft: "#E9F2FA" },
        butter: { DEFAULT: "#EFC368", soft: "#FBF2DF" },
        lavender: { DEFAULT: "#A99BD8", soft: "#EEEBF8" },
      },
      fontFamily: {
        rounded: ["SF Pro Rounded", "System"],
      },
    },
  },
  plugins: [],
};
