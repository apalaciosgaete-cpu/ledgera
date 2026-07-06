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
  sm: { width: 180, height: 42 },
  md: { width: 220, height: 52 },
  lg: { width: 260, height: 62 },
};

export function Logo({
  size = "md",
}: LogoProps) {
  const token = sizeMap[size];
  const src = "/brand/ledgera-3d-navbar.webp?v=20260706-direct-raster";

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
