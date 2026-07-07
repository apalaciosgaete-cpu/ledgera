// src/components/seo/SeoContentPage.tsx
import Link from "next/link";
import { PublicButton, PublicContainer, PublicShell, publicPalette } from "@/components/public/PublicLayout";
import type { SeoPageContent } from "@/modules/seo/seoPageContent";
import { JsonLd, buildBreadcrumbList, buildSeoWebPageSchema, seoBaseUrl } from "@/modules/seo/structuredData";

const featureCards = [
  { title: "Importaciones revisables", text: "Revisa archivos, exchange, banco o carga manual antes de confirmar movimientos.", tone: "var(--accent)" },
  { title: "Conciliación financiera", text: "Relaciona banco, exchange y portafolio sin contaminar tu historial confirmado.", tone: "var(--text-faint)" },
  { title: "Base tributaria trazable", text: "Prepara información clara para revisión financiera y tributaria en Chile.", tone: "var(--warn)" },
];

type SeoContentPageProps = { content: SeoPageContent };

const cardClass = "rounded-3xl border border-border bg-bg-elev p-6";
const linkCardClass = "rounded-2xl border border-border bg-bg-sunken px-4 py-3 text-sm font-bold text-text-soft transition hover:text-text";

export default function SeoContentPage({ content }: SeoContentPageProps) {
  const pageUrl = `${seoBaseUrl}${content.path}`;
  const schema = [buildSeoWebPageSchema(content), buildBreadcrumbList([{ name: "Inicio", url: seoBaseUrl }, { name: content.h1, url: pageUrl }])];

  return (
    <PublicShell>
      <JsonLd data={schema} />
      <section className="border-b border-border bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_34%),linear-gradient(135deg,var(--bg-sunken)_0%,var(--bg)_48%,var(--bg-elev)_100%)]">
        <PublicContainer>
          <div className="flex flex-col gap-10 py-16 md:py-24">
            <div className="max-w-4xl">
              <p className="m-0 text-sm font-black uppercase tracking-[0.24em] text-accent">{content.eyebrow}</p>
              <h1 className="mt-6 font-display text-4xl font-black leading-[1.02] tracking-[-0.055em] text-text md:text-6xl">{content.h1}</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-text-soft md:text-xl">{content.intro}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><PublicButton href={content.ctaHref}>{content.ctaLabel}</PublicButton><PublicButton href="/como-funciona" variant="secondary">Ver cómo funciona</PublicButton></div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">{featureCards.map((card) => <div key={card.title} className={cardClass}><p className="text-sm font-black" style={{ color: card.tone }}>{card.title}</p><p className="mt-2 text-sm leading-6 text-text-soft">{card.text}</p></div>)}</div>
          </div>
        </PublicContainer>
      </section>
      <section style={{ background: publicPalette.section }}>
        <PublicContainer>
          <div className="grid gap-10 py-16 md:grid-cols-[1fr_320px]">
            <article className="space-y-6">
              {content.sections.map((section) => <section key={section.heading} className="rounded-3xl border border-border bg-bg-elev p-7"><h2 className="font-display text-2xl font-black tracking-[-0.03em] text-text">{section.heading}</h2><div className="mt-5 space-y-4 text-base leading-8 text-text-soft">{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>{section.bullets && section.bullets.length > 0 ? <ul className="mt-6 grid gap-3 p-0">{section.bullets.map((bullet) => <li key={bullet} className="list-none rounded-2xl border border-border bg-bg-sunken px-4 py-3 text-sm font-bold text-text-soft">{bullet}</li>)}</ul> : null}</section>)}
              <section className="rounded-3xl border border-warn bg-bg-elev p-7"><h2 className="font-display text-2xl font-black tracking-[-0.03em] text-text">Nota importante</h2><p className="mt-4 text-base leading-8 text-warn">LEDGERA ayuda a ordenar y preparar información financiera-tributaria. No reemplaza la revisión de un contador ni constituye asesoría tributaria personalizada. Para decisiones tributarias, revisa tu caso con un profesional.</p></section>
            </article>
            <aside className="space-y-5">
              <div className={cardClass}><p className="text-xs font-black uppercase tracking-[0.22em] text-text-faint">También revisa</p><div className="mt-4 grid gap-3">{content.related.map((item) => <Link key={item.href} href={item.href} className={linkCardClass}>{item.label}</Link>)}</div></div>
              <div className={cardClass}><p className="text-xs font-black uppercase tracking-[0.22em] text-text-faint">Continúa explorando</p><div className="mt-4 grid gap-3"><Link href="/planes" className={linkCardClass}>Ver planes</Link><Link href="/preguntas" className={linkCardClass}>Preguntas frecuentes</Link><Link href="/blog" className={linkCardClass}>Blog tributario crypto</Link></div></div>
              <div className="rounded-3xl border border-accent bg-accent-soft p-6 text-text"><p className="text-lg font-black">Ordena tus movimientos crypto</p><p className="mt-3 text-sm leading-6 text-text-soft">Revisa importaciones, concilia fuentes y empieza a construir una base financiera clara.</p><Link href="/register" className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-black text-accent-contrast">Comenzar ahora</Link></div>
            </aside>
          </div>
        </PublicContainer>
      </section>
    </PublicShell>
  );
}
