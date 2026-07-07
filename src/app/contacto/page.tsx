import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Contacto | LEDGERA",
  description: "Contacta a LEDGERA para soporte, ventas o alianzas.",
};

export default function ContactoPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#080E1F", color: "#F2EBD8", padding: "36px 24px 64px" }}>
      <section style={{ maxWidth: 960, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 58 }}>
          <Link href="/" aria-label="Inicio LEDGERA" style={{ textDecoration: "none" }}>
            <Logo size="md" showSubtitle />
          </Link>
          <Link href="/" style={{ color: "#C9A84C", textDecoration: "none", fontWeight: 800 }}>← Inicio</Link>
        </header>
        <p style={{ color: "#C9A84C", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em" }}>Contacto</p>
        <h1 style={{ fontSize: "clamp(2.4rem, 7vw, 5rem)", lineHeight: 1.02, margin: "24px 0" }}>Hablemos sobre cómo LEDGERA puede ayudarte.</h1>
        <p style={{ color: "#BFC8D9", fontSize: 20, lineHeight: 1.7 }}>Para soporte, ventas, alianzas o consultas generales, escríbenos directamente.</p>
        <a href="mailto:admin@ledgera.cl?subject=Contacto%20LEDGERA" style={{ display: "inline-flex", marginTop: 36, background: "#C9A84C", color: "#080E1F", padding: "16px 24px", borderRadius: 18, fontWeight: 900, textDecoration: "none" }}>Escribir a admin@ledgera.cl</a>
        <p style={{ color: "#7F8BA5", marginTop: 28 }}>Para sugerencias de producto y funcionamiento de la app, usa la página de opinión.</p>
        <Link href="/opinion" style={{ color: "#C9A84C", fontWeight: 900, textDecoration: "none" }}>Ayúdanos a mejorar LEDGERA →</Link>
      </section>
    </main>
  );
}
