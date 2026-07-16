"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
const officialIconSrc = "/ledgera-isotipo.svg?v=20260715-official";

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
  const iconHeight = Math.round((size * 120) / 140);

  return (
    <span
      aria-label="LEDGERA"
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
      }}
    >
      <Image
        src={officialIconSrc}
        alt=""
        width={size}
        height={iconHeight}
        unoptimized
        style={{
          display: "block",
          width: size,
          height: "auto",
          maxHeight: size,
          objectFit: "contain",
        }}
      />
    </span>
  );
}

export default Logo;
