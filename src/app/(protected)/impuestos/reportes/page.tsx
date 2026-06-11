"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ReportItem = {
  key: string;
  title: string;
  description: string;
  formats: { label: string; href: string }[];
};

export default function ReportesPage() {
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tax/summary?year=" + year, { cache: "no-store" });
        const json = await res.json();
        if (json.data?.availableYears) {
          setAvailableYears(json.data.availableYears);
        }
      } catch {
        // ignore
      }
    }
    void load();
  }, [year]);

  const reports: ReportItem[] = [
    {
      key: "pdf-informativo",
      title: "Reporte informativo PDF",
      description: "Resumen visual de eventos tributarios para el usuario. Incluye tabla de ventas, ganancias y staking.",
      formats: [
        { label: "Descargar PDF", href: `/api/tax/reports/pdf-informative?year=${year}` },
      ],
    },
    {
      key: "pdf-estricto",
      title: "Reporte estricto PDF",
      description: "Reporte detallado con todos los campos técnicos para revisión con contador.",
      formats: [
        { label: "Descargar PDF", href: `/api/tax/reports/pdf-strict?year=${year}` },
      ],
    },
    {
      key: "csv-eventos",
      title: "Eventos tributarios CSV",
      description: "Exporta todos los eventos tributarios del año en formato CSV separado por punto y coma.",
      formats: [
        { label: "Descargar informativo", href: `/api/tax/events/export-informative?year=${year}` },
        { label: "Descargar estricto", href: `/api/tax/events/export-strict?year=${year}` },
      ],
    },
    {
      key: "libro",
      title: "Libro tributario",
      description: "Libro de apoyo con movimientos, costos y resultados para respaldo documental.",
      formats: [
        { label: "Descargar CSV", href: `/api/tax/ledger/export/csv?year=${year}` },
        { label: "Descargar PDF", href: `/api/tax/ledger/export/pdf?year=${year}` },
      ],
    },
  ];

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Centro de reportes</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Exporta tu información</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            PDF para ti, PDF para tu contador, CSV técnico. Toda la información tributaria exportable.
          </p>
        </div>
        <Link href="/mi-situacion" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver al centro tributario
        </Link>
      </section>

      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 20, padding: 16 }}>
        <label style={{ alignItems: "center", color: "#475569", display: "inline-flex", fontSize: 13, fontWeight: 750, gap: 8 }}>
          Año del reporte
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 13, fontWeight: 750, minHeight: 38, padding: "0 10px" }}
          >
            {availableYears.length > 0 ? (
              availableYears.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))
            ) : (
              <option value={String(new Date().getFullYear())}>{new Date().getFullYear()}</option>
            )}
          </select>
        </label>
      </section>

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", marginBottom: 24 }}>
        {reports.map((report) => (
          <article key={report.key} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 20 }}>
            <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 6px" }}>{report.title}</h3>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, margin: "0 0 14px" }}>{report.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {report.formats.map((fmt) => (
                <a
                  key={fmt.label}
                  href={fmt.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: "#0F766E", borderRadius: 6, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "8px 14px", textDecoration: "none" }}
                >
                  {fmt.label}
                </a>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 8, padding: 18 }}>
        <h2 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 10px" }}>Verificación</h2>
        <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.55, margin: "0 0 10px" }}>
          Cada reporte generado incluye un hash de integridad. Puedes verificar que el archivo no ha sido modificado usando el Centro de Evidencia.
        </p>
        <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.55, margin: 0 }}>
          Los reportes PDF incluyen un código QR con la validación pública.
        </p>
      </section>
    </div>
  );
}
