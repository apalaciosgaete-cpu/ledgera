import type { Metadata } from "next";
import Link from "next/link";
import { MarketingCard, MarketingPage } from "@/components/marketing/MarketingLayout";

export const metadata: Metadata = {
  title: "Precio",
  description: "Planes de LEDGERA para personas, empresas y profesionales que necesitan ordenar activos y generar respaldo tributario.",
  alternates: { canonical: "/precio" },
};

const plans = [
  {
    name: "Persona",
    price: "Inicio guiado",
    description: "Para ordenar movimientos personales, revisar activos y preparar respaldo inicial.",
    features: ["Importación de movimientos", "Vista de activos", "Respaldo PDF/Excel", "Guía de obligaciones"],
  },
  {
    name: "Empresa",
    price: "Operación completa",
    description: "Para sociedades, equipos financieros y operaciones con mayor volumen documental.",
    features: ["Múltiples fuentes", "Trazabilidad extendida", "Reportes para revisión", "Soporte prioritario"],
  },
  {
    name: "Profesional",
    price: "Para asesores",
    description: "Para contadores, abogados tributarios y asesores que revisan casos de clientes.",
    features: ["Casos organizados", "Exportación documental", "Criterios y pendientes", "Flujo de revisión"],
  },
] as const;

export default function PrecioPage() {
  return (
    <MarketingPage
      active="Precio"
      eyebrow="Precio"
      title="Planes simples para ordenar, revisar y respaldar."
      description="La página de precios debe ser clara y comercial, pero sin prometer cálculo tributario definitivo. LEDGERA vende orden, trazabilidad, revisión de obligaciones y respaldo exportable."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan, index) => (
          <MarketingCard key={plan.name} className={index === 1 ? "border-[#C9A84C]/70 bg-[#111D3E]" : ""}>
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-3xl font-black tracking-[-0.04em] text-[#F2EBD8]">{plan.name}</h2>
              {index === 1 ? <span className="rounded-full bg-[#C9A84C] px-3 py-1 text-xs font-black text-[#080E1F]">Recomendado</span> : null}
            </div>
            <p className="mt-5 text-xl font-black text-[#C9A84C]">{plan.price}</p>
            <p className="mt-4 text-sm leading-7 text-[#BFC8D9]">{plan.description}</p>
            <ul className="mt-7 grid gap-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm font-semibold leading-6 text-[#BFC8D9]"><span className="text-[#C9A84C]">✓</span>{feature}</li>
              ))}
            </ul>
            <Link href="/contacto" className="mt-8 inline-flex w-full justify-center rounded-2xl border border-[#C9A84C]/70 px-5 py-4 text-sm font-black text-[#C9A84C] transition hover:bg-[#C9A84C] hover:text-[#080E1F]">
              Consultar plan
            </Link>
          </MarketingCard>
        ))}
      </div>

      <MarketingCard className="mt-8">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#C9A84C]">Nota comercial</p>
        <p className="mt-4 max-w-[980px] text-base leading-8 text-[#BFC8D9]">
          Los valores definitivos pueden definirse por etapa comercial. Mientras tanto, la página de precio ordena la propuesta de valor y abre conversación para usuarios personales, empresas y profesionales.
        </p>
      </MarketingCard>
    </MarketingPage>
  );
}
