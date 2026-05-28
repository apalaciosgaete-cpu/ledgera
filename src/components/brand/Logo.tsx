import type { CSSProperties } from "react";
import { colors, fonts } from "@/styles/tokens";

type LogoVariant = "light" | "dark";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  showSubtitle?: boolean;
}

const sizes = {
  sm: { name: 18, sub: 7.5, gap: 3, width: 128 },
  md: { name: 24, sub: 9, gap: 4, width: 172 },
  lg: { name: 30, sub: 10.5, gap: 5, width: 220 },
};

export function Logo({
  variant = "light",
  size = "md",
  showSubtitle = true,
}: LogoProps) {
  const s = sizes[size];
  const nameColor = variant === "light" ? "#F8FAFC" : "#071B28";
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
    letterSpacing: "0.14em",
    lineHeight: 0.95,
  };

  const subStyle: CSSProperties = {
    fontFamily: fonts.body,
    fontSize: `${s.sub}px`,
    fontWeight: 850,
    color: subtitleColor,
    letterSpacing: "0.42em",
    lineHeight: 1,
    paddingLeft: "0.42em",
  };

  return (
    <div style={wrap} aria-label="LEDGERA Finanzas OS">
      <span style={nameStyle}>LEDGERA</span>
      {showSubtitle ? <span style={subStyle}>FINANZAS OS</span> : null}
    </div>
  );
}

export function LogoIcon({ size = 44 }: { size?: number }) {
  const radius = Math.round(size * 0.22);
  const stroke = Math.max(2, Math.round(size * 0.035));

  const wrap: CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    background: "#071B28",
    border: `${stroke}px solid #15384F`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  return (
    <div style={wrap} aria-label="LEDGERA">
      <svg
        width={Math.round(size * 0.66)}
        height={Math.round(size * 0.66)}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M176 140 H240 V310 H352 V372 H176 Z" fill="#F8FAFC" />
        <rect x="252" y="310" width="100" height="18" rx="9" fill="#16A34A" />
      </svg>
    </div>
  );
}

export default Logo;
