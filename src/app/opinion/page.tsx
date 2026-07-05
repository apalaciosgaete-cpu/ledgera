import type { Metadata } from "next";
import FeedbackForm from "@/components/marketing/FeedbackForm";
import { MarketingCard, MarketingPage } from "@/components/marketing/MarketingLayout";

export const metadata: Metadata = {
  title: "Opinión",
  description: "Ayúdanos a mejorar LEDGERA con feedback orgánico sobre claridad, utilidad y funcionamiento de la app.",
  alternates: { canonical: "/opinion" },
};

const prompts = [
  "Qué esperabas resolver al entrar a LEDGERA",
  "Qué parte te pareció más útil",
  "Qué información debería explicarse mejor",
  "Qué función te gustaría ver próximamente",
] as const;

export default function OpinionPage() {
  return (
    <MarketingPage
      active=""
      eyebrow="Ayúdanos a mejorar"
      title="Tu opinión ayuda a construir una plataforma más clara y útil."
      description="Esta página está pensada para recibir feedback orgánico sobre la experiencia, el funcionamiento de la app y las mejoras que más valor aportarían a usuarios reales."
    >
      <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <MarketingCard className="border-[#C9A84C]/55">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#C9A84C]">Feedback de producto</p>
            <h2 className="mt-4 font-display text-4xl font-black tracking-[-0.045em] text-[#F2EBD8]">No buscamos respuestas perfectas. Buscamos señales reales.</h2>
            <p className="mt-5 text-base leading-8 text-[#BFC8D9]">
              Queremos saber qué esperabas lograr, qué te resultó valioso y qué mejorarías para que LEDGERA sea más simple, confiable y útil en situaciones tributarias reales.
            </p>
          </MarketingCard>
          <div className="mt-5 grid gap-3">
            {prompts.map((prompt) => (
              <div key={prompt} className="rounded-2xl border border-[#24345F] bg-[#101C3D]/75 px-5 py-4 text-sm font-semibold text-[#BFC8D9]">
                <span className="mr-3 text-[#C9A84C]">●</span>{prompt}
              </div>
            ))}
          </div>
        </div>
        <FeedbackForm />
      </div>
    </MarketingPage>
  );
}
