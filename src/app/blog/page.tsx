import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { blogArticles } from "@/modules/seo/blogArticles";

const baseUrl = "https://ledgera.cl";
const title = "Blog LEDGERA | Cripto, impuestos y conciliación en Chile";
const description =
  "Guías sobre impuestos crypto en Chile, revisión tributaria, método FIFO, tipo de cambio, fiscalización y conciliación financiera.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${baseUrl}/blog`,
  },
  openGraph: {
    title,
    description,
    url: `${baseUrl}/blog`,
    siteName: "LEDGERA",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Blog LEDGERA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${baseUrl}/opengraph-image`],
  },
};

export default function BlogPage() {
  return (
    <main
      style={{
        fontFamily: "var(--font-body, 'Inter', system-ui, sans-serif)",
        background: "#0A1F2E",
        color: "#F1F5F9",
        minHeight: "100vh",
      }}
    >
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(7,21,32,0.94)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "0 2.5rem",
          minHeight: "76px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link href="/" style={{ textDecoration: "none" }} aria-label="Inicio LEDGERA">
            <Logo variant="light" size="lg" showSubtitle />
          </Link>
          <Link href="/" style={{ fontSize: "14px", color: "#94A3B8", textDecoration: "none" }}>
            Inicio
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link href="/login" style={{ fontSize: "14px", fontWeight: 700, color: "#CBD5E1", textDecoration: "none", padding: "9px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
            Iniciar sesión
          </Link>
          <Link href="/register" style={{ fontSize: "14px", fontWeight: 850, color: "#ffffff", textDecoration: "none", padding: "10px 18px", borderRadius: "10px", background: "#16A34A" }}>
            Comenzar gratis
          </Link>
        </div>
      </nav>

      <section style={{ padding: "6rem 2rem 4rem", background: "radial-gradient(circle at top left, rgba(22,163,74,0.20), transparent 34%), linear-gradient(135deg,#061522 0%,#082033 48%,#0B2A3F 100%)", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: "100px", padding: "7px 18px", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "12px", fontWeight: 850, color: "#4ADE80", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Blog · Recursos tributarios
          </span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display, 'Manrope', system-ui, sans-serif)", fontSize: "clamp(2.2rem, 5vw, 4rem)", fontWeight: 900, color: "#F8FAFC", letterSpacing: "-0.055em", margin: "0 0 1rem", lineHeight: 1.05 }}>
          Cripto, impuestos y conciliación en Chile
        </h1>
        <p style={{ fontSize: "18px", color: "#CBD5E1", maxWidth: "720px", margin: "0 auto", lineHeight: 1.75 }}>
          Guías prácticas para ordenar información crypto antes de una revisión tributaria: movimientos, banco, exchange, FIFO y trazabilidad.
        </p>
      </section>

      <section style={{ padding: "5rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          {blogArticles.map((article) => (
            <Link key={article.slug} href={`/blog/${article.slug}`} style={{ display: "block", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "22px", padding: "1.6rem", textDecoration: "none" }}>
              <div style={{ display: "inline-flex", alignItems: "center", background: `${article.tagColor}14`, border: `1px solid ${article.tagColor}30`, borderRadius: "100px", padding: "5px 12px", marginBottom: "1rem" }}>
                <span style={{ fontSize: "12px", fontWeight: 850, color: article.tagColor }}>{article.tag}</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-display, 'Manrope', system-ui, sans-serif)", fontSize: "21px", fontWeight: 900, color: "#F8FAFC", margin: "0 0 0.75rem", lineHeight: 1.25, letterSpacing: "-0.035em" }}>
                {article.title}
              </h2>
              <p style={{ fontSize: "14px", color: "#94A3B8", margin: "0 0 1.25rem", lineHeight: 1.7 }}>
                {article.summary}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px" }}>
                <span>{article.publishedLabel}</span>
                <span>{article.readTime}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
