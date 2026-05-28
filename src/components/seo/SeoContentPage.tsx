// src/components/seo/SeoContentPage.tsx
import Link from "next/link";

import {
  PublicButton,
  PublicContainer,
  PublicShell,
  publicPalette,
} from "@/components/public/PublicLayout";
import type { SeoPageContent } from "@/modules/seo/seoPageContent";
import {
  JsonLd,
  buildBreadcrumbList,
  buildSeoWebPageSchema,
  seoBaseUrl,
} from "@/modules/seo/structuredData";

const featureCards = [
  {
    title: "Importaciones revisables",
    text: "Revisa archivos, exchange, banco o carga manual antes de confirmar movimientos.",
    tone: "#4ADE80",
  },
  {
    title: "Conciliación financiera",
    text: "Relaciona banco, exchange y portafolio sin contaminar tu historial confirmado.",
    tone: "#67E8F9",
  },
  {
    title: "Base tributaria trazable",
    text: "Prepara información clara para revisión financiera y tributaria en Chile.",
    tone: "#FBBF24",
  },
];

type SeoContentPageProps = {
  content: SeoPageContent;
};

export default function SeoContentPage({ content }: SeoContentPageProps) {
  const pageUrl = `${seoBaseUrl}${content.path}`;

  const schema = [
    buildSeoWebPageSchema(content),
    buildBreadcrumbList([
      { name: "Inicio", url: seoBaseUrl },
      { name: content.h1, url: pageUrl },
    ]),
  ];

  return (
    <PublicShell>
      <JsonLd data={schema} />

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(22,163,74,0.20),_transparent_34%),linear-gradient(135deg,#061522_0%,#082033_48%,#0B2A3F_100%)]">
        <PublicContainer>
          <div className="flex flex-col gap-10 py-16 md:py-24">
            <div className="max-w-4xl">
              <p className="m-0 text-sm font-black uppercase tracking-[0.24em] text-emerald-300">
                {content.eyebrow}
              </p>

              <h1 className="mt-6 font-display text-4xl font-black leading-[1.02] tracking-[-0.055em] text-white md:text-6xl">
                {content.h1}
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200 md:text-xl">
                {content.intro}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <PublicButton href={content.ctaHref}>{content.ctaLabel}</PublicButton>
                <PublicButton href="/como-funciona" variant="secondary">
                  Ver cómo funciona
                </PublicButton>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {featureCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.06] p-5"
                >
                  <p className="text-sm font-black" style={{ color: card.tone }}>
                    {card.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </PublicContainer>
      </section>

      <section style={{ background: publicPalette.section }}>
        <PublicContainer>
          <div className="grid gap-10 py-16 md:grid-cols-[1fr_320px]">
            <article className="space-y-6">
              {content.sections.map((section) => (
                <section
                  key={section.heading}
                  className="rounded-3xl border border-white/10 bg-white/[0.045] p-7"
                >
                  <h2 className="font-display text-2xl font-black tracking-[-0.03em] text-slate-50">
                    {section.heading}
                  </h2>

                  <div className="mt-5 space-y-4 text-base leading-8 text-slate-300">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>

                  {section.bullets && section.bullets.length > 0 ? (
                    <ul className="mt-6 grid gap-3 p-0">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="list-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-200"
                        >
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}

              <section className="rounded-3xl border border-amber-400/25 bg-amber-400/[0.08] p-7">
                <h2 className="font-display text-2xl font-black tracking-[-0.03em] text-slate-50">
                  Nota importante
                </h2>
                <p className="mt-4 text-base leading-8 text-amber-100">
                  LEDGERA ayuda a ordenar y preparar información financiera-tributaria. No reemplaza la revisión de un contador ni constituye asesoría tributaria personalizada. Para decisiones tributarias, revisa tu caso con un profesional.
                </p>
              </section>
            </article>

            <aside className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  También revisa
                </p>

                <div className="mt-4 grid gap-3">
                  {content.related.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.07]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Continúa explorando
                </p>
                <div className="mt-4 grid gap-3">
                  <Link
                    href="/planes"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.07]"
                  >
                    Ver planes
                  </Link>
                  <Link
                    href="/preguntas"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.07]"
                  >
                    Preguntas frecuentes
                  </Link>
                  <Link
                    href="/blog"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.07]"
                  >
                    Blog tributario crypto
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/[0.08] p-6 text-white">
                <p className="text-lg font-black">Ordena tus movimientos crypto</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Revisa importaciones, concilia fuentes y empieza a construir una base financiera clara.
                </p>
                <Link
                  href="/register"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  Comenzar ahora
                </Link>
              </div>
            </aside>
          </div>
        </PublicContainer>
      </section>
    </PublicShell>
  );
}
