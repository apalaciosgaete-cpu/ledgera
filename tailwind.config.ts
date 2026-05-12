import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        ledgera: {
          primary: "#0F2A3D",
          primaryHover: "#13364F",
          success: "#16A34A",
          warning: "#F59E0B",
          danger: "#DC2626",
          background: "#F6F8FA",
          surface: "#FFFFFF",
          border: "#E2E8F0",
          text: {
            primary: "#0F172A",
            secondary: "#475569",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;