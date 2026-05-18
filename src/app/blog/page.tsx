import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Blog · Ledgera",
  description:
    "Artículos sobre tributación de criptomonedas en Chile, normativa SII y cumplimiento fiscal para inversores, contadores y empresas.",
};

const ARTICLES = [
  {
    slug: "como-declarar-criptomonedas-sii-chile",
    title: "Cómo declarar criptomonedas al SII en Chile: guía completa 2025",
    summary:
      "Paso a paso para determinar tu ganancia de capital, aplicar el método FIFO y completar correctamente el Formulario 22 de acuerdo a la normativa vigente.",
    tag: "Declaración",
    tagColor: "#16A34A",
    readTime: "8 min",
    date: "12 de mayo, 2025",
  },
  {
    slug: "metodo-fifo-criptomonedas-chile",
    title: "El método FIFO y las criptomonedas: por qué el orden importa en tu declaración",
    summary:
      "El SII exige calcular el mayor valor usando el costo de adquisición cronológico. Un error en el orden de tus ventas puede significar pagar de más o de menos.",
    tag: "Motor FIFO",
    tagColor: "#7C3AED",
    readTime: "6 min",
    date: "28 de abril, 2025",
  },
  {
    slug: "fiscalizacion-sii-criptomonedas",
    title: "¿Qué pasa si el SII me fiscaliza por mis operaciones cripto?",
    summary:
      "El SII puede cruzar información de exchanges con tus declaraciones. Conoce qué documentación pedir, cómo responder y por qué la trazabilidad auditada es tu mejor defensa.",
    tag: "Fiscalización",
    tagColor: "#F59E0B",
    readTime: "7 min",
    date: "15 de abril, 2025",
  },
  {
    slug: "tipo-cambio-bcch-criptomonedas",
    title: "Tipo de cambio oficial BCCh para valorizar criptomonedas: todo lo que debes saber",
    summary:
      "Para convertir tus operaciones en USD a CLP debes usar el tipo de cambio oficial del Banco Central de Chile. Aprende cuándo y cómo se aplica en tu declaración.",
    tag: "Normativa",
    tagColor: "#0EA5E9",
    readTime: "5 min",
    date: "5 de abril, 2025",
  },
  {
    slug: "diferencia-persona-natural-empresa-cripto",
    title: "Persona natural vs. empresa: cómo tributan distinto las criptomonedas en Chile",
    summary:
      "Las personas naturales declaran mayor valor como renta ocasional; las empresas bajo primera categoría. La distinción cambia el monto, el formulario y los plazos.",
    tag: "Normativa",
    tagColor: "#0EA5E9",
    readTime: "6 min",
    date: "20 de marzo, 2025",
  },
  {
    slug: "como-importar-historial-binance-buda",
    title: "Cómo importar tu historial de Binance, Buda u Orionx a Ledgera",
    summary:
      "Descarga tu CSV de operaciones desde los principales exchanges chilenos y conviértelo en un portafolio tributario completo en menos de 5 minutos.",
    tag: "Tutorial",
    tagColor: "#16A34A",
    readTime: "4 min",
    date: "10 de marzo, 2025",
  },
];

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
      {/* Nav */}
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
          <Link href="/bienvenida" style={{ textDecoration: "none" }}>
            <Logo variant="light" size="lg" showSubtitle />
          </Link>
          <Link
            href="/bienvenida"
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

      {/* Header */}
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
          Cripto e impuestos en Chile
        </h1>
        <p
          style={{
            fontSize: "17px",
            color: "#94A3B8",
            maxWidth: "520px",
            margin: "0 auto",
            lineHeight: 1.65,
          }}
        >
          Guías prácticas, normativa SII y consejos para declarar tus criptomonedas correctamente.
        </p>
      </section>

      {/* Articles grid */}
      <section style={{ padding: "5rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              style={{ textDecoration: "none", display: "contents" }}
            >
            <article
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "16px",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "0",
                cursor: "pointer",
                transition: "border-color 0.15s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1.25rem",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: article.tagColor,
                    background: `${article.tagColor}18`,
                    border: `1px solid ${article.tagColor}30`,
                    borderRadius: "100px",
                    padding: "3px 12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {article.tag}
                </span>
                <span style={{ fontSize: "12px", color: "#475569" }}>{article.readTime} de lectura</span>
              </div>

              <h2
                style={{
                  fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#F1F5F9",
                  margin: "0 0 12px",
                  lineHeight: 1.3,
                  flex: 1,
                }}
              >
                {article.title}
              </h2>

              <p
                style={{
                  fontSize: "14px",
                  color: "#94A3B8",
                  margin: "0 0 1.5rem",
                  lineHeight: 1.65,
                }}
              >
                {article.summary}
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "auto",
                }}
              >
                <span style={{ fontSize: "12px", color: "#475569" }}>{article.date}</span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#4ADE80",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Leer artículo
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="#4ADE80"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </article>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          background: "#071520",
          padding: "6rem 2rem",
          textAlign: "center",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
            fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
            fontWeight: 700,
            color: "#F1F5F9",
            letterSpacing: "-0.03em",
            margin: "0 0 1rem",
            lineHeight: 1.1,
          }}
        >
          ¿Listo para declarar sin estrés?
        </h2>
        <p
          style={{
            fontSize: "17px",
            color: "#94A3B8",
            margin: "0 0 2rem",
            lineHeight: 1.65,
          }}
        >
          Crea tu cuenta gratis y empieza a ordenar tus cripto hoy.
        </p>
        <Link
          href="/register"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "13px 28px",
            borderRadius: "10px",
            background: "#16A34A",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Comenzar gratis
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </section>

      {/* Footer mínimo */}
      <footer
        style={{
          background: "#040C13",
          padding: "2rem 2.5rem",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "12px", color: "#334155" }}>
          © {new Date().getFullYear()} Ledgera · Chile
        </span>
      </footer>
    </main>
  );
}
