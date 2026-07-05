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
  sm: { width: 164, height: 41 },
  md: { width: 214, height: 54 },
  lg: { width: 272, height: 68 },
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
    <span style={wrap} aria-label="LEDGERA Finanzas OS">
      <img src={src} alt="LEDGERA Finanzas OS" style={imageStyle} draggable={false} />
    </span>
  );
}

export default Logo;
