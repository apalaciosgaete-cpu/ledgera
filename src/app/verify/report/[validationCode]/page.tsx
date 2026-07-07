// src/app/verify/report/[validationCode]/page.tsx
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { prisma } from "@/lib/prisma";

interface ReportValidationData {
  hash: string;
  type: string;
  typeLabel: string;
  isValid: boolean;
  issuedAt: Date;
  issuedAtLabel: string;
  year: number;
  symbol: string | null;
  revokedAt: Date | null;
}

function getReportTypeLabel(type: string): string {
  switch (type) {
    case "STRICT_TAX_REPORT":
      return "Reporte tributario para contador";
    case "INFORMATIVE_TAX_REPORT":
      return "Borrador informativo tributario";
    case "STRICT_TAX_CSV":
      return "Reporte contador CSV";
    case "INFORMATIVE_TAX_CSV":
      return "Borrador informativo CSV";
    case "AUDIT_TRAIL_PDF":
      return "Trazabilidad de auditoría (PDF)";
    case "AUDIT_TRAIL_CSV":
      return "Trazabilidad de auditoría (CSV)";
    default:
      return "Reporte LEDGERA";
  }
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

async function fetchValidation(code: string): Promise<ReportValidationData | null> {
  try {
    const report = await prisma.reportValidation.findUnique({
      where: { hash: code },
    });

    if (!report) return null;

    return {
      hash: report.hash,
      type: report.type,
      typeLabel: getReportTypeLabel(report.type),
      isValid: !report.revokedAt,
      issuedAt: report.issuedAt,
      issuedAtLabel: formatDateTime(report.issuedAt),
      year: report.year,
      symbol: report.symbol,
      revokedAt: report.revokedAt,
    };
  } catch {
    return null;
  }
}

function DetailCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-elev p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-text-faint">{label}</p>
      <div className="mt-2 text-sm font-semibold leading-6 text-text">{children}</div>
    </div>
  );
}

export default async function VerifyReportPage({
  params,
}: {
  params: Promise<{ validationCode: string }>;
}) {
  const { validationCode } = await params;

  if (!validationCode || validationCode.length < 16) notFound();

  const data = await fetchValidation(validationCode);
  const isValid = data?.isValid ?? false;
  const statusText = !data ? "Documento no encontrado" : isValid ? "Documento válido" : "Documento revocado";
  const statusClass = isValid
    ? "border-accent bg-accent-soft text-gain"
    : "border-loss bg-[rgba(253,164,175,0.14)] text-loss";
  const statusIcon = isValid ? "✓" : "✕";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_34%),linear-gradient(135deg,var(--bg-sunken),var(--bg),var(--bg-elev))] px-6 py-12 text-text">
      <section className="mx-auto w-full max-w-3xl">
        <header className="mb-10 flex flex-col items-center text-center">
          <Logo variant="light" size="lg" showSubtitle />
          <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-accent">Verificación de documentos</p>
          <h1 className="mt-4 font-display text-4xl font-black tracking-[-0.055em] text-text sm:text-5xl">
            Respaldo verificable LEDGERA
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-text-soft">
            Consulta pública para confirmar si un documento fue emitido por LEDGERA y si su registro sigue vigente.
          </p>
        </header>

        <div className={`rounded-3xl border p-6 shadow-[var(--shadow-md)] ${statusClass}`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-current bg-bg-sunken text-2xl font-black">
              {statusIcon}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em]">Estado del documento</p>
              <h2 className="mt-2 font-display text-2xl font-black tracking-[-0.035em] text-text">{statusText}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-text-soft">
                {!data
                  ? "El código no corresponde a ningún documento emitido por LEDGERA."
                  : isValid
                    ? "Este documento fue emitido por LEDGERA y su registro está vigente."
                    : "Este documento fue emitido por LEDGERA, pero su registro está revocado."}
              </p>
            </div>
          </div>
        </div>

        {data ? (
          <div className="mt-6 grid gap-4">
            <DetailCard label="Tipo de reporte">{data.typeLabel}</DetailCard>
            <DetailCard label="Período tributario">{data.year}</DetailCard>
            {data.symbol ? <DetailCard label="Activo">{data.symbol}</DetailCard> : null}
            <DetailCard label="Fecha de emisión">{data.issuedAtLabel}</DetailCard>
            {data.revokedAt ? <DetailCard label="Fecha de revocación">{formatDateTime(data.revokedAt)}</DetailCard> : null}
            <DetailCard label="Hash de verificación">
              <code className="break-all font-mono text-xs text-accent">{data.hash}</code>
            </DetailCard>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-border bg-bg-elev p-8 text-center">
            <p className="text-3xl" aria-hidden="true">⌕</p>
            <p className="mt-3 font-display text-xl font-black text-text">Documento no encontrado</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-text-soft">
              Verifica que el código fue copiado correctamente desde el documento original.
            </p>
          </div>
        )}

        <footer className="mt-10 text-center text-xs font-semibold leading-6 text-text-faint">
          Verificación de documentos — LEDGERA · Respaldo tributario para activos digitales.
        </footer>
      </section>
    </main>
  );
}
