// src/app/como-funciona/page.tsx
import type { Metadata } from "next";

import {
  PublicButton,
  PublicContainer,
  PublicCta,
  PublicHero,
  PublicShell,
  publicPalette,
} from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "Cómo funciona | LEDGERA",
  description:
    "Conoce cómo LEDGERA organiza movimientos crypto, conciliación bancaria, portafolio y base tributaria trazable para Chile.",
  alternates: {
    canonical: "https://ledgera.cl/como-funciona",
  },
};

const steps = [
  {
    number: "01",
    title: "Importa o registra tus movimientos",
    description:
      "Carga archivos, registra operaciones manuales o conecta fuentes en una etapa revisable antes de confirmar datos en tu historial financiero.",
    bullets: ["Compras y ventas", "Transferencias", "Comisiones", "Movimientos bancarios"],
    color: "var(--accent)",
  },
  {
    number: "02",
    title: "Revisa, limpia y concilia",
    description:
      "LEDGERA ayuda a separar datos pendientes, detectar inconsistencias y relacionar banco, exchange y portafolio sin perder trazabilidad.",
    bullets: ["Revisión previa", "Conciliación banco/exchange", "Clasificación", "Alertas de integridad"],
    color: "var(--text-faint)",
  },
  {
    number: "03",
    title: "Prepara reportes y base tributaria",
    description:
      "Desde movimientos confirmados, la plataforma construye información clara para revisión financiera, contable o tributaria.",
    bullets: ["FIFO trazable", "Eventos tributarios", "CSV/PDF", "Auditoría y verificación"],
    color: "var(--warn)",
  },
];

export default function ComoFuncionaPage() {
  return (
    <PublicShell activePath="/como-funciona">
      <PublicHero
        eyebrow="Cómo funciona"
        title="De movimientos dispersos a información financiera revisable"
        description="LEDGERA estructura el proceso completo: importación, revisión, conciliación, portafolio, base tributaria y reportes verificables."
      >
        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <PublicButton href="/register">Comenzar ahora</PublicButton>
          <PublicButton href="/planes" variant="secondary">
            Ver planes
          </PublicButton>
        </div>
      </PublicHero>

      <section style={{ background: publicPalette.section }}>
        <PublicContainer>
          <div className="grid gap-6 py-16">
            {steps.map((step, index) => (
              <article
                key={step.number}
                className="grid gap-8 rounded-3xl border border-white/10 bg-white/[0.045] p-7 md:grid-cols-[0.9fr_1.1fr] md:p-9"
              >
                <div className={index % 2 === 1 ? "md:order-2" : undefined}>
                  <p className="font-display text-6xl font-black leading-none tracking-[-0.06em]" style={{ color: `${step.color}55` }}>
                    {step.number}
                  </p>
                  <h2 className="mt-5 font-display text-3xl font-black tracking-[-0.04em] text-white">
                    {step.title}
                  </h2>
                  <p className="mt-5 text-base leading-8 text-slate-300">{step.description}</p>
                </div>

                <div className="grid content-center gap-3">
                  {step.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: step.color }} />
                      <span className="text-sm font-bold text-slate-200">{bullet}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </PublicContainer>
      </section>

      <section style={{ background: publicPalette.page }}>
        <PublicContainer>
          <div className="grid gap-5 py-16 md:grid-cols-3">
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="font-display text-xl font-black tracking-[-0.03em] text-white">No parte desde saldos manuales</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">La base del sistema son movimientos con fecha, cantidad, precio, fuente y trazabilidad.</p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="font-display text-xl font-black tracking-[-0.03em] text-white">Calcula desde evidencia</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">Portafolio, resultados y eventos tributarios derivan de operaciones confirmadas.</p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="font-display text-xl font-black tracking-[-0.03em] text-white">Prepara revisión profesional</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">LEDGERA organiza datos, pero no reemplaza asesoría contable o tributaria personalizada.</p>
            </article>
          </div>
        </PublicContainer>
      </section>

      <PublicCta
        title="Empieza por ordenar tus movimientos"
        description="Una base clara reduce errores, mejora la conciliación y facilita la revisión tributaria posterior."
      />
    </PublicShell>
  );
}
