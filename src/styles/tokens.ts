// src/styles/tokens.ts
export const colors = {
  primary:       "#0F2A3D",
  primaryHover:  "#13364F",
  accent:        "#16A34A",
  accentHover:   "#15803D",
  accentMuted:   "rgba(22, 163, 74, 0.15)",
  warning:       "#F59E0B",
  warningHover:  "#D97706",
  warningMuted:  "rgba(245, 158, 11, 0.15)",
  danger:        "#EF4444",
  dangerHover:   "#DC2626",
  dangerMuted:   "rgba(239, 68, 68, 0.15)",
  bgApp:         "#F6F8FA",
  surface:       "#FFFFFF",
  surfaceAlt:    "#F8FAFC",
  surfaceDark:   "#13364F",
  textPrimary:   "#0F172A",
  textSecondary: "#475569",
  textMuted:     "#94A3B8",
  textLight:     "#F6F8FA",
  border:        "#E2E8F0",
  borderDark:    "#1e4a6b",
} as const;

export const fonts = {
  display: "var(--font-display, 'Manrope', system-ui, sans-serif)",
  body:    "var(--font-body, 'Inter', system-ui, sans-serif)",
} as const;

export const fontSize = {
  xs:    "11px",
  sm:    "12px",
  base:  "13px",
  md:    "14px",
  lg:    "15px",
  xl:    "17px",
  "2xl": "20px",
  "3xl": "24px",
  "4xl": "28px",
} as const;

export const fontWeight = {
  normal:   400,
  medium:   500,
  semibold: 600,
  bold:     700,
} as const;

export const lineHeight = {
  tight:   1.2,
  snug:    1.4,
  normal:  1.6,
  relaxed: 1.75,
} as const;

export const radius = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
} as const;

export const shadows = {
  sm: "0 1px 3px rgba(0, 0, 0, 0.06)",
  md: "0 4px 16px rgba(0, 0, 0, 0.08)",
  lg: "0 8px 32px rgba(0, 0, 0, 0.12)",
} as const;

export const spacing = {
  "1":  "4px",
  "2":  "8px",
  "3":  "12px",
  "4":  "16px",
  "5":  "20px",
  "6":  "24px",
  "8":  "32px",
  "10": "40px",
  "12": "48px",
} as const;