// src/app/blog/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { blogArticles, getBlogArticle } from "@/modules/seo/blogArticles";

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
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonicalUrl = `${baseUrl}/blog/${article.slug}`;

  return {
    title: `${article.title} | LEDGERA`,
    description: article.summary,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      url: canonicalUrl,
      siteName: "LEDGERA",
      locale: "es_CL",
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      images: [
        {
          url: `${baseUrl}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
      images: [`${baseUrl}/opengraph-image`],
    },
  };
}

const sectionBg = "#0A1F2E";
const darkBg = "#071520";

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getBlogArticle(slug);

  if (!article) notFound();

  return (
    <main
      style={{
        fontFamily: "var(--font-body, 'Plus Jakarta Sans', sans-serif)",
        background: sectionBg,
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
            href="/blog"
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
            Blog
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link
            href="/preguntas"
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#94A3B8",
              textDecoration: "none",
              padding: "8px 14px",
              borderRadius: "8px",
            }}
          >
            Preguntas
          </Link>
          <Link
            href="/register"
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#ffffff",
              textDecoration: "none",
              padding: "8px 18px",
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
          background: darkBg,
          padding: "5rem 2rem 4rem",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: article.tagColor,
                background: `${article.tagColor}18`,
                border: `1px solid ${article.tagColor}30`,
                borderRadius: "100px",
                padding: "4px 14px",
                textTransform: "uppercase" as const,
                letterSpacing: "0.06em",
              }}
            >
              {article.tag}
            </span>
            <span style={{ fontSize: "13px", color: "#64748B" }}>
              {article.readTime} de lectura · Publicado {article.publishedLabel}
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              fontWeight: 700,
              color: "#F1F5F9",
              letterSpacing: "-0.03em",
              margin: "0 0 1.25rem",
              lineHeight: 1.2,
            }}
          >
            {article.title}
          </h1>
          <p
            style={{
              fontSize: "17px",
              color: "#94A3B8",
              margin: 0,
              lineHeight: 1.65,
              maxWidth: "640px",
            }}
          >
            {article.summary}
          </p>
        </div>
      </section>

      <article style={{ padding: "4rem 2rem 3rem", maxWidth: "760px", margin: "0 auto" }}>
        {article.sections.map((section, index) => {
          if (section.type === "h2") {
            return (
              <h2
                key={`${section.type}-${index}`}
                style={{
                  fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                  fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)",
                  fontWeight: 700,
                  color: "#F1F5F9",
                  margin: "2.5rem 0 1rem",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                }}
              >
                {section.content as string}
              </h2>
            );
          }

          if (section.type === "p") {
            return (
              <p
                key={`${section.type}-${index}`}
                style={{
                  fontSize: "16px",
                  color: "#CBD5E1",
                  margin: "0 0 1.25rem",
                  lineHeight: 1.75,
                }}
              >
                {section.content as string}
              </p>
            );
          }

          if (section.type === "ul") {
            return (
              <ul
                key={`${section.type}-${index}`}
                style={{
                  margin: "0 0 1.5rem",
                  padding: 0,
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {(section.content as string[]).map((item, itemIndex) => (
                  <li
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "15px",
                      color: "#94A3B8",
                      lineHeight: 1.6,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        flexShrink: 0,
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        border: "1px solid #16A34A",
                        color: "#16A34A",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        marginTop: "3px",
                      }}
                    >
                      {itemIndex + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            );
          }

          if (section.type === "ol" || section.type === "step") {
            return (
              <ol
                key={`${section.type}-${index}`}
                style={{
                  margin: "0 0 1.5rem",
                  padding: 0,
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {(section.content as string[]).map((item, itemIndex) => (
                  <li
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "14px",
                      fontSize: "15px",
                      color: "#94A3B8",
                      lineHeight: 1.6,
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        background: "rgba(22,163,74,0.12)",
                        border: "1px solid rgba(22,163,74,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#4ADE80",
                        marginTop: "1px",
                      }}
                    >
                      {itemIndex + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            );
          }

          if (section.type === "callout") {
            return (
              <div
                key={`${section.type}-${index}`}
                style={{
                  margin: "1.5rem 0",
                  padding: "1.25rem 1.5rem",
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.24)",
                  borderRadius: "12px",
                  borderLeft: "3px solid #F59E0B",
                }}
              >
                <p
                  style={{
                    fontSize: "15px",
                    color: "#FDE68A",
                    margin: 0,
                    lineHeight: 1.65,
                  }}
                >
                  {section.content as string}
                </p>
              </div>
            );
          }

          return null;
        })}

        <section
          style={{
            marginTop: "3rem",
            paddingTop: "2rem",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
              fontSize: "20px",
              fontWeight: 700,
              color: "#F1F5F9",
              margin: "0 0 1rem",
            }}
          >
            También revisa
          </h2>
          <div style={{ display: "grid", gap: "10px" }}>
            {article.related.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  color: "#CBD5E1",
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.03)",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <div
          style={{
            marginTop: "3rem",
            padding: "2rem",
            background: "rgba(22,163,74,0.06)",
            border: "1px solid rgba(22,163,74,0.18)",
            borderRadius: "16px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#F1F5F9",
              margin: "0 0 0.5rem",
            }}
          >
            Ordena tus movimientos crypto antes de revisarlos tributariamente
          </p>
          <p style={{ fontSize: "14px", color: "#94A3B8", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
            Crea tu cuenta gratis, revisa importaciones, concilia banco y exchange, y prepara una base clara para revisión profesional.
          </p>
          <Link
            href="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "11px 24px",
              borderRadius: "9px",
              background: "#16A34A",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Comenzar gratis
          </Link>
        </div>
      </article>

      <footer
        style={{
          background: "#040C13",
          padding: "2rem 2.5rem",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "12px", color: "#334155" }}>
          © {new Date().getFullYear()} LEDGERA · Chile
        </span>
      </footer>
    </main>
  );
}
