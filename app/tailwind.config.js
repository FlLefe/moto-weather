/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0F172A",
        card: "#1E293B",
        text: "#F1F5F9",
        accent: "#3B82F6",
        muted: "#94A3B8",
        "risk-green": "#22C55E",
        "risk-yellow": "#EAB308",
        "risk-orange": "#F97316",
        "risk-red": "#EF4444",
      },
    },
  },
  plugins: [],
};
