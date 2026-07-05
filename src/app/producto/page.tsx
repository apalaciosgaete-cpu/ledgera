import type { Metadata } from "next";
import Link from "next/link";
import { MarketingCard, MarketingPage } from "@/components/marketing/MarketingLayout";

export const metadata: Metadata = {
  title: "Producto",
  description: "Conoce cómo LEDGERA ordena activos, revisa obligaciones y genera respaldo tributario trazable.",
  alternates: { canonical: "/producto" },
};

const flow = [
  ["01", "Importa movimientos", "Carga operaciones desde exchanges, bancos o archivos CSV para centralizar la información."],
  ["02", "Ordena activos", "Relaciona activos, fechas, montos, moneda de origen y documentación asociada."],
  ["03", "Revisa obligaciones", "Distingue qué debe declararse, respaldarse o revisarse antes de avanzar."],
  ["04", "Genera respaldo", "Descarga evidencia en PDF y Excel para revisión interna, contable o tributaria."],
] as const;

const outputs = [
  "Vista consolidada de activos y movimientos",
  "Trazabilidad por operación y fuente de información",
  "Separación entre declarar, respaldar y revisar",
  "Exportación documental para revisión profesional",
  "Registro claro de criterios aplicados y pendientes",
  "Base ordenada para futuras declaraciones",
] as const;

export default function ProductoPage() {
  return (
    <MarketingPage
      active="Producto"
      eyebrow="Producto LEDGERA"
      title="Una capa de orden y respaldo para activos financieros complejos."
      description="LEDGERA está diseñado para transformar información dispersa en vistas claras, trazables y exportables. El objetivo no es reemplazar al contador: es preparar mejor la información antes de declarar, revisar o decidir."
    >
      <div className="grid gap-5 lg:grid-cols-4">
        {flow.map(([num, title, text]) => (
          <MarketingCard key={title}>
            <div className="mb-6 inline-flex rounded-2xl border border-[#C9A84C]/50 bg-[#17140A] px-4 py-2 font-mono text-sm font-black text-[#C9A84C]">{num}</div>
            <h2 className="font-display text-2xl font-black tracking-[-0.035em] text-[#F2EBD8]">{title}</h2>
            <p className="mt-4 text-sm leading-7 text-[#BFC8D9]">{text}</p>
          </MarketingCard>
        ))}
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <MarketingCard>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#C9A84C]">Qué entrega</p>
          <h2 className="mt-4 font-display text-4xl font-black tracking-[-0.045em] text-[#F2EBD8]">Resultados concretos, no promesas abstractas.</h2>
          <p className="mt-5 text-base leading-8 text-[#BFC8D9]">
            La plataforma organiza la información para que el usuario pueda entender qué tiene, qué falta respaldar y qué debería revisar con criterio profesional.
          </p>
          <Link href="/register" className="mt-7 inline-flex rounded-2xl bg-[#C9A84C] px-6 py-4 text-sm font-black text-[#080E1F] transition hover:bg-[#DDBB61]">
            Comenzar evaluación
          </Link>
        </MarketingCard>

        <div className="grid gap-4 sm:grid-cols-2">
          {outputs.map((item) => (
            <div key={item} className="rounded-3xl border border-[#24345F] bg-[#101C3D]/75 p-5 text-sm font-semibold leading-7 text-[#BFC8D9]">
              <span className="mr-3 text-[#C9A84C]">●</span>{item}
            </div>
          ))}
        </div>
      </section>
    </MarketingPage>
  );
}
