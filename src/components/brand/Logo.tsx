import type { CSSProperties } from "react";

type LogoVariant = "light" | "dark";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  showSubtitle?: boolean;
  subtitle?: string;
}

const sizes: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 132, height: 52 },
  md: { width: 180, height: 58 },
  lg: { width: 320, height: 112 },
};

const officialLabel = "LEDGERA — Inteligencia financiera para crecer";

export function Logo({ size = "md" }: LogoProps) {
  const s = sizes[size];

  const wrap: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: s.width,
    height: s.height,
    maxWidth: "100%",
    lineHeight: 0,
    userSelect: "none",
    overflow: "hidden",
  };

  const imageStyle: CSSProperties = {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };

  return (
    <span style={wrap} aria-label={officialLabel} title="LEDGERA">
      <img src="/brand/ledgera-logo.svg" alt="LEDGERA" style={imageStyle} draggable={false} />
    </span>
  );
}

export function LogoIcon({ size = 44 }: { size?: number }) {
  const wrap: CSSProperties = {
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.22),
    overflow: "hidden",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0A0F1A",
  };

  const imageStyle: CSSProperties = {
    width: Math.round(size * 2.6),
    height: Math.round(size * 1.4),
    objectFit: "cover",
    objectPosition: "50% 8%",
  };

  return (
    <span style={wrap} aria-label="LEDGERA">
      <img src="/brand/ledgera-logo.svg" alt="LEDGERA" style={imageStyle} draggable={false} />
    </span>
  );
}

export default Logo;
