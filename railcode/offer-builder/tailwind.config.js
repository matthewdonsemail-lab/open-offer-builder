/** @type {import('tailwindcss').Config} */
export default {
  content: ['./frontend/index.html', './frontend/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        surface: {
          primary: "var(--ods-bg-primary)",
          secondary: "var(--ods-bg-secondary)",
          tertiary: "var(--ods-bg-tertiary)",
        },
        border: {
          subtle: "var(--ods-border)",
          strong: "var(--ods-border-strong)",
        },
        text: {
          primary: "var(--ods-text-primary)",
          secondary: "var(--ods-text-secondary)",
          tertiary: "var(--ods-text-tertiary)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
