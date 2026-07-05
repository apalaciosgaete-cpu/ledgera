import type { Metadata } from "next";
import { MarketingCard, MarketingPage } from "@/components/marketing/MarketingLayout";

export const metadata: Metadata = {
  title: "Seguridad",
  description: "Conoce los principios de seguridad, privacidad y alcance de LEDGERA.",
  alternates: { canonical: "/seguridad" },
};

const principles = [
  ["Privacidad por diseño", "La información financiera y tributaria debe tratarse con criterio de mínimo acceso, finalidad clara y resguardo documental."],
  ["Sesión y permisos", "Las áreas privadas deben depender de identidad real de sesión, no de datos enviados manualmente por el cliente."],
  ["Trazabilidad", "Los reportes deben permitir revisar origen, criterio, operación y archivo asociado."],
  ["Alcance responsable", "LEDGERA ordena, revisa y respalda. No sustituye asesoría contable, legal ni tributaria profesional."],
] as const;

export default function SeguridadPage() {
  return (
    <MarketingPage
      active="Seguridad"
      eyebrow="Seguridad y confianza"
      title="Confianza operacional para información sensible."
      description="LEDGERA trabaja con activos, movimientos y documentos que pueden tener impacto tributario. Por eso la comunicación de seguridad debe ser visible, concreta y conservadora."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {principles.map(([title, text]) => (
          <MarketingCard key={title}>
            <h2 className="font-display text-3xl font-black tracking-[-0.04em] text-[#F2EBD8]">{title}</h2>
            <p className="mt-4 text-base leading-8 text-[#BFC8D9]">{text}</p>
          </MarketingCard>
        ))}
      </div>

      <MarketingCard className="mt-8 border-[#C9A84C]/60">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#C9A84C]">Principio LEDGERA</p>
        <h2 className="mt-4 font-display text-4xl font-black tracking-[-0.045em] text-[#F2EBD8]">No decide por ti. Te ayuda a revisar mejor.</h2>
        <p className="mt-5 max-w-[980px] text-base leading-8 text-[#BFC8D9]">
          La plataforma busca entregar orden, trazabilidad, respaldos e información útil para una revisión informada. La decisión final y la validación profesional permanecen en manos del usuario y sus asesores.
        </p>
      </MarketingCard>
    </MarketingPage>
  );
}
