// src/app/verify/report/[validationCode]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface ReportValidationData {
  hash:       string;
  type:       string;
  typeLabel:  string;
  isValid:    boolean;
  issuedAt:   Date;
  issuedAtLabel: string;
  year:       number;
  symbol:     string | null;
  revokedAt:  Date | null;
}

function getReportTypeLabel(type: string): string {
  switch (type) {
    case "STRICT_TAX_REPORT":      return "Reporte tributario para contador";
    case "INFORMATIVE_TAX_REPORT": return "Borrador informativo tributario";
    case "STRICT_TAX_CSV":         return "Reporte contador CSV";
    case "INFORMATIVE_TAX_CSV":    return "Borrador informativo CSV";
    case "AUDIT_TRAIL_PDF":        return "Trazabilidad de auditoría (PDF)";
    case "AUDIT_TRAIL_CSV":        return "Trazabilidad de auditoría (CSV)";
    default:                       return "Reporte LEDGERA";
  }
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    year:   "numeric",
    month:  "2-digit",
    day:    "2-digit",
    hour:   "2-digit",
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
      hash:         report.hash,
      type:         report.type,
      typeLabel:    getReportTypeLabel(report.type),
      isValid:      !report.revokedAt,
      issuedAt:     report.issuedAt,
      issuedAtLabel: formatDateTime(report.issuedAt),
      year:         report.year,
      symbol:       report.symbol,
      revokedAt:    report.revokedAt,
    };
  } catch {
    return null;
  }
}

export default async function VerifyReportPage({
  params,
}: {
  params: Promise<{ validationCode: string }>;
}) {
  const { validationCode } = await params;

  if (!validationCode || validationCode.length < 16) notFound();

  const data = await fetchValidation(validationCode);

  const isValid      = data?.isValid ?? false;
  const statusColor  = isValid ? "#3FA687" : "#C4634A";
  const statusBg     = isValid ? "#1D2C27" : "rgba(196,99,74,0.14)";
  const statusBorder = isValid ? "#1D2C27" : "var(--loss)";
  const statusIcon   = isValid ? "✓" : "✗";
  const statusText   = !data
    ? "Documento no encontrado"
    : isValid ? "Documento válido" : "Documento revocado";

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Verificación de documento — LEDGERA</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg-sunken); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 40px 16px; }
          .container { width: 100%; max-width: 560px; }
          .header { text-align: center; margin-bottom: 32px; }
          .logo { font-size: 1.25rem; font-weight: 800; color: var(--text); letter-spacing: -0.02em; }
          .logo span { color: var(--warn); }
          .subtitle { font-size: 0.75rem; color: var(--text-soft); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 4px; }
          .status-card { border-radius: 14px; padding: 24px; border: 1.5px solid ${statusBorder}; background: ${statusBg}; margin-bottom: 20px; display: flex; align-items: center; gap: 16px; }
          .status-icon { width: 44px; height: 44px; border-radius: 50%; background: ${statusColor}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 700; flex-shrink: 0; }
          .status-title { font-size: 1.05rem; font-weight: 700; color: ${statusColor}; }
          .status-sub { font-size: 0.8rem; color: var(--text-soft); margin-top: 3px; }
          .section-card { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 16px 20px; margin-bottom: 12px; }
          .field-label { font-size: 0.7rem; font-weight: 700; color: var(--text-soft); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
          .field-value { font-size: 0.9rem; color: var(--text); font-weight: 500; }
          .mono { font-family: 'Courier New', monospace; font-size: 0.78rem; word-break: break-all; color: var(--text); }
          .not-found-card { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 40px 24px; text-align: center; }
          .footer { text-align: center; font-size: 0.72rem; color: var(--text-soft); margin-top: 32px; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <div className="logo">LEDGERA <span>·</span></div>
            <div className="subtitle">Verificación de documentos</div>
          </div>

          <div className="status-card">
            <div className="status-icon">{statusIcon}</div>
            <div>
              <div className="status-title">{statusText}</div>
              <div className="status-sub">
                {!data ? "El código no corresponde a ningún documento emitido por LEDGERA." :
                 isValid ? "Este documento fue emitido y es válido." :
                 "Este documento fue emitido pero está revocado."}
              </div>
            </div>
          </div>

          {data && (
            <>
              <div className="section-card">
                <div className="field-label">Tipo de reporte</div>
                <div className="field-value">{data.typeLabel}</div>
              </div>
              <div className="section-card">
                <div className="field-label">Período tributario</div>
                <div className="field-value">{data.year}</div>
              </div>
              {data.symbol && (
                <div className="section-card">
                  <div className="field-label">Activo</div>
                  <div className="field-value">{data.symbol}</div>
                </div>
              )}
              <div className="section-card">
                <div className="field-label">Fecha de emisión</div>
                <div className="field-value">{data.issuedAtLabel}</div>
              </div>
              {data.revokedAt && (
                <div className="section-card">
                  <div className="field-label">Fecha de revocación</div>
                  <div className="field-value">{formatDateTime(data.revokedAt)}</div>
                </div>
              )}
              <div className="section-card">
                <div className="field-label">Hash de verificación</div>
                <div className="field-value mono">{data.hash}</div>
              </div>
            </>
          )}

          {!data && (
            <div className="not-found-card">
              <p style={{ fontSize: "2rem", marginBottom: "12px" }}>🔍</p>
              <p style={{ fontWeight: 600, marginBottom: "6px" }}>Documento no encontrado</p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-soft)" }}>
                Verifica que el código fue copiado correctamente desde el documento original.
              </p>
            </div>
          )}
        </div>
        <div className="footer">
          Verificación de documentos — LEDGERA · Sistema de cumplimiento tributario cripto
        </div>
      </body>
    </html>
  );
}