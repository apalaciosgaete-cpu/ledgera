"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  sm: { width: 168, height: 48 },
  md: { width: 240, height: 68 },
  lg: { width: 360, height: 102 },
};

const officialAlt = "LEDGERA — Inteligencia financiera para crecer";
const officialLogoSrc = "/brand/ledgera-3d-navbar.webp?v=20260707-official";

export function Logo(props: LogoProps) {
  const pathname = usePathname();
  const { size = "md" } = props;
  const s = sizes[size];
  const logo = (
    <Image
      src={officialLogoSrc}
      alt={officialAlt}
      width={s.width}
      height={s.height}
      unoptimized
      priority
      style={{
        display: "block",
        width: s.width,
        height: "auto",
        maxWidth: "100%",
        objectFit: "contain",
      }}
    />
  );

  if (pathname === "/login" || pathname === "/register") {
    return (
      <Link
        href="/"
        aria-label="Ir a la página de inicio de LEDGERA"
        title="Volver al inicio"
        style={{ display: "inline-flex", maxWidth: "100%", textDecoration: "none" }}
      >
        {logo}
      </Link>
    );
  }

  return logo;
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
