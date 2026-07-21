import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Producto financiero y tributario",
  description: "Cómo LEDGERA ordena activos, revisa obligaciones y genera respaldo tributario.",
};

const items = [
  ["Importa movimientos", "Carga operaciones desde exchanges, bancos o archivos CSV."],
  ["Ordena activos", "Relaciona activos, fechas, montos, moneda y documentación."],
  ["Revisa obligaciones", "Distingue qué debe declararse, respaldarse o revisarse."],
  ["Genera respaldo", "Descarga evidencia en PDF y Excel para revisión profesional."],
] as const;

export default function ProductoPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#080E1F", color: "#F2EBD8", padding: "36px 24px 64px" }}>
      <section style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 58 }}>
          <Link href="/" aria-label="Inicio LEDGERA" style={{ textDecoration: "none" }}><Logo size="md" showSubtitle /></Link>
          <Link href="/" style={{ color: "#C9A84C", textDecoration: "none", fontWeight: 800 }}>← Inicio</Link>
        </header>
        <p style={{ color: "#C9A84C", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em" }}>Producto</p>
        <h1 style={{ fontSize: "clamp(2.4rem, 7vw, 5rem)", lineHeight: 1.02, margin: "24px 0", maxWidth: 920 }}>Una capa de orden y respaldo para activos financieros complejos.</h1>
        <p style={{ color: "#BFC8D9", fontSize: 20, lineHeight: 1.7, maxWidth: 820 }}>LEDGERA transforma información dispersa en vistas claras, trazables y exportables para revisar antes de declarar o tomar decisiones patrimoniales.</p>
        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: 48 }}>
          {items.map(([title, text], index) => (
            <article key={title} style={{ background: "#0B1430", border: "1px solid #24345F", borderRadius: 28, padding: 28 }}>
              <p style={{ color: "#C9A84C", fontFamily: "monospace", fontWeight: 800 }}>0{index + 1}</p>
              <h2 style={{ margin: "20px 0 12px", fontSize: 28 }}>{title}</h2>
              <p style={{ color: "#BFC8D9", lineHeight: 1.7 }}>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
