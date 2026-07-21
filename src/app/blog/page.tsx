import type { Metadata } from "next";
import Link from "next/link";
import { PublicButton, PublicContainer, PublicCta, PublicHero, PublicShell, publicPalette } from "@/components/public/PublicLayout";
import { blogArticles } from "@/modules/seo/blogArticles";
import { seoPageList } from "@/modules/seo/seoPageContent";
import { fonts } from "@/styles/tokens";

const baseUrl = "https://ledgera.cl";
const title = "Blog sobre cripto, exchanges y tributación en Chile";
const description = "Guías sobre operaciones cripto, exchanges, activos digitales, método FIFO, trazabilidad y conciliación financiera en Chile.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${baseUrl}/blog` },
  openGraph: { title, description, url: `${baseUrl}/blog`, siteName: "LEDGERA", locale: "es_CL", type: "website", images: [{ url: `${baseUrl}/opengraph-image`, width: 1200, height: 630, alt: "Blog LEDGERA" }] },
  twitter: { card: "summary_large_image", title, description, images: [`${baseUrl}/opengraph-image`] },
};

const sectionTitleStyle = {
  color: publicPalette.text,
  fontFamily: fonts.display,
  fontSize: "clamp(1.9rem,4vw,3rem)",
  fontWeight: 900,
  letterSpacing: "-0.05em",
  lineHeight: 1.08,
  margin: 0,
} as const;

const eyebrowStyle = {
  color: "var(--accent)",
  fontSize: "12px",
  fontWeight: 850,
  letterSpacing: "0.12em",
  margin: "0 0 12px",
  textTransform: "uppercase",
} as const;

export default function BlogPage() {
  return (
    <PublicShell activePath="/blog">
      <PublicHero eyebrow="Blog · Recursos tributarios" title="Operaciones cripto, exchanges y respaldo en Chile" description="Guías prácticas para ordenar información antes de una revisión: operaciones, banco, exchange, activos digitales, FIFO y trazabilidad.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
          <PublicButton href="/register">Comenzar análisis</PublicButton>
          <PublicButton href="/planes#precios" variant="secondary">Ver planes</PublicButton>
        </div>
      </PublicHero>

      <section style={{ background: publicPalette.page, padding: "76px 0" }}>
        <PublicContainer>
          <div style={{ maxWidth: "760px", marginBottom: "32px" }}>
            <p style={eyebrowStyle}>Artículos principales</p>
            <h2 style={sectionTitleStyle}>Contenido para entender, ordenar y revisar operaciones cripto.</h2>
          </div>
          <div style={{ display: "grid", gap: "22px", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
            {blogArticles.map((article) => (
              <Link key={article.slug} href={`/blog/${article.slug}`} style={{ background: publicPalette.card, border: `1px solid ${publicPalette.border}`, borderRadius: "24px", display: "flex", flexDirection: "column", minHeight: "100%", padding: "24px", textDecoration: "none" }}>
                <div style={{ alignItems: "center", alignSelf: "flex-start", background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: "999px", display: "inline-flex", marginBottom: "16px", padding: "6px 12px" }}>
                  <span style={{ color: "var(--accent)", fontSize: "12px", fontWeight: 850 }}>{article.tag}</span>
                </div>
                <h3 style={{ color: publicPalette.text, fontFamily: fonts.display, fontSize: "21px", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.22, margin: "0 0 12px" }}>{article.title}</h3>
                <p style={{ color: publicPalette.textMuted, flex: 1, fontSize: "14px", lineHeight: 1.7, margin: 0 }}>{article.summary}</p>
                <div style={{ borderTop: `1px solid ${publicPalette.border}`, color: publicPalette.textFaint, display: "flex", fontSize: "12px", gap: "12px", justifyContent: "space-between", marginTop: "22px", paddingTop: "14px" }}>
                  <span>{article.publishedLabel}</span><span>{article.readTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </PublicContainer>
      </section>

      <section style={{ background: publicPalette.section, padding: "76px 0" }}>
        <PublicContainer>
          <div style={{ maxWidth: "760px", marginBottom: "32px" }}>
            <p style={eyebrowStyle}>Recursos base</p>
            <h2 style={{ ...sectionTitleStyle, fontSize: "clamp(1.8rem,4vw,2.7rem)" }}>Páginas guía para búsquedas clave de LEDGERA.</h2>
            <p style={{ color: publicPalette.textMuted, fontSize: "15px", lineHeight: 1.75, margin: "16px 0 0" }}>Guías especializadas para resolver las principales dudas financieras y tributarias sobre activos digitales en Chile.</p>
          </div>
          <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))" }}>
            {seoPageList.map((page) => (
              <Link key={page.path} href={page.path} style={{ background: publicPalette.card, border: `1px solid ${publicPalette.border}`, borderRadius: "22px", padding: "22px", textDecoration: "none" }}>
                <p style={{ ...eyebrowStyle, fontSize: "11px", letterSpacing: "0.11em" }}>{page.eyebrow}</p>
                <h3 style={{ color: publicPalette.text, fontFamily: fonts.display, fontSize: "20px", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.22, margin: "0 0 10px" }}>{page.h1}</h3>
                <p style={{ color: publicPalette.textMuted, fontSize: "14px", lineHeight: 1.65, margin: 0 }}>{page.description}</p>
              </Link>
            ))}
          </div>
        </PublicContainer>
      </section>

      <PublicCta title="Ordena tus operaciones antes de cerrar tu revisión tributaria." description="Crea una cuenta, revisa tus fuentes y construye una base financiera-tributaria trazable para Chile." primaryLabel="Comenzar análisis" primaryHref="/register" secondaryLabel="Ver planes" secondaryHref="/planes#precios" />
    </PublicShell>
  );
}
