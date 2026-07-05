import type { CSSProperties } from "react";
import Image from "next/image";
import { fonts } from "@/styles/tokens";

type LogoVariant = "light" | "dark";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  showSubtitle?: boolean;
  subtitle?: string;
}

const sizes = {
  sm: { width: 168, height: 86 },
  md: { width: 240, height: 123 },
  lg: { width: 300, height: 153 },
};

const officialAlt = "LEDGERA — Inteligencia financiera para crecer";

export function Logo(props: LogoProps) {
  const { size = "md" } = props;
  const s = sizes[size];

  return (
    <Image
      src="/brand/ledgera-logo-public.svg"
      alt={officialAlt}
      width={s.width}
      height={s.height}
      unoptimized
      priority
      style={{
        display: "block",
        width: s.width,
        height: "auto",
      }}
    />
  );
}

export function LogoIcon({ size = 44 }: { size?: number }) {
  const wrap: CSSProperties = {
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.22),
    background: "#071B28",
    border: `${Math.max(2, Math.round(size * 0.035))}px solid rgba(255,255,255,0.12)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#F8FAFC",
    fontFamily: fonts.display,
    fontWeight: 900,
  };

  return <div style={wrap} aria-label="LEDGERA">L</div>;
}

export default Logo;
