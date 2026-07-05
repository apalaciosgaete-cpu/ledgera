import type { CSSProperties } from "react";

type LogoVariant = "light" | "dark";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  showSubtitle?: boolean;
  subtitle?: string;
}

const sizeMap: Record<LogoSize, { mark: number; word: number; subtitle: number; gap: number }> = {
  sm: { mark: 36, word: 24, subtitle: 10, gap: 10 },
  md: { mark: 44, word: 30, subtitle: 11, gap: 12 },
  lg: { mark: 52, word: 36, subtitle: 12, gap: 14 },
};

export function Logo({
  variant = "light",
  size = "md",
  showSubtitle = false,
  subtitle = "Finanzas · Impuestos · Respaldo",
}: LogoProps) {
  const token = sizeMap[size];
  const textColor = variant === "dark" ? "#080E1F" : "#F2EBD8";
  const softColor = variant === "dark" ? "#24345F" : "#BFC8D9";
  const gold = "#C9A84C";

  const wrap: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: token.gap,
    textDecoration: "none",
    lineHeight: 1,
  };

  const mark: CSSProperties = {
    width: token.mark,
    height: token.mark,
    borderRadius: Math.round(token.mark * 0.28),
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: gold,
    color: "#080E1F",
    fontFamily: "var(--font-display, system-ui, sans-serif)",
    fontSize: Math.round(token.mark * 0.58),
    fontWeight: 900,
    letterSpacing: "-0.08em",
    boxShadow: "0 14px 44px rgba(201, 168, 76, 0.28)",
    flex: "0 0 auto",
  };

  return (
    <span style={wrap} aria-label="LEDGERA">
      <span style={mark}>L</span>
      <span style={{ display: "grid", gap: 4 }}>
        <span
          style={{
            color: textColor,
            fontFamily: "var(--font-display, system-ui, sans-serif)",
            fontSize: token.word,
            fontWeight: 900,
            letterSpacing: "-0.055em",
            lineHeight: 0.92,
          }}
        >
          LEDGERA
        </span>
        {showSubtitle ? (
          <span
            style={{
              color: softColor,
              fontFamily: "var(--font-body, system-ui, sans-serif)",
              fontSize: token.subtitle,
              fontWeight: 800,
              letterSpacing: "0.08em",
              lineHeight: 1,
              textTransform: "uppercase",
            }}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export default Logo;
