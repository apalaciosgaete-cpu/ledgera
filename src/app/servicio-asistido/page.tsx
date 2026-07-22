import type { Metadata } from "next";
import {
  PUBLIC_CONTACT_EMAIL,
  PublicButton,
  PublicCard,
  PublicContainer,
  PublicCta,
  PublicHero,
  PublicShell,
  publicPalette,
} from "@/components/public/PublicLayout";

const baseUrl = "https://ledgera.cl";
const title = "Servicio asistido para inconsistencias cripto";
const description =
  "Solicita una revisión separada cuando tus operaciones cripto presentan datos faltantes, transferencias sin contraparte, costos no determinados u otras inconsistencias que no puedes resolver por tu cuenta.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${baseUrl}/servicio-asistido`,
  },
  openGraph: {
    title: `${title} | LEDGERA`,
    description,
    url: `${baseUrl}/servicio-asistido`,
    siteName: "LEDGERA",
    locale: "es_CL",
    type: "website",
  },
};

const requestSubject = "Solicitud de evaluación · Servicio asistido LEDGERA";
const requestBody = [
  "Hola LEDGERA,",
  "",
  "Quiero solicitar una evaluación para el servicio asistido.",
  "",
  "Año tributario:",
  "Exchanges o fuentes utilizadas:",
  "Cantidad aproximada de movimientos:",
  "Inconsistencias que no pude resolver:",
  "¿Ya tengo una cuenta LEDGERA?:",
  "",
  "Nombre:",
  "Teléfono de contacto:",
].join("\n");

const requestHref = `mailto:${PUBLIC_CONTACT_EMAIL}?subject=${encodeURIComponent(requestSubject)}&body=${encodeURIComponent(requestBody)}`;

const assistedCases = [
  {
    title: "Transferencias sin contraparte",
    description:
      "Retiros o depósitos que no pueden vincularse con otra cuenta, wallet o exchange del mismo contribuyente.",
  },
  {
    title: "Costo tributario incompleto",
    description:
      "Activos vendidos o intercambiados cuyo origen, fecha de adquisición o costo no está suficientemente respaldado.",
  },
  {
    title: "Historial fragmentado",
    description:
      "Archivos de distintos períodos, operaciones manuales, fuentes duplicadas o movimientos que no coinciden entre sí.",
  },
  {
    title: "Operaciones que requieren criterio",
    description:
      "Movimientos que LEDGERA puede ordenar, pero cuya clasificación definitiva debe ser revisada según los antecedentes particulares.",
  },
];

const process = [
  {
    number: "01",
    title: "Diagnóstico del caso",
    description:
      "Revisamos el año tributario, las fuentes disponibles, el volumen de operaciones y las inconsistencias pendientes.",
  },
  {
    number: "02",
    title: "Alcance y cotización",
    description:
      "Definimos qué problemas se trabajarán, qué antecedentes faltan, el plazo estimado y el valor único del servicio.",
  },
  {
    number: "03",
    title: "Resolución asistida",
    description:
      "Un revisor trabaja sobre el expediente, documenta los ajustes y solicita información adicional cuando sea necesario.",
  },
  {
    number: "04",
    title: "Entrega trazable",
    description:
      "Recibes el expediente actualizado, el detalle de cambios y las observaciones que deben ser revisadas por tu contador.",
  },
];

const included = [
  "Revisión de inconsistencias detectadas por LEDGERA",
  "Solicitud estructurada de antecedentes faltantes",
  "Corrección o reclasificación documentada de movimientos",
  "Registro de cambios realizados sobre el expediente",
  "PDF y Excel actualizados cuando el caso queda resuelto",
  "Resumen de observaciones para entregar al contador",
];

const excluded = [
  "Presentación de declaraciones ante el SII",
  "Representación del contribuyente en fiscalizaciones",
  "Opiniones legales o tributarias vinculantes",
  "Reconstrucción basada en antecedentes que el usuario no puede aportar",
  "Garantía de aceptación de un criterio por parte de la autoridad",
];

export default function ServicioAsistidoPage() {
  return (
    <PublicShell activePath="/servicio-asistido">
      <PublicHero
        eyebrow="Contratación separada"
        title="Cuando el software detecta el problema, pero necesitas ayuda para resolverlo"
        description="El servicio asistido complementa tu plan LEDGERA. Se contrata por caso, tiene un alcance definido y está pensado para inconsistencias que requieren revisión humana y antecedentes adicionales."
      >
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <PublicButton href={requestHref}>Solicitar evaluación</PublicButton>
          <PublicButton href="/planes" variant="secondary">Revisar planes</PublicButton>
        </div>
      </PublicHero>

      <section style={{ background: publicPalette.section, padding: "68px 0" }}>
        <PublicContainer>
          <div style={{ maxWidth: 820, marginBottom: 34 }}>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-accent">Cuándo corresponde</p>
            <h2 className="mt-4 font-display text-3xl font-black tracking-[-0.045em] text-text md:text-5xl">
              No reemplaza el plan: interviene cuando el expediente queda bloqueado
            </h2>
            <p className="mt-5 text-base leading-8 text-text-soft">
              Personal y Profesional entregan las herramientas para importar, revisar y generar respaldo. El servicio asistido se activa únicamente cuando el usuario no puede resolver por sí mismo las diferencias pendientes.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {assistedCases.map((item) => (
              <PublicCard key={item.title}>
                <h3 className="font-display text-xl font-black tracking-[-0.03em] text-text">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-text-soft">{item.description}</p>
              </PublicCard>
            ))}
          </div>
        </PublicContainer>
      </section>

      <section style={{ background: publicPalette.page, padding: "68px 0" }}>
        <PublicContainer>
          <div style={{ maxWidth: 820, marginBottom: 38 }}>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-accent">Flujo de contratación</p>
            <h2 className="mt-4 font-display text-3xl font-black tracking-[-0.045em] text-text md:text-5xl">
              Un servicio con alcance, precio y entrega definidos antes de comenzar
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {process.map((step) => (
              <PublicCard key={step.number} style={{ height: "100%" }}>
                <p className="font-mono text-sm font-black text-accent">{step.number}</p>
                <h3 className="mt-5 font-display text-xl font-black tracking-[-0.03em] text-text">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-text-soft">{step.description}</p>
              </PublicCard>
            ))}
          </div>
        </PublicContainer>
      </section>

      <section style={{ background: publicPalette.section, padding: "68px 0" }}>
        <PublicContainer>
          <div className="grid gap-5 lg:grid-cols-2">
            <PublicCard>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Incluye</p>
              <h2 className="mt-4 font-display text-3xl font-black tracking-[-0.04em] text-text">Trabajo verificable sobre el expediente</h2>
              <ul className="mt-6 grid gap-3 p-0">
                {included.map((item) => (
                  <li key={item} className="flex list-none items-start gap-3 text-sm leading-7 text-text-soft">
                    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent text-xs font-black text-accent">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </PublicCard>

            <PublicCard>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-text-faint">No incluye</p>
              <h2 className="mt-4 font-display text-3xl font-black tracking-[-0.04em] text-text">Límites claros del servicio</h2>
              <ul className="mt-6 grid gap-3 p-0">
                {excluded.map((item) => (
                  <li key={item} className="flex list-none items-start gap-3 text-sm leading-7 text-text-soft">
                    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border-strong text-xs font-black text-text-faint">–</span>
                    {item}
                  </li>
                ))}
              </ul>
            </PublicCard>
          </div>
        </PublicContainer>
      </section>

      <section style={{ background: publicPalette.page, padding: "68px 0" }}>
        <PublicContainer style={{ maxWidth: 900 }}>
          <PublicCard style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Condición comercial</p>
            <h2 className="mt-4 font-display text-3xl font-black tracking-[-0.04em] text-text">
              El diagnóstico inicial define si el caso puede ser atendido
            </h2>
            <p className="mt-5 text-base leading-8 text-text-soft">
              La evaluación inicial no obliga a contratar. Cuando el caso es viable, LEDGERA entrega una cotización única según volumen, cantidad de fuentes, antigüedad del historial y complejidad de las inconsistencias. El trabajo comienza solo después de aceptar el alcance y el valor.
            </p>
            <p className="mt-4 text-sm font-bold leading-7 text-text-faint">
              Este servicio no está incluido en las mensualidades Personal o Profesional y no se cobra automáticamente.
            </p>
          </PublicCard>
        </PublicContainer>
      </section>

      <PublicCta
        title="Solicita una evaluación antes de seguir corrigiendo a ciegas"
        description="Describe las fuentes, el año tributario y las inconsistencias pendientes. LEDGERA confirmará si el caso puede resolverse mediante el servicio asistido."
        primaryLabel="Solicitar evaluación"
        primaryHref={requestHref}
        secondaryLabel="Comenzar análisis"
        secondaryHref="/register"
      />
    </PublicShell>
  );
}
