// src/app/blog/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { blogArticles, getBlogArticle } from "@/modules/seo/blogArticles";
import {
  JsonLd,
  buildBlogPostingSchema,
  buildBreadcrumbList,
} from "@/modules/seo/structuredData";

const baseUrl = "https://ledgera.cl";

export function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getBlogArticle(slug);

  if (!article) {
    return {
      title: "Artículo no encontrado | LEDGERA",
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = `${baseUrl}/blog/${article.slug}`;

  return {
    title: `${article.title} | LEDGERA`,
    description: article.summary,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: article.title,
      description: article.summary,
      url: canonicalUrl,
      siteName: "LEDGERA",
      locale: "es_CL",
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      images: [{ url: `${baseUrl}/opengraph-image`, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
      images: [`${baseUrl}/opengraph-image`],
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getBlogArticle(slug);

  if (!article) notFound();

  const articleUrl = `${baseUrl}/blog/${article.slug}`;
  const schema = [
    buildBlogPostingSchema(article),
    buildBreadcrumbList([
      { name: "Inicio", url: baseUrl },
      { name: "Blog", url: `${baseUrl}/blog` },
      { name: article.title, url: articleUrl },
    ]),
  ];

  return (
    <main style={{ fontFamily: "'Manrope', system-ui, sans-serif", background: "var(--bg-elev)", color: "var(--text)", minHeight: "100vh" }}>
      <JsonLd data={schema} />

      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(7,21,32,0.94)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 2.5rem", minHeight: "76px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link href="/" style={{ textDecoration: "none" }} aria-label="Inicio LEDGERA">
            <Logo variant="light" size="lg" showSubtitle />
          </Link>
          <Link href="/blog" style={{ fontSize: "14px", color: "var(--text-soft)", textDecoration: "none" }}>
            Blog
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link href="/preguntas" style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-faint)", textDecoration: "none", padding: "9px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
            Preguntas
          </Link>
          <Link href="/register" style={{ fontSize: "14px", fontWeight: 850, color: "var(--text)", textDecoration: "none", padding: "10px 18px", borderRadius: "10px", background: "var(--accent)" }}>
            Comenzar gratis
          </Link>
        </div>
      </nav>

      <section style={{ background: "radial-gradient(circle at top left, rgba(22,163,74,0.20), transparent 34%), linear-gradient(135deg,var(--bg-elev) 0%,var(--bg-elev) 48%,var(--bg-elev) 100%)", padding: "5.5rem 2rem 4.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", fontWeight: 850, color: article.tagColor, background: `${article.tagColor}18`, border: `1px solid ${article.tagColor}30`, borderRadius: "100px", padding: "5px 14px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {article.tag}
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-soft)" }}>
              {article.readTime} de lectura · Publicado {article.publishedLabel}
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display, 'Manrope', system-ui, sans-serif)", fontSize: "clamp(2rem, 4vw, 3.4rem)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.055em", margin: "0 0 1.25rem", lineHeight: 1.08 }}>
            {article.title}
          </h1>
          <p style={{ fontSize: "18px", color: "var(--text-faint)", margin: 0, lineHeight: 1.75, maxWidth: "720px" }}>
            {article.summary}
          </p>
        </div>
      </section>

      <article style={{ padding: "4rem 2rem 3rem", maxWidth: "800px", margin: "0 auto" }}>
        {article.sections.map((section, index) => {
          if (section.type === "h2") {
            return <h2 key={`${section.type}-${index}`} style={{ fontFamily: "var(--font-display, 'Manrope', system-ui, sans-serif)", fontSize: "clamp(1.35rem, 2.5vw, 1.75rem)", fontWeight: 900, color: "var(--text)", margin: "2.7rem 0 1rem", letterSpacing: "-0.035em", lineHeight: 1.25 }}>{section.content as string}</h2>;
          }

          if (section.type === "p") {
            return <p key={`${section.type}-${index}`} style={{ fontSize: "16px", color: "var(--text-faint)", margin: "0 0 1.25rem", lineHeight: 1.8 }}>{section.content as string}</p>;
          }

          if (section.type === "ul") {
            return (
              <ul key={`${section.type}-${index}`} style={{ margin: "0 0 1.5rem", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                {(section.content as string[]).map((item, itemIndex) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "15px", color: "var(--text-soft)", lineHeight: 1.65 }}>
                    <span aria-hidden="true" style={{ flexShrink: 0, width: "18px", height: "18px", borderRadius: "50%", border: "1px solid var(--accent)", color: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", marginTop: "3px" }}>{itemIndex + 1}</span>
                    {item}
                  </li>
                ))}
              </ul>
            );
          }

          if (section.type === "ol" || section.type === "step") {
            return (
              <ol key={`${section.type}-${index}`} style={{ margin: "0 0 1.5rem", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                {(section.content as string[]).map((item, itemIndex) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "14px", fontSize: "15px", color: "var(--text-soft)", lineHeight: 1.65 }}>
                    <span style={{ flexShrink: 0, width: "26px", height: "26px", borderRadius: "50%", background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "var(--accent)", marginTop: "1px" }}>{itemIndex + 1}</span>
                    {item}
                  </li>
                ))}
              </ol>
            );
          }

          if (section.type === "callout") {
            return <div key={`${section.type}-${index}`} style={{ margin: "1.5rem 0", padding: "1.25rem 1.5rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.24)", borderRadius: "14px", borderLeft: "4px solid var(--warn)" }}><p style={{ fontSize: "15px", color: "var(--text-faint)", margin: 0, lineHeight: 1.7 }}>{section.content as string}</p></div>;
          }

          return null;
        })}

        <section style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 style={{ fontFamily: "var(--font-display, 'Manrope', system-ui, sans-serif)", fontSize: "22px", fontWeight: 900, color: "var(--text)", margin: "0 0 1rem", letterSpacing: "-0.03em" }}>
            También revisa
          </h2>
          <div style={{ display: "grid", gap: "10px" }}>
            {article.related.map((item) => (
              <Link key={item.href} href={item.href} style={{ color: "var(--text-faint)", textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "13px 15px", background: "rgba(255,255,255,0.035)", fontSize: "14px", fontWeight: 750 }}>
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <div style={{ marginTop: "3rem", padding: "2rem", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.22)", borderRadius: "18px", textAlign: "center" }}>
          <p style={{ fontSize: "18px", fontWeight: 900, color: "var(--text)", margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>
            Ordena tus movimientos crypto antes de revisarlos tributariamente
          </p>
          <p style={{ fontSize: "14px", color: "var(--text-soft)", margin: "0 0 1.25rem", lineHeight: 1.7 }}>
            Crea tu cuenta gratis, revisa importaciones, concilia banco y exchange, y prepara una base clara para revisión profesional.
          </p>
          <Link href="/register" style={{ display: "inline-flex", alignItems: "center", padding: "12px 24px", borderRadius: "10px", background: "var(--accent)", color: "var(--text)", fontSize: "14px", fontWeight: 850, textDecoration: "none" }}>
            Comenzar gratis
          </Link>
        </div>
      </article>

      <footer style={{ background: "var(--bg-elev)", padding: "2rem 2.5rem", borderTop: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
        <span style={{ fontSize: "12px", color: "var(--text)" }}>© {new Date().getFullYear()} LEDGERA · Chile</span>
      </footer>
    </main>
  );
}
