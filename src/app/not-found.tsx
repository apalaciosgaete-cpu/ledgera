// src/app/not-found.tsx
import Link from "next/link";
import Logo from "@/components/brand/Logo";

const seoLinks = [
  { href: "/", label: "Inicio" },
  { href: "/impuestos-crypto-chile", label: "Impuestos crypto Chile" },
  { href: "/como-declarar-crypto-en-chile", label: "Declarar crypto en Chile" },
  { href: "/conciliacion-binance-banco", label: "Conciliación Binance banco" },
  { href: "/blog", label: "Blog" },
];

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #071520 0%, #0A1F2E 58%, #071520 100%)",
        color: "#e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <section
        style={{
          width: "min(100%, 760px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "24px",
          background: "rgba(255,255,255,0.045)",
          padding: "2rem",
          boxShadow: "0 30px 90px rgba(0,0,0,0.35)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "inline-flex", marginBottom: "2rem" }}>
          <Logo />
        </Link>

        <p
          style={{
            margin: "0 0 0.75rem",
            color: "#38bdf8",
            fontSize: "0.78rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Error 404
        </p>

        <h1
          style={{
            margin: "0 0 1rem",
            color: "#f8fafc",
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            lineHeight: 1.05,
            fontWeight: 900,
            letterSpacing: "-0.04em",
          }}
        >
          Esta página no existe o fue movida
        </h1>

        <p style={{ margin: "0 0 1.75rem", color: "#94a3b8", lineHeight: 1.7, maxWidth: "60ch" }}>
          Puedes volver al inicio o revisar las páginas públicas de LEDGERA sobre impuestos crypto,
          declaración tributaria y conciliación banco-exchange en Chile.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {seoLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                border: "1px solid rgba(148,163,184,0.26)",
                borderRadius: "999px",
                color: "#cbd5e1",
                padding: "0.72rem 1rem",
                textDecoration: "none",
                fontSize: "0.9rem",
                background: "rgba(15,23,42,0.5)",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
