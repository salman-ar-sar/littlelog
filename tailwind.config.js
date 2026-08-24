/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Editorial palette — "reads like a quiet journal".
        // Warm oat base, warm near-black ink, one accent hue per tracker.
        // (Token names kept stable from v1 so existing components recolor 1:1.)
        paper: "#F6F1E7", // oat app background
        card: "#FDFBF6",
        ink: "#262019",
        "ink-soft": "#8A8073",
        line: "#E7E0D2",
        // Tracker accents — hue carries across icon, chart line and log row.
        blush: { DEFAULT: "#6E4E75", soft: "#EFE7F0" }, // Medicine (plum)
        peach: { DEFAULT: "#C05B33", soft: "#F5E4DB" }, // Feeding (terracotta)
        mint: { DEFAULT: "#7D8F69", soft: "#E9EDDF" }, // Nappy (sage)
        sky: { DEFAULT: "#C9A13B", soft: "#F3EBD4" }, // Bath (mustard)
        butter: { DEFAULT: "#C4888C", soft: "#F4E5E6" }, // Weight (rose)
        lavender: { DEFAULT: "#5C7FA3", soft: "#E2E9F0" }, // Sleep (steel blue)
      },
      fontFamily: {
        sans: ["Manrope_400Regular"],
        "sans-medium": ["Manrope_500Medium"],
        "sans-semibold": ["Manrope_600SemiBold"],
        "sans-bold": ["Manrope_700Bold"],
        display: ["Fraunces_500Medium"],
        "display-semibold": ["Fraunces_600SemiBold"],
        "display-bold": ["Fraunces_700Bold"],
      },
    },
  },
  plugins: [],
};
