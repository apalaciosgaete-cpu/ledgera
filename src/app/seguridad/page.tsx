import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seguridad | LEDGERA",
  description: "Principios de seguridad y alcance responsable de LEDGERA.",
};

export default function SeguridadPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#080E1F", color: "#F2EBD8", padding: "64px 24px" }}>
      <section style={{ maxWidth: 960, margin: "0 auto" }}>
        <p style={{ color: "#C9A84C", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em" }}>Seguridad</p>
        <h1 style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)", lineHeight: 1.05, margin: "24px 0" }}>Confianza operacional para información sensible.</h1>
        <p style={{ color: "#BFC8D9", fontSize: 20, lineHeight: 1.7 }}>LEDGERA entrega herramientas de orden, trazabilidad y respaldo. No reemplaza asesoría contable, legal ni tributaria profesional.</p>
      </section>
    </main>
  );
}
