import type { CSSProperties } from "react";

type LogoVariant = "light" | "dark";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  showSubtitle?: boolean;
  subtitle?: string;
}

const logoPngDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANsAAACDCAYAAAAEXm7aAAA5y0lEQVR42u19eVhTV97/514IYc1GwYKJkgaoigaF2v5cC1XrRnGhE1NJq1WRVEFE9WNbrggijYFEaCIgNbSlVKGIUAgJB5fz/JE7/zjnXpjCzOU6YPN/na+E9zks4yYO98p7r3nO+55JxQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NTgX8Q/VeVnFkUG4AAAAASUVORK5CYII=";

const sizes: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 156, height: 70 },
  md: { width: 218, height: 92 },
  lg: { width: 300, height: 126 },
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
    overflow: "visible",
  };

  const imageStyle: CSSProperties = {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };

  return (
    <span style={wrap} aria-label={officialLabel} title="LEDGERA">
      <img src={logoPngDataUri} alt="LEDGERA" style={imageStyle} draggable={false} />
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
    background: "transparent",
  };

  const imageStyle: CSSProperties = {
    width: Math.round(size * 2.4),
    height: Math.round(size * 1.45),
    objectFit: "contain",
  };

  return (
    <span style={wrap} aria-label="LEDGERA">
      <img src={logoPngDataUri} alt="LEDGERA" style={imageStyle} draggable={false} />
    </span>
  );
}

export default Logo;
