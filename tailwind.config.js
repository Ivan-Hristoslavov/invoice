/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      dropShadow: {
        glow: [
          "0 0px 20px rgba(255,255, 255, 0.35)",
          "0 0px 65px rgba(255, 255,255, 0.2)"
        ]
      },
      backgroundImage: {
        'footer-texture': "url('/login/forest.jpg')",
      },
      colors: {
        primary: "#313638",
        secondary: "#F7F7F7",
        accent: "#EAEAEA",
        gray: {
          100: "#F7FAFC",
          200: "#EDF2F7",
          300: "#E2E8F0",
          400: "#CBD5E0",
          500: "#A0AEC0",
          600: "#718096",
          700: "#4A5568",
          800: "#2D3748",
          900: "#1A202C",
        },
        blue: {
          100: "#EBF8FF",
          200: "#BEE3F8",
          300: "#90CDF4",
          400: "#63B3ED",
          500: "#4299E1",
          600: "#3182CE",
          700: "#2B6CB0",
          800: "#2C5289",
          900: "#2A4365",
        },
        green: {
          100: "#F0FFF4",
          200: "#C6F6D5",
          300: "#9AE6B4",
          400: "#68D391",
          500: "#48BB78",
          600: "#38A169",
          700: "#2F855A",
          800: "#276749",
          900: "#22543D",
        },
        red: {
          100: "#FFF5F5",
          200: "#FED7D7",
          300: "#FEB2B2",
          400: "#FC8181",
          500: "#F56565",
          600: "#E53E3E",
          700: "#C53030",
          800: "#9B2C2C",
          900: "#742A2A",
        },
        yellow: {
          100: "#FFFFF0",
          200: "#FEFCBF",
          300: "#FAF089",
          400: "#F6E05E",
          500: "#ECC94B",
          600: "#D69E2E",
          700: "#B7791F",
          800: "#975A16",
          900: "#7D4511",
        },
      },
      fontSize: {
        xs: "0.75rem", // 12px
        sm: "0.875rem", // 14px
        base: "1rem", // 16px
        lg: "1.125rem", // 18px
        xl: "1.25rem", // 20px
        "2xl": "1.5rem", // 24px
        "3xl": "1.875rem", // 30px
        "4xl": "2.25rem", // 36px
        "5xl": "3rem", // 48px
        "6xl": "4rem", // 64px
      },
    },
  },
  plugins: [],
};