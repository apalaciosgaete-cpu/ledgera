// src/app/como-funciona/page.tsx
import type { Metadata } from "next";
import { PublicButton, PublicContainer, PublicCta, PublicHero, PublicShell, publicPalette } from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "Cómo funciona la plataforma",
  description: "Conoce cómo LEDGERA importa operaciones cripto desde exchanges, ordena activos digitales y genera respaldo trazable.",
  alternates: { canonical: "https://ledgera.cl/como-funciona" },
};

const steps = [
  { number: "01", title: "Importa operaciones desde exchanges", description: "Carga CSV/API, registra movimientos manuales o suma documentación en una etapa revisable antes de confirmar datos.", bullets: ["Compras y ventas", "Transferencias", "Comisiones", "Movimientos bancarios"], color: "var(--accent)" },
  { number: "02", title: "Revisa, limpia y concilia", description: "Separa datos pendientes, detecta inconsistencias y relaciona banco, exchange y activos digitales sin perder trazabilidad.", bullets: ["Revisión previa", "Conciliación", "Clasificación", "Alertas de integridad"], color: "var(--text-faint)" },
  { number: "03", title: "Genera respaldo tributario", description: "Desde movimientos confirmados, la plataforma construye información clara para revisión financiera y tributaria.", bullets: ["FIFO trazable", "Eventos tributarios", "PDF/Excel", "Auditoría"], color: "var(--warn)" },
];

export default function ComoFuncionaPage() {
  return (
    <PublicShell activePath="/como-funciona">
      <PublicHero eyebrow="Cómo funciona" title="De tus exchanges a respaldo tributario revisable" description="LEDGERA estructura el proceso completo: importación, revisión, conciliación, activos digitales, obligaciones tributarias y reportes verificables.">
        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap"><PublicButton href="/register">Comenzar análisis</PublicButton><PublicButton href="/planes" variant="secondary">Ver planes</PublicButton></div>
      </PublicHero>
      <section style={{ background: publicPalette.section }}><PublicContainer><div className="grid gap-6 py-16">{steps.map((step) => <article key={step.number} className="grid gap-8 rounded-3xl border border-border bg-bg-elev p-7 md:grid-cols-2 md:p-9"><div><p className="font-display text-6xl font-black leading-none tracking-[-0.06em]" style={{ color: step.color }}>{step.number}</p><h2 className="mt-5 font-display text-3xl font-black tracking-[-0.04em] text-text">{step.title}</h2><p className="mt-5 text-base leading-8 text-text-soft">{step.description}</p></div><div className="grid content-center gap-3">{step.bullets.map((bullet) => <div key={bullet} className="flex items-center gap-3 rounded-2xl border border-border bg-bg-sunken px-4 py-4"><span className="h-2.5 w-2.5 rounded-full" style={{ background: step.color }} /><span className="text-sm font-bold text-text-soft">{bullet}</span></div>)}</div></article>)}</div></PublicContainer></section>
      <section style={{ background: publicPalette.page }}><PublicContainer><div className="grid gap-5 py-16 md:grid-cols-3">{["No parte desde saldos manuales", "Trabaja desde evidencia", "Prepara revisión profesional"].map((title) => <article key={title} className="rounded-3xl border border-border bg-bg-elev p-6"><h3 className="font-display text-xl font-black tracking-[-0.03em] text-text">{title}</h3><p className="mt-3 text-sm leading-7 text-text-soft">La información se ordena desde operaciones confirmadas, trazabilidad y reportes revisables.</p></article>)}</div></PublicContainer></section>
      <PublicCta title="Empieza por ordenar tus operaciones cripto" description="Una base clara reduce errores, mejora la conciliación y facilita la revisión posterior." />
    </PublicShell>
  );
}
