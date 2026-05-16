"use client";

import React, { useEffect, useState } from "react";

type TaxHealthStatus = "OK" | "REVIEW" | "RISK";
type PeriodStatus = "OPEN" | "CLOSED" | "REOPENED";
type Section = "resumen" | "eventos" | "reportes" | "declaraciones";

type TaxEvent = {
  id: string;
  movementId: string;
  eventType: string;
  symbol: string;
  executedAt: string;
  quantity: number;
  effectiveTaxCategory: string;
  averageCostUsdAtSale: number;
  proceedsGrossUsd: number;
  proceedsNetUsd: number;
  costBasisUsd: number;
  feeUsd: number;
  realizedPnlUsd: number;
  usdClp: number;
  realizedPnlClp: number;
};

type TaxTotals = {
  totalEvents: number;
  totalQuantity: number;
  totalPnlUsd: number;
  totalPnlClp: number;
  totalProceedsGrossUsd: number;
  totalProceedsNetUsd: number;
  totalCostBasisUsd: number;
  totalFeeUsd: number;
};

type TaxCategory = {
  normalizedTaxType: "CAPITAL" | "ORDINARY" | "NON_TAXABLE" | "PENDING";
  label: string;
  count: number;
  totalPnlUsd: number;
  totalPnlClp: number;
  totalProceedsNetUsd: number;
  totalCostBasisUsd: number;
  totalFeeUsd: number;
};

type TaxHealth = {
  status: TaxHealthStatus;
  score: number;
  issues: { type: string; count: number; message: string }[];
  blocked: boolean;
  blockReason?: string;
};

type PeriodData = {
  year: number;
  status: PeriodStatus;
  isClosed: boolean;
  closedAt: string | null;
  reopenedAt: string | null;
  closedReason: string | null;
};

type TributarioData = {
  events: TaxEvent[];
  totals: TaxTotals;
  taxSummary: {
    totalEvents: number;
    categories: TaxCategory[];
  };
  taxHealth: TaxHealth;
  period: PeriodData;
};

type ReporteItem = {
  key: string;
  title: string;
  description: string;
  href: string;
  color: string;
  blockedWhen: "never" | "pending" | "noEvents";
};

const currentYear = new Date().getFullYear();

const REPORTES: ReporteItem[] = [
  {
    key: "csv-informativo",
    title: "CSV Borrador informativo",
    description:
      "Resumen tributario del período para revisión personal. Incluye PnL, categorías y detalle de eventos.",
    href: "/api/tax/events/export-informative",
    color: "#0F2A3D",
    blockedWhen: "noEvents",
  },
  {
    key: "csv-contador",
    title: "CSV para contador",
    description:
      "Reporte formal para entrega a contador. Requiere clasificación definitiva.",
    href: "/api/tax/events/export-strict",
    color: "#16A34A",
    blockedWhen: "pending",
  },
  {
    key: "pdf-informativo",
    title: "PDF Borrador informativo",
    description:
      "Versión PDF del borrador informativo con detalle de eventos y resumen por período.",
    href: "/api/tax/reports/pdf-informative",
    color: "#0F2A3D",
    blockedWhen: "noEvents",
  },
  {
    key: "pdf-estricto",
    title: "PDF verificable (contador / SII)",
    description:
      "Reporte formal con hash SHA256 y QR de verificación pública. Requiere clasificación completa.",
    href: "/api/tax/reports/pdf-strict",
    color: "#16A34A",
    blockedWhen: "pending",
  },
];

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatClp(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatNumber(value: number, decimals = 8) {
  return new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: decimals,
  }).format(value);
}

function pnlColor(value: number) {
  if (value > 0) return "#16A34A";
  if (value < 0) return "#DC2626";
  return "#64748B";
}

function statusColor(status: TaxHealthStatus) {
  if (status === "OK") return "#16A34A";
  if (status === "REVIEW") return "#D97706";
  return "#DC2626";
}

function periodLabel(status: PeriodStatus) {
  if (status === "OPEN") return "Período abierto";
  if (status === "CLOSED") return "Período cerrado";
  return "Período reabierto";
}

function sectionLabel(section: Section) {
  if (section === "resumen") return "Resumen";
  if (section === "eventos") return "Eventos";
  if (section === "reportes") return "Reportes";
  return "Declaraciones";
}

function Card({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        background: muted ? "#F8FAFC" : "#ffffff",
        border: "1px solid #E2E8F0",
        borderRadius: "12px",
        padding: "1.25rem 1.5rem",
      }}
    >
      {children}
    </div>
  );
}

function ReportesSection({
  year,
  hasEvents,
  hasPending,
  blocked,
}: {
  year: number;
  hasEvents: boolean;
  hasPending: boolean;
  blocked: boolean;
}) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function isBlocked(reporte: ReporteItem) {
    if (blocked) {
      return {
        blocked: true,
        reason: "Operaciones bloqueadas por inconsistencias tributarias.",
      };
    }

    if (reporte.blockedWhen === "noEvents" && !hasEvents) {
      return {
        blocked: true,
        reason: `Sin eventos tributarios para ${year}.`,
      };
    }

    if (reporte.blockedWhen === "pending" && hasPending) {
      return {
        blocked: true,
        reason: "Requiere clasificación definitiva de todos los eventos.",
      };
    }

    return { blocked: false, reason: "" };
  }

  async function handleDownload(reporte: ReporteItem) {
    setErrorKey(null);
    setErrorMsg(null);
    setLoadingKey(reporte.key);

    try {
      const response = await fetch(`${reporte.href}?year=${year}`);

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        setErrorKey(reporte.key);
        setErrorMsg(json?.message ?? "Error al generar el reporte.");
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? `ledgera-reporte-${year}`;
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();

      URL.revokeObjectURL(url);
    } catch {
      setErrorKey(reporte.key);
      setErrorMsg("Error de conexión al generar el reporte.");
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {REPORTES.map((reporte) => {
        const blockedState = isBlocked(reporte);
        const loading = loadingKey === reporte.key;
        const hasError = errorKey === reporte.key;

        return (
          <Card key={reporte.key}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: "220px" }}>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontWeight: 700,
                    color: blockedState.blocked ? "#94A3B8" : "#0F2A3D",
                  }}
                >
                  {reporte.title}
                </p>

                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8125rem",
                    color: "#64748B",
                  }}
                >
                  {reporte.description}
                </p>

                {blockedState.blocked && (
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: "0.75rem",
                      color: "#D97706",
                      fontWeight: 600,
                    }}
                  >
                    {blockedState.reason}
                  </p>
                )}

                {hasError && errorMsg && (
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: "0.75rem",
                      color: "#DC2626",
                    }}
                  >
                    {errorMsg}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleDownload(reporte)}
                disabled={blockedState.blocked || loading}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "8px",
                  border: "none",
                  background: blockedState.blocked
                    ? "#F1F5F9"
                    : loading
                      ? "#94A3B8"
                      : reporte.color,
                  color: blockedState.blocked ? "#94A3B8" : "#ffffff",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor:
                    blockedState.blocked || loading ? "not-allowed" : "pointer",
                  height: "38px",
                }}
              >
                {loading ? "Generando..." : `Descargar ${year}`}
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function DeclaracionesSection({ year }: { year: number }) {
  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "260px" }}>
          <p
            style={{
              margin: "0 0 6px",
              fontWeight: 700,
              fontSize: "1rem",
              color: "#0F2A3D",
            }}
          >
            Declaraciones Juradas
          </p>

          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              color: "#64748B",
              lineHeight: 1.6,
            }}
          >
            Gestiona borradores DDJJ tributarios, validación hash, estados
            internos y exportación CSV auditable para el período {year}.
          </p>

          <div
            style={{
              marginTop: "12px",
              display: "grid",
              gap: "6px",
              fontSize: "0.75rem",
              color: "#16A34A",
              fontWeight: 600,
            }}
          >
            <span>✓ Generación de borradores DDJJ</span>
            <span>✓ Confirmación, revisión y anulación</span>
            <span>✓ Verificación hash SHA256</span>
            <span>✓ Exportación CSV auditable</span>
          </div>
        </div>

        <a
          href="/tax/declarations"
          style={{
            padding: "0.65rem 1.25rem",
            borderRadius: "8px",
            background: "#0F2A3D",
            color: "#ffffff",
            fontSize: "0.875rem",
            fontWeight: 600,
            textDecoration: "none",
            whiteSpace: "nowrap",
            height: "40px",
          }}
        >
          Abrir módulo DDJJ
        </a>
      </div>
    </Card>
  );
}

export default function TributarioPage() {
  const [year, setYear] = useState(currentYear);
  const [section, setSection] = useState<Section>("resumen");
  const [data, setData] = useState<TributarioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);

      try {
        const [eventsRes, periodRes, healthRes] = await Promise.all([
          fetch(`/api/tax/events?year=${year}`),
          fetch(`/api/tax/periods/status?year=${year}`),
          fetch("/api/tax/health"),
        ]);

        if (!eventsRes.ok || !periodRes.ok) {
          throw new Error("Error al conectar con el motor tributario.");
        }

        const eventsJson = await eventsRes.json();
        const periodJson = await periodRes.json();
        const healthJson = await healthRes.json();

        if (!eventsJson.ok || !periodJson.ok) {
          throw new Error(
            eventsJson.message ??
              periodJson.message ??
              "Respuesta tributaria inválida.",
          );
        }

        setData({
          events: eventsJson.data.events,
          totals: eventsJson.data.totals,
          taxSummary: eventsJson.data.taxSummary,
          taxHealth: {
            ...eventsJson.data.taxHealth,
            blocked: healthJson.ok ? healthJson.data.blocked : false,
            blockReason: healthJson.ok ? healthJson.data.blockReason : undefined,
          },
          period: periodJson.data,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado.");
      } finally {
        setLoading(false);
      }
    }

    void fetchAll();
  }, [year]);

  if (loading) {
    return (
      <>
        <style>
          {`@keyframes ledgera-spin { to { transform: rotate(360deg); } }`}
        </style>

        <div
          style={{
            height: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              border: "2px solid rgba(15,42,61,0.12)",
              borderTopColor: "#0F2A3D",
              borderRadius: "50%",
              animation: "ledgera-spin 0.75s linear infinite",
            }}
          />
          <p style={{ color: "#94A3B8", fontSize: "0.875rem", margin: 0 }}>
            Cargando módulo tributario...
          </p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <Card muted>
          <p style={{ color: "#DC2626", fontWeight: 700, margin: "0 0 4px" }}>
            Error al cargar Tributario
          </p>
          <p style={{ color: "#64748B", margin: 0 }}>{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { events, totals, taxSummary, taxHealth, period } = data;
  const healthColor = statusColor(taxHealth.status);

  return (
    <div
      style={{
        maxWidth: "1100px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.375rem",
              fontWeight: 700,
              color: "#0F2A3D",
              margin: "0 0 4px",
            }}
          >
            Tributario
          </h1>
          <p style={{ color: "#94A3B8", margin: 0, fontSize: "0.875rem" }}>
            Análisis tributario de tus operaciones cripto.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {[currentYear - 1, currentYear].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setYear(item)}
              style={{
                padding: "6px 16px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: year === item ? "#0F2A3D" : "rgba(15,42,61,0.15)",
                background: year === item ? "#0F2A3D" : "transparent",
                color: year === item ? "#ffffff" : "#64748B",
                fontWeight: year === item ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {taxHealth.blocked && (
        <div
          style={{
            background: "rgba(220,38,38,0.06)",
            border: "1px solid rgba(220,38,38,0.25)",
            borderRadius: "12px",
            padding: "1rem 1.25rem",
            marginBottom: "1.25rem",
          }}
        >
          <p style={{ margin: "0 0 4px", color: "#DC2626", fontWeight: 700 }}>
            Operaciones bloqueadas
          </p>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.8125rem" }}>
            {taxHealth.blockReason ??
              "Existen inconsistencias tributarias que deben resolverse."}
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "10px",
          marginBottom: "1.25rem",
        }}
      >
        <Card muted>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.75rem" }}>
            Estado del período
          </p>
          <p style={{ margin: "4px 0 0", fontWeight: 700, color: "#0F2A3D" }}>
            {periodLabel(period.status)}
          </p>
          <p style={{ margin: "4px 0 0", color: "#94A3B8", fontSize: "0.75rem" }}>
            Período {year}
            {period.closedAt ? ` — cerrado ${formatDate(period.closedAt)}` : ""}
          </p>
        </Card>

        <Card muted>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.75rem" }}>
            Salud tributaria
          </p>
          <p style={{ margin: "4px 0 0", fontWeight: 700, color: healthColor }}>
            {taxHealth.status}
          </p>
          <p style={{ margin: "4px 0 0", color: "#94A3B8", fontSize: "0.75rem" }}>
            Score {taxHealth.score}/100
          </p>
        </Card>
      </div>

      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "1.5rem",
          borderBottom: "1px solid #E2E8F0",
          flexWrap: "wrap",
        }}
      >
        {(["resumen", "eventos", "reportes", "declaraciones"] as Section[]).map(
          (item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSection(item)}
              style={{
                padding: "8px 18px",
                borderRadius: "8px 8px 0 0",
                border: "none",
                borderBottom:
                  section === item
                    ? "2px solid #0F2A3D"
                    : "2px solid transparent",
                background: "transparent",
                color: section === item ? "#0F2A3D" : "#94A3B8",
                fontWeight: section === item ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {sectionLabel(item)}
            </button>
          ),
        )}
      </div>

      {section === "resumen" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "10px",
            }}
          >
            {[
              { label: "Eventos totales", value: String(totals.totalEvents) },
              { label: "PnL realizado USD", value: formatUsd(totals.totalPnlUsd) },
              { label: "PnL realizado CLP", value: formatClp(totals.totalPnlClp) },
              {
                label: "Ingresos netos USD",
                value: formatUsd(totals.totalProceedsNetUsd),
              },
              { label: "Costo base USD", value: formatUsd(totals.totalCostBasisUsd) },
            ].map((item) => (
              <Card key={item.label} muted>
                <p
                  style={{
                    margin: "0 0 6px",
                    color: "#64748B",
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "#0F2A3D",
                    fontSize: "1.25rem",
                    fontWeight: 700,
                  }}
                >
                  {item.value}
                </p>
              </Card>
            ))}
          </div>

          <Card>
            <p
              style={{
                margin: "0 0 0.75rem",
                color: "#0F2A3D",
                fontWeight: 700,
              }}
            >
              Distribución por categoría
            </p>

            {taxSummary.categories.length === 0 ? (
              <p style={{ margin: 0, color: "#94A3B8" }}>
                Sin eventos tributarios para el período {year}.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "8px" }}>
                {taxSummary.categories.map((cat) => (
                  <div
                    key={cat.normalizedTaxType}
                    style={{
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      padding: "1rem",
                    }}
                  >
                    <p style={{ margin: 0, color: "#0F2A3D", fontWeight: 700 }}>
                      {cat.label}
                    </p>
                    <p style={{ margin: "4px 0 0", color: "#64748B" }}>
                      {cat.count} evento{cat.count !== 1 ? "s" : ""} —{" "}
                      {formatUsd(cat.totalPnlUsd)} / {formatClp(cat.totalPnlClp)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {section === "eventos" && (
        <Card>
          {events.length === 0 ? (
            <p style={{ margin: 0, color: "#94A3B8" }}>
              Sin eventos tributarios para {year}.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.875rem",
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Fecha",
                      "Símbolo",
                      "Cantidad",
                      "Ingreso neto USD",
                      "Costo base USD",
                      "PnL USD",
                      "PnL CLP",
                      "Categoría",
                    ].map((col) => (
                      <th
                        key={col}
                        style={{
                          textAlign: "left",
                          padding: "0.625rem",
                          color: "#94A3B8",
                          borderBottom: "1px solid #E2E8F0",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "0.625rem", whiteSpace: "nowrap" }}>
                        {formatDate(event.executedAt)}
                      </td>
                      <td style={{ padding: "0.625rem", fontWeight: 700 }}>
                        {event.symbol}
                      </td>
                      <td style={{ padding: "0.625rem" }}>
                        {formatNumber(event.quantity)}
                      </td>
                      <td style={{ padding: "0.625rem" }}>
                        {formatUsd(event.proceedsNetUsd)}
                      </td>
                      <td style={{ padding: "0.625rem" }}>
                        {formatUsd(event.costBasisUsd)}
                      </td>
                      <td
                        style={{
                          padding: "0.625rem",
                          color: pnlColor(event.realizedPnlUsd),
                          fontWeight: 700,
                        }}
                      >
                        {formatUsd(event.realizedPnlUsd)}
                      </td>
                      <td
                        style={{
                          padding: "0.625rem",
                          color: pnlColor(event.realizedPnlClp),
                          fontWeight: 700,
                        }}
                      >
                        {formatClp(event.realizedPnlClp)}
                      </td>
                      <td style={{ padding: "0.625rem" }}>
                        {event.effectiveTaxCategory}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {section === "reportes" && (
        <ReportesSection
          year={year}
          hasEvents={events.length > 0}
          hasPending={taxHealth.status === "RISK"}
          blocked={taxHealth.blocked}
        />
      )}

      {section === "declaraciones" && <DeclaracionesSection year={year} />}
    </div>
  );
}