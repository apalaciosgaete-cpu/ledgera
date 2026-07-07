// src/styles/tokens.ts
// LEDGERA design tokens are sourced from CSS variables in src/app/globals.css.
// Keep this TypeScript facade for legacy inline-style consumers, but do not
// define independent hex palettes here.

export const colors = {
  primary: "var(--accent)",
  primaryHover: "var(--accent)",
  primaryCard: "var(--bg-elev)",
  primaryBorder: "var(--border-strong)",
  accent: "var(--accent)",
  accentHover: "var(--accent)",
  accentMuted: "var(--accent-soft)",
  warning: "var(--warn)",
  warningHover: "var(--warn)",
  warningMuted: "rgba(232, 184, 75, 0.14)",
  danger: "var(--loss)",
  dangerHover: "var(--loss)",
  dangerMuted: "rgba(196, 99, 74, 0.14)",
  bg: "var(--bg)",
  bgApp: "var(--bg)",
  bgElev: "var(--bg-elev)",
  bgSunken: "var(--bg-sunken)",
  surface: "var(--bg-elev)",
  surfaceAlt: "var(--bg-sunken)",
  surfaceDark: "var(--bg-sunken)",
  textPrimary: "var(--text)",
  textSecondary: "var(--text-soft)",
  textMuted: "var(--text-faint)",
  textLight: "var(--text)",
  border: "var(--border)",
  borderDark: "var(--border-strong)",
  gain: "var(--gain)",
  loss: "var(--loss)",
  warn: "var(--warn)",
} as const;

export const semanticTones = {
  neutral: {
    bg: "var(--bg-elev)",
    fg: "var(--text-soft)",
    border: "var(--border)",
  },
  selected: {
    bg: "var(--accent-soft)",
    fg: "var(--accent)",
    border: "var(--accent)",
  },
  success: {
    bg: "var(--accent-soft)",
    fg: "var(--gain)",
    border: "var(--accent)",
  },
  warning: {
    bg: "rgba(232, 184, 75, 0.14)",
    fg: "var(--warn)",
    border: "rgba(232, 184, 75, 0.32)",
  },
  danger: {
    bg: "rgba(196, 99, 74, 0.14)",
    fg: "var(--loss)",
    border: "rgba(196, 99, 74, 0.32)",
  },
  info: {
    bg: "var(--accent-soft)",
    fg: "var(--accent)",
    border: "var(--accent)",
  },
} as const;

export const fonts = {
  display: "var(--font-display, 'Space Grotesk', system-ui, sans-serif)",
  body:    "var(--font-body, 'Inter', system-ui, sans-serif)",
  mono:    "var(--font-mono, 'IBM Plex Mono', ui-monospace, monospace)",
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
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
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
