import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Seguridad de la plataforma",
  description: "Principios de seguridad y alcance responsable de LEDGERA.",
};

export default function SeguridadPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#080E1F", color: "#F2EBD8", padding: "36px 24px 64px" }}>
      <section style={{ maxWidth: 960, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 58 }}>
          <Link href="/" aria-label="Inicio LEDGERA" style={{ textDecoration: "none" }}>
            <Logo size="md" showSubtitle />
          </Link>
          <Link href="/" style={{ color: "#C9A84C", textDecoration: "none", fontWeight: 800 }}>← Inicio</Link>
        </header>
        <p style={{ color: "#C9A84C", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em" }}>Seguridad</p>
        <h1 style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)", lineHeight: 1.05, margin: "24px 0" }}>Confianza operacional para información sensible.</h1>
        <p style={{ color: "#BFC8D9", fontSize: 20, lineHeight: 1.7 }}>LEDGERA entrega herramientas de orden, trazabilidad y respaldo. No reemplaza asesoría contable, legal ni tributaria profesional.</p>
      </section>
    </main>
  );
}
