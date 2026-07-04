import type { CSSProperties } from "react";

const logoDataUri = "data:image/webp;base64,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";

type LogoVariant = "light" | "dark";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  showSubtitle?: boolean;
  subtitle?: string;
}

const sizes: Record<LogoSize, { width: number; maxHeight: number }> = {
  sm: { width: 170, maxHeight: 54 },
  md: { width: 260, maxHeight: 82 },
  lg: { width: 420, maxHeight: 132 },
};

const officialLabel = "LEDGERA — Inteligencia financiera para crecer";

export function Logo({ size = "md" }: LogoProps) {
  const s = sizes[size];

  const wrap: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: s.width,
    maxWidth: "100%",
    minWidth: size === "sm" ? 140 : 180,
    height: s.maxHeight,
    lineHeight: 0,
    userSelect: "none",
  };

  const imageStyle: CSSProperties = {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };

  return (
    <span style={wrap} aria-label={officialLabel} title="LEDGERA">
      <img src={logoDataUri} alt="LEDGERA" style={imageStyle} draggable={false} />
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
    width: Math.round(size * 2.65),
    height: Math.round(size * 1.36),
    objectFit: "cover",
    objectPosition: "50% 10%",
    transform: `translateY(${Math.round(size * 0.12)}px)`,
  };

  return (
    <span style={wrap} aria-label="LEDGERA">
      <img src={logoDataUri} alt="LEDGERA" style={imageStyle} draggable={false} />
    </span>
  );
}

export default Logo;
