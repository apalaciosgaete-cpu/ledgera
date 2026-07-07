import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Opinión | LEDGERA",
  description: "Ayúdanos a mejorar LEDGERA con feedback orgánico sobre claridad, utilidad y funcionamiento.",
};

const questions = [
  "¿Qué esperabas resolver al entrar a LEDGERA?",
  "¿Qué parte te pareció más útil?",
  "¿Qué información te gustaría ver más clara o mejor explicada?",
  "¿Qué función te gustaría que LEDGERA incorporara próximamente?",
  "¿Quieres que te contactemos?",
] as const;

export default function OpinionPage() {
  const body = encodeURIComponent(questions.map((q) => `${q}\n`).join("\n"));
  return (
    <main style={{ minHeight: "100vh", background: "#080E1F", color: "#F2EBD8", padding: "36px 24px 64px" }}>
      <section style={{ maxWidth: 960, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 58 }}>
          <Link href="/" aria-label="Inicio LEDGERA" style={{ textDecoration: "none" }}>
            <Logo size="md" showSubtitle />
          </Link>
          <Link href="/" style={{ color: "#C9A84C", textDecoration: "none", fontWeight: 800 }}>← Inicio</Link>
        </header>
        <p style={{ color: "#C9A84C", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em" }}>Ayúdanos a mejorar</p>
        <h1 style={{ fontSize: "clamp(2.4rem, 7vw, 5rem)", lineHeight: 1.02, margin: "24px 0" }}>Tu opinión ayuda a construir una plataforma más clara y útil.</h1>
        <p style={{ color: "#BFC8D9", fontSize: 20, lineHeight: 1.7 }}>No buscamos respuestas perfectas. Buscamos señales reales sobre claridad, utilidad y funcionamiento.</p>
        <div style={{ display: "grid", gap: 14, marginTop: 36 }}>
          {questions.map((question) => (
            <div key={question} style={{ background: "#0B1430", border: "1px solid #24345F", borderRadius: 20, padding: 18, color: "#BFC8D9", fontWeight: 700 }}>
              <span style={{ color: "#C9A84C" }}>● </span>{question}
            </div>
          ))}
        </div>
        <a href={`mailto:admin@ledgera.cl?subject=${encodeURIComponent("Opinión para mejorar LEDGERA")}&body=${body}`} style={{ display: "inline-flex", marginTop: 36, background: "#C9A84C", color: "#080E1F", padding: "16px 24px", borderRadius: 18, fontWeight: 900, textDecoration: "none" }}>Enviar opinión</a>
      </section>
    </main>
  );
}
