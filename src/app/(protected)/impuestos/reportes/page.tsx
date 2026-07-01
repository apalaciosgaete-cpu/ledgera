"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ReportItem = {
  key: string;
  title: string;
  description: string;
  whenToUse: string;
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
        if (json.data?.availableYears) setAvailableYears(json.data.availableYears);
      } catch {
        setAvailableYears([]);
      }
    }
    void load();
  }, [year]);

  const reports: ReportItem[] = [
    {
      key: "declaracion-respaldo",
      title: "Declaración tributaria y respaldo",
      description: "PDF y Excel con logo LEDGERA, trazabilidad de activos, detalle de operaciones y conclusión expresa sobre declarar versus pagar impuesto.",
      whenToUse: "Usa este paquete como respaldo tributario principal. Incluye base de costo y conclusión IGC según los datos confirmados en LEDGERA.",
      formats: [
        { label: "PDF con trazabilidad", href: "/api/tax/declarations/support/pdf" },
        { label: "Excel con trazabilidad", href: "/api/tax/declarations/support/xlsx" },
      ],
    },
    {
      key: "declaracion-respaldo-year",
      title: "Declaración por año seleccionado",
      description: "Versión filtrada por el año seleccionado arriba. Úsala cuando quieras separar ejercicios tributarios.",
      whenToUse: "Recomendado cuando existen operaciones en más de un año calendario.",
      formats: [
        { label: "PDF del año", href: `/api/tax/declarations/support/pdf?year=${year}` },
        { label: "Excel del año", href: `/api/tax/declarations/support/xlsx?year=${year}` },
      ],
    },
    {
      key: "pdf-informativo",
      title: "Reporte simple para ti",
      description: "Resumen claro de tus operaciones con posible efecto tributario.",
      whenToUse: "Úsalo para entender tu situación sin lenguaje técnico.",
      formats: [
        { label: "Descargar PDF", href: `/api/tax/reports/pdf-informative?year=${year}` },
      ],
    },
    {
      key: "pdf-estricto",
      title: "Reporte para contador",
      description: "Documento detallado para revisión profesional y soporte tributario.",
      whenToUse: "Úsalo cuando quieras enviar la información a tu contador.",
      formats: [
        { label: "Descargar PDF", href: `/api/tax/reports/pdf-strict?year=${year}` },
      ],
    },
  ];

  return (
    <div style={{ maxWidth: 1180, width: "100%", display: "grid", gap: 16 }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between" }}>
        <div style={{ maxWidth: 680 }}>
          <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Declaraciones</p>
          <h1 style={{ color: "var(--text)", fontSize: "1.85rem", fontWeight: 900, lineHeight: 1.08, margin: "0 0 8px", letterSpacing: "-0.04em", maxWidth: 680 }}>Genera PDF y Excel de respaldo tributario</h1>
          <p style={{ color: "var(--text-soft)", fontSize: "0.95rem", lineHeight: 1.55, margin: 0, maxWidth: 620 }}>
            LEDGERA empaqueta la trazabilidad de tus activos y separa taxativamente si corresponde declarar/respaldar o si también existe impuesto estimado a pagar.
          </p>
        </div>
        <Link href="/obligaciones-tributarias" style={{ border: "1px solid var(--border)", borderRadius: 999, color: "var(--text)", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Revisar situación tributaria primero
        </Link>
      </section>

      <section style={{ alignItems: "center", background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: 16 }}>
        <label style={{ alignItems: "center", color: "var(--text)", display: "inline-flex", fontSize: 13, fontWeight: 800, gap: 8 }}>
          Año para versión filtrada
          <select value={year} onChange={(e) => setYear(e.target.value)} style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontWeight: 800, minHeight: 38, padding: "0 10px" }}>
            {availableYears.length > 0 ? availableYears.map((y) => <option key={y} value={String(y)}>{y}</option>) : <option value={String(new Date().getFullYear())}>{new Date().getFullYear()}</option>}
          </select>
        </label>
        <p style={{ color: "var(--text-soft)", fontSize: 13, lineHeight: 1.4, margin: 0 }}>También puedes descargar el paquete completo sin filtro de año.</p>
      </section>

      <section style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))" }}>
        {reports.map((report) => (
          <article key={report.key} style={{ background: "var(--bg-elev)", border: report.key === "declaracion-respaldo" ? "1px solid var(--accent-soft)" : "1px solid var(--border)", borderRadius: 20, padding: 18, display: "grid", gap: 10 }}>
            <div>
              <h3 style={{ color: "var(--text)", fontSize: 19, fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 6px" }}>{report.title}</h3>
              <p style={{ color: "var(--text-soft)", fontSize: 13.5, lineHeight: 1.45, margin: 0 }}>{report.description}</p>
            </div>
            <p style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)", fontSize: 12.5, lineHeight: 1.4, margin: 0, padding: 10 }}>{report.whenToUse}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {report.formats.map((fmt) => (
                <a key={fmt.label} href={fmt.href} target="_blank" rel="noopener noreferrer" style={{ background: "var(--accent)", borderRadius: 999, color: "var(--text)", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "9px 14px", textDecoration: "none" }}>
                  {fmt.label}
                </a>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section style={{ background: "rgba(232,184,75,0.14)", border: "1px solid rgba(232,184,75,0.14)", borderRadius: 18, padding: 16 }}>
        <h2 style={{ color: "var(--warn)", fontSize: 15, fontWeight: 900, margin: "0 0 6px" }}>Importante</h2>
        <p style={{ color: "var(--warn)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
          El archivo explicita la conclusión de LEDGERA con los datos confirmados. Antes de presentar una declaración final, debe revisarse junto con los demás antecedentes tributarios del contribuyente.
        </p>
      </section>
    </div>
  );
}
