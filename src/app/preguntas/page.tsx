// src/app/preguntas/page.tsx
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
  title: "Preguntas frecuentes | LEDGERA",
  description:
    "Respuestas sobre LEDGERA, impuestos crypto en Chile, conciliación bancaria, motor FIFO, reportes y planes.",
  alternates: {
    canonical: "https://ledgera.cl/preguntas",
  },
};

const categories = [
  {
    label: "Tributación",
    color: "var(--accent)",
    faqs: [
      {
        q: "¿LEDGERA reemplaza a un contador?",
        a: "No. LEDGERA organiza y prepara información financiera-tributaria, pero no reemplaza revisión profesional ni asesoría tributaria personalizada.",
      },
      {
        q: "¿Qué operaciones crypto pueden requerir revisión?",
        a: "Ventas a moneda fiat, intercambios entre activos, pagos recibidos en cripto y movimientos con ganancia realizada pueden requerir análisis según el caso.",
      },
      {
        q: "¿Puedo reconstruir años anteriores?",
        a: "Sí. Puedes ordenar movimientos históricos para revisar períodos anteriores, siempre validando el tratamiento final con un profesional.",
      },
    ],
  },
  {
    label: "Plataforma",
    color: "var(--text-faint)",
    faqs: [
      {
        q: "¿Puedo importar datos desde exchanges?",
        a: "LEDGERA está diseñada para trabajar con importaciones, revisión previa y confirmación antes de afectar el historial financiero.",
      },
      {
        q: "¿Puedo conciliar banco y exchange?",
        a: "Sí. El objetivo es relacionar transferencias bancarias, movimientos de exchange y portafolio para reducir desorden operacional.",
      },
      {
        q: "¿Qué significa que la información sea trazable?",
        a: "Que cada resultado pueda explicarse desde movimientos originales, fechas, cantidades, precios, comisiones y clasificaciones aplicadas.",
      },
    ],
  },
  {
    label: "Planes",
    color: "var(--warn)",
    faqs: [
      {
        q: "¿Existe plan gratuito?",
        a: "Sí. El plan gratuito permite explorar la plataforma con un volumen limitado de movimientos.",
      },
      {
        q: "¿Qué plan conviene para una persona?",
        a: "El plan Personal está pensado para usuarios que necesitan ordenar movimientos, revisar portafolio, conciliación y reportes.",
      },
      {
        q: "¿Hay planes para contadores o empresas?",
        a: "Sí. Los planes Contador y Empresa están orientados a operación multiusuario, clientes o revisión profesional con mayor trazabilidad.",
      },
    ],
  },
];

export default function PreguntasPage() {
  return (
    <PublicShell activePath="/preguntas">
      <PublicHero
        eyebrow="Preguntas frecuentes"
        title="Respuestas claras antes de ordenar tu información crypto"
        description="Revisa dudas sobre tributación, conciliación, reportes, trazabilidad, planes y uso general de LEDGERA."
      >
        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <PublicButton href="/register">Comenzar ahora</PublicButton>
          <PublicButton href="/planes" variant="secondary">
            Ver planes
          </PublicButton>
        </div>
      </PublicHero>

      <section style={{ background: publicPalette.section }}>
        <PublicContainer style={{ maxWidth: "920px" }}>
          <div className="grid gap-10 py-16">
            {categories.map((category) => (
              <section key={category.label}>
                <div className="mb-5 flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ background: category.color }} />
                  <h2 className="m-0 text-xs font-black uppercase tracking-[0.22em]" style={{ color: category.color }}>
                    {category.label}
                  </h2>
                </div>

                <div className="grid gap-3">
                  {category.faqs.map((faq) => (
                    <details key={faq.q} className="group rounded-2xl border border-white/10 bg-white/[0.045] p-5">
                      <summary className="cursor-pointer list-none font-display text-lg font-black tracking-[-0.025em] text-white marker:hidden">
                        {faq.q}
                      </summary>
                      <p className="mt-4 text-sm leading-7 text-slate-300">{faq.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </PublicContainer>
      </section>

      <PublicCta
        title="¿Listo para revisar tus movimientos?"
        description="Crea tu cuenta y empieza a organizar información crypto, banco, portafolio y base tributaria con trazabilidad."
      />
    </PublicShell>
  );
}
