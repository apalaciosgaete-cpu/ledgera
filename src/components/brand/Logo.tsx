import type { CSSProperties } from "react";

type LogoVariant = "light" | "dark";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  showSubtitle?: boolean;
  subtitle?: string;
}

const sizeMap: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 118, height: 24 },
  md: { width: 156, height: 32 },
  lg: { width: 188, height: 38 },
};

export function Logo({
  variant = "light",
  size = "md",
}: LogoProps) {
  const token = sizeMap[size];
  const src = variant === "dark" ? "/brand/ledgera-wordmark-navy.svg" : "/brand/ledgera-wordmark-white.svg";

  const wrap: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    width: token.width,
    height: token.height,
    textDecoration: "none",
    lineHeight: 1,
    flex: "0 0 auto",
  };

  const imageStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  };

  return (
    <span style={wrap} aria-label="LEDGERA">
      <img src={src} alt="LEDGERA" style={imageStyle} draggable={false} />
    </span>
  );
}

export default Logo;
