import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type ValidationData = {
  validationCode: string;
  contentHash:    string;
  reportType:     string;
  createdAt:      Date;
  metadata:       Record<string, unknown> | null;
};

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    year:   "numeric",
    month:  "2-digit",
    day:    "2-digit",
    hour:   "2-digit",
    minute: "2-digit",
  }).format(value);
}

function reportTypeLabel(type: string): string {
  if (type === "BANK_RECONCILIATION") return "Conciliación financiera banco ↔ Binance";
  return type;
}

async function fetchValidation(code: string): Promise<ValidationData | null> {
  try {
    const record = await prisma.bankReconciliationReportValidation.findUnique({
      where: { validationCode: code.toUpperCase() },
    });
    if (!record) return null;
    return {
      validationCode: record.validationCode,
      contentHash:    record.contentHash,
      reportType:     record.reportType,
      createdAt:      record.createdAt,
      metadata:       record.metadata
        ? (JSON.parse(record.metadata) as Record<string, unknown>)
        : null,
    };
  } catch {
    return null;
  }
}

export default async function VerifyBankReconciliationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!code) notFound();

  const data = await fetchValidation(code);

  const isValid      = data !== null;
  const statusColor  = isValid ? "#16A34A" : "#EF4444";
  const statusBg     = isValid ? "#F0FDF4" : "#FEF2F2";
  const statusBorder = isValid ? "#BBF7D0" : "#FECACA";
  const statusIcon   = isValid ? "✓" : "✗";
  const statusText   = isValid ? "Documento válido" : "Documento no encontrado";
  const statusSub    = isValid
    ? "Este reporte fue emitido por LEDGERA y su integridad es verificable."
    : "El código no corresponde a ningún reporte de conciliación emitido por LEDGERA.";

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Verificación de conciliación — LEDGERA</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F6F8FA; color: #0F172A; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 40px 16px; }
          .container { width: 100%; max-width: 560px; }
          .header { text-align: center; margin-bottom: 32px; }
          .logo { font-size: 1.25rem; font-weight: 800; color: #0F2A3D; letter-spacing: -0.02em; }
          .logo span { color: #F59E0B; }
          .subtitle { font-size: 0.75rem; color: #94A3B8; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 4px; }
          .status-card { border-radius: 14px; padding: 24px; border: 1.5px solid ${statusBorder}; background: ${statusBg}; margin-bottom: 20px; display: flex; align-items: center; gap: 16px; }
          .status-icon { width: 44px; height: 44px; border-radius: 50%; background: ${statusColor}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 700; flex-shrink: 0; }
          .status-title { font-size: 1.05rem; font-weight: 700; color: ${statusColor}; }
          .status-sub { font-size: 0.8rem; color: #64748B; margin-top: 3px; }
          .section-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px 20px; margin-bottom: 12px; }
          .field-label { font-size: 0.7rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
          .field-value { font-size: 0.9rem; color: #0F172A; font-weight: 500; }
          .mono { font-family: 'Courier New', monospace; font-size: 0.78rem; word-break: break-all; color: #475569; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
          .meta-item { background: #F8FAFC; border-radius: 6px; padding: 8px 12px; }
          .meta-label { font-size: 0.65rem; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; }
          .meta-value { font-size: 1rem; font-weight: 700; color: #0F2A3D; margin-top: 2px; }
          .footer { text-align: center; font-size: 0.72rem; color: #94A3B8; margin-top: 32px; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <div className="logo">LEDGERA <span>·</span></div>
            <div className="subtitle">Verificación de conciliación financiera</div>
          </div>

          <div className="status-card">
            <div className="status-icon">{statusIcon}</div>
            <div>
              <div className="status-title">{statusText}</div>
              <div className="status-sub">{statusSub}</div>
            </div>
          </div>

          {data && (
            <>
              <div className="section-card">
                <div className="field-label">Tipo de reporte</div>
                <div className="field-value">{reportTypeLabel(data.reportType)}</div>
              </div>

              <div className="section-card">
                <div className="field-label">Código de verificación</div>
                <div className="field-value mono">{data.validationCode}</div>
              </div>

              <div className="section-card">
                <div className="field-label">Fecha de emisión</div>
                <div className="field-value">{formatDateTime(data.createdAt)}</div>
              </div>

              <div className="section-card">
                <div className="field-label">Hash SHA-256</div>
                <div className="field-value mono">{data.contentHash}</div>
              </div>

              {data.metadata && (
                <div className="section-card">
                  <div className="field-label">Resumen del reporte</div>
                  <div className="meta-grid">
                    {(["total", "matched", "pending", "ignored", "review"] as const).map(key => {
                      const val = data.metadata?.[key];
                      if (val === undefined) return null;
                      const labels: Record<string, string> = {
                        total:   "Total banco",
                        matched: "Conciliados",
                        pending: "Pendientes",
                        ignored: "Ignorados",
                        review:  "En revisión",
                      };
                      return (
                        <div key={key} className="meta-item">
                          <div className="meta-label">{labels[key]}</div>
                          <div className="meta-value">{String(val)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="footer">
            Generado por LEDGERA · ledgera.cl<br />
            Este código verifica la autenticidad e integridad del reporte.
          </div>
        </div>
      </body>
    </html>
  );
}
