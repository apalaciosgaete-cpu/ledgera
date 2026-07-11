import Link from "next/link";

import { fonts } from "@/styles/tokens";

const SOURCE_OPTIONS = [
  { href: "/origen-fondos/bancos", icon: "🏦", label: "Bancos" },
  { href: "/origen-fondos/exchanges", icon: "📊", label: "Exchanges" },
  { href: "/origen-fondos/wallets", icon: "💳", label: "Wallets" },
  { href: "/origen-fondos/documentacion", icon: "📄", label: "Documentación" },
] as const;

export default function OrigenFondosPage() {
  return (
    <main
      style={{
        minHeight: "calc(100vh - 160px)",
        display: "grid",
        gap: 14,
        alignContent: "start",
      }}
    >
      <section>
        <h1
          style={{
            color: "var(--text)",
            fontSize: "clamp(1.65rem,3vw,2.05rem)",
            fontWeight: 900,
            margin: "0 0 4px",
            letterSpacing: "-0.04em",
            fontFamily: fonts.display,
          }}
        >
          Origen de Fondos
        </h1>
        <p
          style={{
            color: "var(--text)",
            fontSize: 14,
            lineHeight: 1.35,
            margin: 0,
            fontFamily: fonts.body,
          }}
        >
          Selecciona cómo quieres incorporar la información.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
        }}
      >
        {SOURCE_OPTIONS.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            style={{
              minHeight: 110,
              borderRadius: 18,
              border: "1px solid var(--border)",
              background: "var(--bg-elev)",
              color: "var(--text)",
              textDecoration: "none",
              display: "grid",
              gap: 6,
              padding: "12px 10px",
              justifyItems: "center",
              alignItems: "center",
              alignContent: "center",
              boxShadow: "0 8px 16px rgba(15,42,61,0.04)",
              fontFamily: fonts.body,
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 36, lineHeight: 1 }}>{option.icon}</span>
            <strong style={{ fontSize: 14, fontWeight: 900 }}>{option.label}</strong>
          </Link>
        ))}
      </section>
    </main>
  );
}
