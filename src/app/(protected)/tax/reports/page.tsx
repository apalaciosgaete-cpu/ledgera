"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ui } from "@/styles/design-system";

type TaxHealthStatus = "OK" | "REVIEW" | "RISK";

type ReportResult = {
  validationCode?: string;
  verificationUrl?: string;
  hash?: string;
};

type ReportAction = {
  label: string;
  description: string;
  href: string;
  variant: "primary" | "secondary";
  requiresCleanTaxState?: boolean;
};

export default function TaxReportsPage() {
  const router = useRouter();

  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);

  const reportActions: ReportAction[] = [
    {
      label: "PDF contador",
      description: "Reporte tributario estricto con validación.",
      href: "/api/tax/reports/pdf-strict",
      variant: "primary",
    },
    {
      label: "CSV contador",
      description: "CSV tributario estricto.",
      href: "/api/tax/events/export-strict",
      variant: "primary",
    },
  ];

  async function downloadReport(action: ReportAction) {
    setDownloading(action.href);
    setError(null);
    setMessage(null);
    setReportResult(null);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(action.href, {
        headers: {
          Authorization: `Bearer ${token ?? ""}`,
        },
        credentials: "include",
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok) {
        throw new Error("No fue posible generar el reporte.");
      }

      // 🔥 CASO JSON (pdf-strict actual)
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

      // 🔥 CASO archivo
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
      setError(
        err instanceof Error ? err.message : "Error al generar reporte.",
      );
    } finally {
      setDownloading(null);
    }
  }

  function copyToClipboard(value: string) {
    navigator.clipboard.writeText(value);
    setMessage("Copiado al portapapeles.");
  }

  return (
    <section className={`${ui.page}`}>
      <h1 className={ui.title}>Reportes tributarios</h1>

      {/* BOTONES */}
      <div className="grid gap-3 md:grid-cols-2 mt-4">
        {reportActions.map((action) => (
          <div key={action.href} className={`${ui.card} p-4`}>
            <p className="font-medium">{action.label}</p>
            <p className="text-sm text-slate-500">{action.description}</p>

            <button
              onClick={() => downloadReport(action)}
              disabled={downloading !== null}
              className={`${ui.buttonPrimary} mt-3`}
            >
              {downloading === action.href
                ? "Procesando..."
                : "Generar"}
            </button>
          </div>
        ))}
      </div>

      {/* RESULTADO */}
      {reportResult && (
        <div className={`${ui.card} p-4 mt-6`}>
          <h2 className="font-semibold text-slate-900">
            Reporte generado
          </h2>

          <div className="mt-3 text-sm space-y-2">
            <div>
              <strong>Código:</strong>{" "}
              <span className="font-mono">
                {reportResult.validationCode}
              </span>
            </div>

            <div>
              <strong>Hash:</strong>{" "}
              <span className="font-mono text-xs">
                {reportResult.hash}
              </span>
            </div>

            <div>
              <strong>Verificación:</strong>{" "}
              <a
                href={reportResult.verificationUrl}
                target="_blank"
                className="text-blue-600 underline"
              >
                Abrir enlace
              </a>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {reportResult.verificationUrl && (
              <button
                onClick={() =>
                  copyToClipboard(reportResult.verificationUrl!)
                }
                className={ui.buttonSecondary}
              >
                Copiar link
              </button>
            )}

            {reportResult.verificationUrl && (
              <button
                onClick={() =>
                  window.open(
                    reportResult.verificationUrl!,
                    "_blank",
                  )
                }
                className={ui.buttonPrimary}
              >
                Abrir verificación
              </button>
            )}
          </div>
        </div>
      )}

      {/* MENSAJES */}
      {error && (
        <div className={`${ui.alertRisk} mt-4 p-3`}>
          {error}
        </div>
      )}

      {message && (
        <div className={`${ui.alertOk} mt-4 p-3`}>
          {message}
        </div>
      )}
    </section>
  );
}