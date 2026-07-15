import Link from "next/link";
import type { ReactNode } from "react";

import { LogoIcon } from "@/components/brand/Logo";
import { fonts } from "@/styles/tokens";

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Link
        href="/"
        aria-label="Volver a la página de inicio de LEDGERA"
        title="Volver al inicio"
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 20,
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          minHeight: 42,
          padding: "6px 12px 6px 7px",
          border: "1px solid var(--border)",
          borderRadius: 12,
          background: "rgba(8,13,28,0.84)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.24)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          color: "var(--text)",
          fontFamily: fonts.body,
          fontSize: 13,
          fontWeight: 800,
          textDecoration: "none",
        }}
      >
        <LogoIcon size={30} />
        <span>Inicio</span>
      </Link>
      {children}
    </>
  );
}
