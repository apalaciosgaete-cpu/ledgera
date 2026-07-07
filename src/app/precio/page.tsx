import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Precio | LEDGERA",
  description: "Planes de LEDGERA para personas, empresas y profesionales.",
};

const plans = [
  ["Persona", "Para ordenar movimientos personales, revisar activos y preparar respaldo inicial."],
  ["Empresa", "Para sociedades y operaciones con mayor volumen documental."],
  ["Profesional", "Para contadores, abogados tributarios y asesores que revisan casos."],
] as const;

export default function PrecioPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#080E1F", color: "#F2EBD8", padding: "36px 24px 64px" }}>
      <section style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 58 }}>
          <Link href="/" aria-label="Inicio LEDGERA" style={{ textDecoration: "none" }}>
            <Logo size="md" showSubtitle />
          </Link>
          <Link href="/" style={{ color: "#C9A84C", textDecoration: "none", fontWeight: 800 }}>← Inicio</Link>
        </header>
        <p style={{ color: "#C9A84C", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em" }}>Precio</p>
        <h1 style={{ fontSize: "clamp(2.4rem, 7vw, 5rem)", lineHeight: 1.02, margin: "24px 0", maxWidth: 900 }}>Planes simples para ordenar, revisar y respaldar.</h1>
        <p style={{ color: "#BFC8D9", fontSize: 20, lineHeight: 1.7, maxWidth: 820 }}>LEDGERA vende orden, trazabilidad, revisión de obligaciones y respaldo exportable. Los valores definitivos pueden ajustarse por etapa comercial.</p>
        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginTop: 48 }}>
          {plans.map(([title, text]) => (
            <article key={title} style={{ background: "#0B1430", border: "1px solid #24345F", borderRadius: 28, padding: 28 }}>
              <h2 style={{ margin: 0, fontSize: 32 }}>{title}</h2>
              <p style={{ color: "#BFC8D9", lineHeight: 1.7, marginTop: 18 }}>{text}</p>
              <Link href="/contacto" style={{ display: "inline-flex", marginTop: 28, color: "#C9A84C", fontWeight: 900, textDecoration: "none" }}>Consultar plan →</Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
