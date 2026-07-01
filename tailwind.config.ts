import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── LEDGERA design system · Propuesta B "Cierre" (dark base) ──
        bg: "var(--bg)",
        "bg-elev": "var(--bg-elev)",
        "bg-sunken": "var(--bg-sunken)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        text: "var(--text)",
        "text-soft": "var(--text-soft)",
        "text-faint": "var(--text-faint)",
        accent: "var(--accent)",
        "accent-contrast": "var(--accent-contrast)",
        "accent-soft": "var(--accent-soft)",
        gain: "var(--gain)",
        loss: "var(--loss)",
        warn: "var(--warn)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        DEFAULT: "10px",
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
