/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#007AFF", // iOS blue
          light: "#5856D6", // iOS purple
        },
        secondary: {
          DEFAULT: "#34C759", // iOS green
        },
        neutral: {
          50: "#F2F2F7", // iOS light background
          100: "#E5E5EA", // iOS separator
          200: "#D1D1D6",
          300: "#C7C7CC",
          400: "#AEAEB2",
          500: "#8E8E93", // iOS secondary label
          600: "#636366",
          700: "#48484A",
          800: "#3A3A3C",
          900: "#2C2C2E",
        },
        danger: "#FF3B30", // iOS red
        warning: "#FF9500", // iOS orange
        info: "#5856D6", // iOS purple
        success: "#34C759", // iOS green
      },
      fontFamily: {
        sans: ["-apple-system", "system-ui", "sans-serif"],
        mono: ["SpaceMono", "monospace"],
      },
      borderRadius: {
        ios: "10px",
        "ios-lg": "20px",
        "ios-full": "9999px",
      },
      spacing: {
        "ios-2": "8px",
        "ios-3": "12px",
        "ios-4": "16px",
        "ios-5": "20px",
        "ios-6": "24px",
      },
      boxShadow: {
        ios: "0 2px 8px rgba(0, 0, 0, 0.12)",
        "ios-strong": "0 4px 12px rgba(0, 0, 0, 0.15)",
      },
    },
  },
  plugins: [],
};
