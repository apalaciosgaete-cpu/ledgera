"use client";

import { useEffect, useState } from "react";
import { Feature } from "@/modules/subscription/domain/planFeatures";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { UpgradeCard } from "@/components/subscription/UpgradeCard";

type ReportResult = {
  validationCode?: string;
  verificationUrl?: string;
  hash?: string;
};

type ReportItem = {
  key: string;
  title: string;
  description: string;
  feature: Feature;
  formats: {
    label: string;
    href: string;
    mode: "link" | "fetch";
  }[];
};

function buttonStyle(kind: "primary" | "secondary" = "primary"): React.CSSProperties {
  return {
    background: kind === "primary" ? "#0F766E" : "#FFFFFF",
    border: kind === "primary" ? "1px solid #0F766E" : "1px solid #CBD5E1",
    borderRadius: 8,
    color: kind === "primary" ? "#FFFFFF" : "#0F2A3D",
    cursor: "pointer",
    display: "inline-flex",
    fontSize: 13,
    fontWeight: 850,
    padding: "9px 14px",
    textDecoration: "none",
  };
}

export default function ExpertoReportesPage() {
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/tax/summary?year=${year}`, { cache: "no-store" });
        const json = await res.json();
        if (json.data?.availableYears) {
          setAvailableYears(json.data.availableYears);
        }
      } catch {
        // El selector queda con el año actual si no hay resumen disponible.
      }
    }

    void load();
  }, [year]);

  const reports: ReportItem[] = [
    {
      key: "pdf-informativo",
      title: "Reporte informativo PDF",
      description: "Resumen visual para el usuario. Incluye ventas, ganancias, pérdidas y recompensas de staking.",
      feature: Feature.PDF_EXPORT,
      formats: [
        { label: "Descargar PDF", href: `/api/tax/reports/pdf-informative?year=${year}`, mode: "link" },
      ],
    },
    {
      key: "pdf-contador",
      title: "Reporte contador PDF",
      description: "Reporte tributario estricto para revisión profesional, con campos técnicos y respaldo de validación.",
      feature: Feature.ADVANCED_REPORTS,
      formats: [
        { label: "Generar con validación", href: `/api/tax/reports/pdf-strict?year=${year}`, mode: "fetch" },
      ],
    },
    {
      key: "csv-eventos",
      title: "Eventos tributarios CSV",
      description: "Exporta los eventos tributarios del período en formato CSV para revisión y respaldo documental.",
      feature: Feature.CSV_EXPORT,
      formats: [
        { label: "CSV informativo", href: `/api/tax/events/export-informative?year=${year}`, mode: "link" },
        { label: "CSV contador", href: `/api/tax/events/export-strict?year=${year}`, mode: "fetch" },
      ],
    },
    {
      key: "libro-tributario",
      title: "Libro tributario",
      description: "Libro de apoyo con movimientos, costos y resultados para respaldo contable y auditoría.",
      feature: Feature.ADVANCED_REPORTS,
      formats: [
        { label: "Descargar CSV", href: `/api/tax/ledger/export/csv?year=${year}`, mode: "link" },
        { label: "Descargar PDF", href: `/api/tax/ledger/export/pdf?year=${year}`, mode: "link" },
      ],
    },
  ];

  async function downloadWithValidation(href: string) {
    setDownloading(href);
    setError(null);
    setMessage(null);
    setReportResult(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(href, {
        headers: {
          Authorization: `Bearer ${token ?? ""}`,
        },
        credentials: "include",
      });
      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok) {
        throw new Error("No fue posible generar el reporte.");
      }

      if (contentType.includes("application/json")) {
        const data = await response.json();
        setReportResult({
          validationCode: data.validationCode,
          verificationUrl: data.verificationUrl,
          hash: data.hash,
        });
        setMessage("Reporte generado correctamente.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "reporte-ledgera";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage("Reporte descargado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar reporte.");
    } finally {
      setDownloading(null);
    }
  }

  function copyToClipboard(value: string) {
    navigator.clipboard.writeText(value);
    setMessage("Copiado al portapapeles.");
  }

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Modo Experto · Reportes</p>
          <h1 style={{ color: "#F8FAFC", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Reportes y exportaciones</h1>
          <p style={{ color: "#94A3B8", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Centraliza las descargas PDF, CSV y libro tributario. Los reportes estrictos pueden generar hash y código de verificación.
          </p>
        </div>
      </section>

      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, marginBottom: 20, padding: 16 }}>
        <label style={{ alignItems: "center", color: "#475569", display: "inline-flex", fontSize: 13, fontWeight: 750, gap: 8 }}>
          Año del reporte
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 13, fontWeight: 750, minHeight: 38, padding: "0 10px" }}
          >
            {availableYears.length > 0 ? (
              availableYears.map((y) => <option key={y} value={String(y)}>{y}</option>)
            ) : (
              <option value={String(new Date().getFullYear())}>{new Date().getFullYear()}</option>
            )}
          </select>
        </label>
      </section>

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", marginBottom: 24 }}>
        {reports.map((report) => (
          <FeatureGate
            key={report.key}
            feature={report.feature}
            source={`experto_reportes_${report.key}`}
            fallback={
              <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <UpgradeCard feature={report.feature} source={`experto_reportes_${report.key}`} />
              </article>
            }
          >
          <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 20 }}>
            <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 6px" }}>{report.title}</h3>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, margin: "0 0 14px" }}>{report.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {report.formats.map((format) => (
                format.mode === "link" ? (
                  <a key={format.label} href={format.href} target="_blank" rel="noopener noreferrer" style={buttonStyle("primary")}>
                    {format.label}
                  </a>
                ) : (
                  <button
                    key={format.label}
                    type="button"
                    onClick={() => downloadWithValidation(format.href)}
                    disabled={downloading !== null}
                    style={{ ...buttonStyle("primary"), opacity: downloading !== null ? 0.7 : 1 }}
                  >
                    {downloading === format.href ? "Procesando..." : format.label}
                  </button>
                )
              ))}
            </div>
          </article>
          </FeatureGate>
        ))}
      </section>

      {reportResult && (
        <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, marginBottom: 16, padding: 18 }}>
          <h2 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 12px" }}>Reporte generado</h2>
          <div style={{ color: "#475569", display: "grid", fontSize: 13, gap: 8 }}>
            {reportResult.validationCode && <p style={{ margin: 0 }}><strong>Código:</strong> <span style={{ fontFamily: "monospace" }}>{reportResult.validationCode}</span></p>}
            {reportResult.hash && <p style={{ margin: 0 }}><strong>Hash:</strong> <span style={{ fontFamily: "monospace", fontSize: 12 }}>{reportResult.hash}</span></p>}
            {reportResult.verificationUrl && (
              <p style={{ margin: 0 }}><strong>Verificación:</strong> <a href={reportResult.verificationUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0F766E", fontWeight: 800 }}>Abrir enlace</a></p>
            )}
          </div>
          {reportResult.verificationUrl && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              <button type="button" onClick={() => copyToClipboard(reportResult.verificationUrl!)} style={buttonStyle("secondary")}>Copiar link</button>
              <button type="button" onClick={() => window.open(reportResult.verificationUrl!, "_blank")} style={buttonStyle("primary")}>Abrir verificación</button>
            </div>
          )}
        </section>
      )}

      {error && <section style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, color: "#991B1B", fontSize: 13, fontWeight: 750, marginBottom: 12, padding: 14 }}>{error}</section>}
      {message && <section style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, color: "#166534", fontSize: 13, fontWeight: 750, marginBottom: 12, padding: 14 }}>{message}</section>}

      <section style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 18 }}>
        <h2 style={{ color: "#F8FAFC", fontSize: "1rem", fontWeight: 850, margin: "0 0 10px" }}>Verificación</h2>
        <p style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.55, margin: "0 0 10px" }}>
          Los reportes estrictos pueden emitir hash, código y enlace de verificación. Para revisar evidencia ya emitida, usa Verificaciones.
        </p>
        <a href="/experto/verificaciones" style={buttonStyle("secondary")}>Abrir verificaciones</a>
      </section>
    </div>
  );
}
