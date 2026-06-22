import type { CSSProperties } from "react";
import { colors, fonts } from "@/styles/tokens";

type LogoVariant = "light" | "dark";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  showSubtitle?: boolean;
  subtitle?: string;
}

const sizes = {
  sm: { name: 20, sub: 8.5, gap: 4, width: 168 },
  md: { name: 34, sub: 11.5, gap: 6, width: 300 },
  lg: { name: 42, sub: 13, gap: 7, width: 380 },
};

const officialSubtitle = "Sistema Operativo Financiero y Tributario";

export function Logo({ variant = "light", size = "md", showSubtitle = true }: LogoProps) {
  const s = sizes[size];
  const nameColor = variant === "light" ? colors.textLight : "#071B28";
  const subtitleColor = variant === "light" ? "#4ADE80" : colors.accent;

  const wrap: CSSProperties = {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: `${s.gap}px`,
    minWidth: `${s.width}px`,
    textDecoration: "none",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  const nameStyle: CSSProperties = {
    fontFamily: fonts.display,
    fontSize: `${s.name}px`,
    fontWeight: 900,
    color: nameColor,
    letterSpacing: "0.16em",
    lineHeight: 0.95,
  };

  const subStyle: CSSProperties = {
    fontFamily: fonts.body,
    fontSize: `${s.sub}px`,
    fontWeight: 800,
    color: subtitleColor,
    letterSpacing: "0.34em",
    lineHeight: 1.12,
    opacity: 0.86,
    paddingLeft: "0.34em",
  };

  return (
    <div style={wrap} aria-label={officialSubtitle}>
      <span style={nameStyle}>LEDGERA</span>
      {showSubtitle ? <span style={subStyle}>{officialSubtitle}</span> : null}
    </div>
  );
}

export function LogoIcon({ size = 44 }: { size?: number }) {
  const wrap: CSSProperties = {
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.22),
    background: "#071B28",
    border: `${Math.max(2, Math.round(size * 0.035))}px solid ${colors.borderDark}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.textLight,
    fontFamily: fonts.display,
    fontWeight: 900,
  };

  return <div style={wrap} aria-label="LEDGERA">L</div>;
}

export default Logo;
