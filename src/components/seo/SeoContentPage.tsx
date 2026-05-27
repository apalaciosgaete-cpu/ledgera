// src/components/seo/SeoContentPage.tsx
import Link from "next/link";
import type { SeoPageContent } from "@/modules/seo/seoPageContent";

type SeoContentPageProps = {
  content: SeoPageContent;
};

export default function SeoContentPage({ content }: SeoContentPageProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_34%),linear-gradient(135deg,#061522_0%,#082033_48%,#0B2A3F_100%)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 md:px-10 md:py-28">
          <div className="flex flex-col gap-6">
            <Link
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300"
            >
              LEDGERA
            </Link>

            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">
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

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={content.ctaHref}
                className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300"
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
              <p className="text-sm font-bold text-amber-300">
                Importaciones
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Revisa antes de confirmar. Evita duplicados y movimientos que no
                corresponden.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5">
              <p className="text-sm font-bold text-cyan-300">
                Banco + Binance
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Cruza transferencias bancarias con movimientos crypto
                confirmados.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5">
              <p className="text-sm font-bold text-emerald-300">
                Base tributaria
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Prepara información clara para revisar impuestos crypto en
                Chile.
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
                LEDGERA ayuda a ordenar y preparar información financiera. No
                reemplaza la revisión de un contador ni constituye asesoría
                tributaria personalizada. Para decisiones tributarias, revisa tu
                caso con un profesional.
              </p>
            </section>
          </article>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                Keyword objetivo
              </p>
              <p className="mt-3 text-lg font-black text-slate-950">
                {content.keyword}
              </p>
            </div>

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

            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
              <p className="text-lg font-black">
                Ordena tus movimientos crypto
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Conecta Binance, revisa importaciones y empieza a construir una
                base financiera clara.
              </p>
              <Link
                href="/login"
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300"
              >
                Conectar Binance
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
