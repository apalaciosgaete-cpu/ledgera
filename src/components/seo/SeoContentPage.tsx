// src/components/seo/SeoContentPage.tsx
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import type { SeoPageContent } from "@/modules/seo/seoPageContent";
import {
  JsonLd,
  buildBreadcrumbList,
  buildSeoWebPageSchema,
  seoBaseUrl,
} from "@/modules/seo/structuredData";

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
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <JsonLd data={schema} />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#071520]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6 md:px-10">
          <Link href="/" aria-label="Inicio LEDGERA">
            <Logo variant="light" size="lg" showSubtitle />
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <Link
              href="/como-funciona"
              className="rounded-lg px-3 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Cómo funciona
            </Link>
            <Link
              href="/planes"
              className="rounded-lg px-3 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Planes
            </Link>
            <Link
              href="/preguntas"
              className="rounded-lg px-3 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Preguntas
            </Link>
            <Link
              href="/blog"
              className="rounded-lg px-3 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Blog
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(22,163,74,0.18),_transparent_34%),linear-gradient(135deg,#061522_0%,#082033_48%,#0B2A3F_100%)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 md:px-10 md:py-24">
          <div className="flex flex-col gap-6">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
              {content.eyebrow}
            </p>

            <div className="max-w-4xl space-y-6">
              <h1 className="text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
                {content.h1}
              </h1>

              <p className="max-w-3xl text-lg leading-8 text-slate-200 md:text-xl">
                {content.intro}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={content.ctaHref}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
              >
                {content.ctaLabel}
              </Link>

              <Link
                href="/como-funciona"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Ver cómo funciona
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5">
              <p className="text-sm font-bold text-emerald-300">
                Importaciones revisables
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Revisa archivos, exchange, banco o carga manual antes de confirmar movimientos.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5">
              <p className="text-sm font-bold text-cyan-300">
                Conciliación financiera
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Relaciona banco, exchange y portafolio sin contaminar tu historial confirmado.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5">
              <p className="text-sm font-bold text-amber-300">
                Base tributaria trazable
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Prepara información clara para revisión financiera y tributaria en Chile.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 text-slate-950">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1fr_320px] md:px-10">
          <article className="space-y-10">
            {content.sections.map((section) => (
              <section
                key={section.heading}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
                  {section.heading}
                </h2>

                <div className="mt-5 space-y-4 text-base leading-8 text-slate-700">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                {section.bullets && section.bullets.length > 0 ? (
                  <ul className="mt-6 grid gap-3">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-7">
              <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
                Nota importante
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-700">
                LEDGERA ayuda a ordenar y preparar información financiera-tributaria. No reemplaza la revisión de un contador ni constituye asesoría tributaria personalizada. Para decisiones tributarias, revisa tu caso con un profesional.
              </p>
            </section>
          </article>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                También revisa
              </p>

              <div className="mt-4 grid gap-3">
                {content.related.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                Continúa explorando
              </p>
              <div className="mt-4 grid gap-3">
                <Link
                  href="/planes"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-white"
                >
                  Ver planes
                </Link>
                <Link
                  href="/preguntas"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-white"
                >
                  Preguntas frecuentes
                </Link>
                <Link
                  href="/blog"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-white"
                >
                  Blog tributario crypto
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
              <p className="text-lg font-black">
                Ordena tus movimientos crypto
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Revisa importaciones, concilia fuentes y empieza a construir una base financiera clara.
              </p>
              <Link
                href="/register"
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
              >
                Crear cuenta gratis
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
