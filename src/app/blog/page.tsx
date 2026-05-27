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
        fontFamily: "var(--font-body, 'Plus Jakarta Sans', sans-serif)",
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
          background: "rgba(10,31,46,0.94)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 2.5rem",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link href="/" style={{ textDecoration: "none" }} aria-label="Inicio LEDGERA">
            <Logo variant="light" size="lg" showSubtitle />
          </Link>
          <Link
            href="/"
            style={{
              fontSize: "14px",
              color: "#64748B",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M13 8H3M7 4L3 8l4 4"
                stroke="#64748B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Inicio
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link
            href="/login"
            style={{
              fontSize: "15px",
              fontWeight: 500,
              color: "#94A3B8",
              textDecoration: "none",
              padding: "8px 18px",
              borderRadius: "8px",
            }}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#ffffff",
              textDecoration: "none",
              padding: "9px 20px",
              borderRadius: "8px",
              background: "#16A34A",
            }}
          >
            Comenzar gratis
          </Link>
        </div>
      </nav>

      <section
        style={{
          padding: "6rem 2rem 4rem",
          background: "#071520",
          textAlign: "center",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(22,163,74,0.12)",
            border: "1px solid rgba(22,163,74,0.25)",
            borderRadius: "100px",
            padding: "5px 18px",
            marginBottom: "1.5rem",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#4ADE80" }}>
            Blog · Recursos tributarios
          </span>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 700,
            color: "#F1F5F9",
            letterSpacing: "-0.03em",
            margin: "0 0 1rem",
            lineHeight: 1.1,
          }}
        >
          Cripto, impuestos y conciliación en Chile
        </h1>
        <p
          style={{
            fontSize: "17px",
            color: "#94A3B8",
            maxWidth: "620px",
            margin: "0 auto",
            lineHeight: 1.65,
          }}
        >
          Guías prácticas para ordenar información crypto antes de una revisión tributaria: movimientos, banco, exchange, FIFO y trazabilidad.
        </p>
      </section>

      <section style={{ padding: "5rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {blogArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              style={{
                display: "block",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "18px",
                padding: "1.5rem",
                textDecoration: "none",
                transition: "border-color 0.15s ease, transform 0.15s ease",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: `${article.tagColor}14`,
                  border: `1px solid ${article.tagColor}30`,
                  borderRadius: "100px",
                  padding: "4px 12px",
                  marginBottom: "1rem",
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: 700, color: article.tagColor }}>
                  {article.tag}
                </span>
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#F1F5F9",
                  margin: "0 0 0.75rem",
                  lineHeight: 1.3,
                }}
              >
                {article.title}
              </h2>
              <p style={{ fontSize: "14px", color: "#94A3B8", margin: "0 0 1.25rem", lineHeight: 1.65 }}>
                {article.summary}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B" }}>
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
