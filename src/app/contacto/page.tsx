import type { Metadata } from "next";
import ContactForm from "@/components/marketing/ContactForm";
import { MarketingCard, MarketingPage } from "@/components/marketing/MarketingLayout";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contacta a LEDGERA para soporte, ventas, alianzas o consultas sobre la plataforma.",
  alternates: { canonical: "/contacto" },
};

const contactOptions = [
  ["Soporte", "Ayuda con acceso, uso de la plataforma, importaciones o reportes."],
  ["Ventas", "Consultas sobre planes para personas, empresas o profesionales."],
  ["Alianzas", "Integraciones, colaboración con estudios, contadores o asesores."],
] as const;

export default function ContactoPage() {
  return (
    <MarketingPage
      active="Contacto"
      eyebrow="Contacto"
      title="Hablemos sobre cómo LEDGERA puede ayudarte."
      description="Usa esta página para soporte, ventas, alianzas o consultas generales. Para sugerencias de producto y experiencia, usa la página de opinión."
    >
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="grid gap-5">
          {contactOptions.map(([title, text]) => (
            <MarketingCard key={title}>
              <h2 className="font-display text-3xl font-black tracking-[-0.04em] text-[#F2EBD8]">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#BFC8D9]">{text}</p>
            </MarketingCard>
          ))}
          <MarketingCard className="border-[#C9A84C]/55">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#C9A84C]">Correo directo</p>
            <a href="mailto:admin@ledgera.cl" className="mt-3 inline-flex text-lg font-black text-[#F2EBD8] transition hover:text-[#C9A84C]">admin@ledgera.cl</a>
          </MarketingCard>
        </div>
        <ContactForm />
      </div>
    </MarketingPage>
  );
}
