import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          DEFAULT: "#1A56DB",
          deep: "#1344B0",
          light: "#DBEAFE",
          mist: "#EFF6FF",
          ink: "#0F2D6B",
        },
        desk: {
          available: "#FFFFFF",
          "available-border": "#1A56DB",
          booked: "#EF4444",
          "booked-soft": "#FEE2E2",
          reserved: "#F59E0B",
          "reserved-soft": "#FEF3C7",
          "reserved-deep": "#D97706",
          mine: "#22C55E",
          "mine-soft": "#DCFCE7",
          hover: "#DBEAFE",
          disabled: "#E5E7EB",
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
    },
  },
  plugins: [],
};
export default config;
