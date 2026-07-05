// src/app/quienes-somos/page.tsx
import type { Metadata } from "next";
import { PublicButton, PublicContainer, PublicCta, PublicHero, PublicShell, publicPalette } from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "Quiénes somos | LEDGERA",
  description: "Conoce LEDGERA, plataforma chilena para ordenar operaciones cripto desde exchanges, activos digitales y respaldo trazable.",
  alternates: { canonical: "https://ledgera.cl/quienes-somos" },
};

const audiences = [
  { title: "Inversores individuales", description: "Personas que operan con activos digitales y necesitan entender su portafolio, ordenar movimientos y preparar información revisable." },
  { title: "Contadores y asesores", description: "Profesionales que requieren trazabilidad, conciliación y reportes claros para revisar casos con operaciones cripto." },
  { title: "Empresas con activos digitales", description: "Equipos que necesitan control operacional, auditoría, conciliación bancaria y una base financiera coherente para revisión interna." },
];

const principles = [
  { title: "Trazabilidad", description: "Cada dato debe poder explicarse desde su operación original hasta su resultado financiero o tributario.", color: "var(--accent)" },
  { title: "Orden operacional", description: "La plataforma separa importación, revisión, confirmación, conciliación y reporte para evitar errores silenciosos.", color: "var(--text-faint)" },
  { title: "Contexto Chile", description: "LEDGERA está diseñada pensando en usuarios, contadores y empresas que operan desde Chile.", color: "var(--warn)" },
];

export default function QuienesSomosPage() {
  return (
    <PublicShell activePath="/quienes-somos">
      <PublicHero eyebrow="Quiénes somos" title="Construimos infraestructura para ordenar operaciones cripto en Chile" description="LEDGERA convierte historiales dispersos de exchanges, banco y activos digitales en información clara, conciliable y lista para revisión.">
        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap"><PublicButton href="/register">Comenzar análisis</PublicButton><PublicButton href="/como-funciona" variant="secondary">Ver cómo funciona</PublicButton></div>
      </PublicHero>
      <section style={{ background: publicPalette.section }}>
        <PublicContainer>
          <div className="grid gap-6 py-16 lg:grid-cols-2">
            <article className="rounded-3xl border border-border bg-bg-elev p-8"><p className="text-xs font-black uppercase tracking-[0.22em] text-accent">Misión</p><h2 className="mt-4 font-display text-3xl font-black tracking-[-0.04em] text-text">Que el usuario pueda entender y revisar su información antes de declarar o reportar.</h2><p className="mt-5 text-base leading-8 text-text-soft">LEDGERA organiza operaciones, importaciones, conciliación, portafolio y eventos tributarios para que la información no dependa de planillas manuales ni cálculos imposibles de auditar.</p></article>
            <article className="rounded-3xl border border-border bg-bg-elev p-8"><p className="text-xs font-black uppercase tracking-[0.22em] text-accent">Visión</p><h2 className="mt-4 font-display text-3xl font-black tracking-[-0.04em] text-text">Ser la capa financiera-tributaria de referencia para activos digitales en Chile.</h2><p className="mt-5 text-base leading-8 text-text-soft">El objetivo es que personas, contadores y empresas trabajen sobre una base común: operaciones confirmadas, cálculos reproducibles, reportes verificables y trazabilidad completa.</p></article>
          </div>
          <div className="pb-16"><div className="mb-8 max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.22em] text-text-faint">Para quién construimos</p><h2 className="mt-4 font-display text-3xl font-black tracking-[-0.04em] text-text md:text-4xl">Una plataforma para quienes necesitan evidencia, no solo saldos.</h2></div><div className="grid gap-5 md:grid-cols-3">{audiences.map((item) => <article key={item.title} className="rounded-3xl border border-border bg-bg-elev p-6"><h3 className="font-display text-xl font-black tracking-[-0.03em] text-text">{item.title}</h3><p className="mt-4 text-sm leading-7 text-text-soft">{item.description}</p></article>)}</div></div>
          <div className="grid gap-5 pb-20 md:grid-cols-3">{principles.map((item) => <article key={item.title} className="rounded-3xl border border-border bg-bg-elev p-6"><div className="mb-5 h-2 w-16 rounded-full" style={{ background: item.color }} /><h3 className="font-display text-xl font-black tracking-[-0.03em] text-text">{item.title}</h3><p className="mt-3 text-sm leading-7 text-text-soft">{item.description}</p></article>)}</div>
        </PublicContainer>
      </section>
      <PublicCta title="Ordena tus operaciones cripto antes de reportarlas" description="Centraliza exchanges, banco, activos digitales y respaldo en una base coherente para revisión." />
    </PublicShell>
  );
}
