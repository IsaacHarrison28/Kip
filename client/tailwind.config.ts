import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        brand: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        sans: [
          '"Plus Jakarta Sans"',
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        navy: {
          DEFAULT: "#0a2540",
          900: "#061a30",
          800: "#0a2540",
          700: "#123a5c",
        },
        electric: {
          DEFAULT: "#0b6bf2",
          600: "#0b6bf2",
          700: "#0954c4",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#E11D48",
      },
      borderRadius: {
        kip: "12px",
        "kip-sm": "8px",
        "kip-lg": "16px",
      },
      boxShadow: {
        "kip-card":
          "0 1px 2px rgba(10,37,64,0.04), 0 4px 12px rgba(10,37,64,0.06)",
        "kip-hover":
          "0 2px 4px rgba(10,37,64,0.06), 0 8px 24px rgba(10,37,64,0.10)",
        "kip-focus": "0 0 0 3px rgba(11,107,242,0.25)",
      },
      transitionTimingFunction: {
        kip: "cubic-bezier(0.2, 0, 0, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
