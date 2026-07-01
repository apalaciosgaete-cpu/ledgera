"use client";

import Link from "next/link";
import { fonts } from "@/styles/tokens";
import { useAuth } from "@/modules/identity/client/authContext";

type QuickLink = {
  href: string;
  label: string;
  description: string;
};

const QUICK_LINKS: QuickLink[] = [
  { href: "/origen-fondos", label: "Origen de Fondos", description: "Conecta bancos, exchanges, wallets o carga documentación." },
  { href: "/cryptoactivos", label: "Activos", description: "Revisa y consolida tus movimientos y activos detectados." },
  { href: "/obligaciones-tributarias", label: "Obligaciones Tributarias", description: "Consulta tus obligaciones y eventos tributarios." },
  { href: "/declaraciones", label: "Declaraciones", description: "Prepara y revisa tus declaraciones." },
];

export function InvestorDashboard() {
  const { user } = useAuth();
  const name = user?.email ?? "";

  return (
    <div
      style={{
        minHeight: "calc(100vh - 96px)",
        background: "#071B28",
        color: "#E2E8F0",
        fontFamily: fonts.body,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: "40px 24px",
        boxSizing: "border-box",
      }}
    >
      <section style={{ textAlign: "center", maxWidth: 720, display: "grid", gap: 10 }}>
        <p style={{ margin: 0, color: "#4ADE80", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          LEDGERA
        </p>
        <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 900, color: "#F8FAFC", letterSpacing: "-0.02em" }}>
          Bienvenido a tu panel
        </h1>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#94A3B8" }}>
          {name ? `Sesión de ${name}. ` : ""}Gestiona tu situación financiera y tributaria con criptoactivos desde un solo lugar.
        </p>
      </section>

      <section
        style={{
          width: "100%",
          maxWidth: 860,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        {QUICK_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "grid",
              gap: 6,
              alignContent: "start",
              textDecoration: "none",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 18,
              padding: "18px 18px",
              color: "#E2E8F0",
              minHeight: 108,
            }}
          >
            <strong style={{ fontSize: 15.5, fontWeight: 900, color: "#F8FAFC" }}>{item.label}</strong>
            <span style={{ fontSize: 13, lineHeight: 1.45, color: "#94A3B8" }}>{item.description}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
