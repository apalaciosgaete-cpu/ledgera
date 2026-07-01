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

const flowSteps = [
  "Carga información en Origen de Fondos.",
  "Confirma movimientos en Importaciones.",
  "Revisa activos y base de costo.",
  "Distingue declaración/respaldo versus pago de impuesto.",
  "Descarga PDF y Excel como respaldo formal.",
];

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
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Declaraciones</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 900, lineHeight: 1.08, margin: "0 0 8px", letterSpacing: "-0.04em", maxWidth: 680 }}>Genera PDF y Excel de respaldo tributario</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0, maxWidth: 620 }}>
            LEDGERA empaqueta la trazabilidad de tus activos y separa taxativamente si corresponde declarar/respaldar o si también existe impuesto estimado a pagar.
          </p>
        </div>
        <Link href="/obligaciones-tributarias" style={{ border: "1px solid #CBD5E1", borderRadius: 999, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Revisar situación tributaria primero
        </Link>
      </section>

      <section style={{ background: "linear-gradient(135deg,#FFFFFF 0%,#F8FFFB 100%)", border: "1px solid #D9F5E8", borderRadius: 24, boxShadow: "0 14px 34px rgba(15,42,61,0.06)", padding: 18, display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 14, alignItems: "center" }}>
          <div style={{ width: 58, height: 58, borderRadius: 18, background: "#ECFDF5", color: "#0F766E", display: "grid", placeItems: "center", fontSize: 28, boxShadow: "inset 0 0 0 1px #BBF7D0" }}>📄</div>
          <div>
            <p style={{ color: "#0F766E", fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", margin: "0 0 5px", textTransform: "uppercase" }}>IA LEDGERA</p>
            <h2 style={{ color: "#0F2A3D", fontSize: "1.35rem", fontWeight: 900, letterSpacing: "-0.035em", margin: "0 0 6px" }}>La declaración no es lo mismo que el pago</h2>
            <p style={{ color: "#475569", fontSize: 13.5, lineHeight: 1.45, margin: 0, maxWidth: 880 }}>
              El PDF y el Excel indican si las operaciones solo deben declararse o respaldarse, o si además generan impuesto estimado bajo Impuesto Global Complementario según la base detectada por LEDGERA.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
          {flowSteps.map((step, index) => (
            <article key={step} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 12 }}>
              <span style={{ color: "#0F766E", fontSize: 12, fontWeight: 900 }}>{String(index + 1).padStart(2, "0")}</span>
              <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.4, margin: "7px 0 0" }}>{step}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ alignItems: "center", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: 16 }}>
        <label style={{ alignItems: "center", color: "#475569", display: "inline-flex", fontSize: 13, fontWeight: 800, gap: 8 }}>
          Año para versión filtrada
          <select value={year} onChange={(e) => setYear(e.target.value)} style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 10, color: "#0F2A3D", fontSize: 13, fontWeight: 800, minHeight: 38, padding: "0 10px" }}>
            {availableYears.length > 0 ? availableYears.map((y) => <option key={y} value={String(y)}>{y}</option>) : <option value={String(new Date().getFullYear())}>{new Date().getFullYear()}</option>}
          </select>
        </label>
        <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.4, margin: 0 }}>También puedes descargar el paquete completo sin filtro de año.</p>
      </section>

      <section style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))" }}>
        {reports.map((report) => (
          <article key={report.key} style={{ background: "#FFFFFF", border: report.key === "declaracion-respaldo" ? "1px solid #BBF7D0" : "1px solid #E2E8F0", borderRadius: 20, padding: 18, display: "grid", gap: 10 }}>
            <div>
              <h3 style={{ color: "#0F2A3D", fontSize: 19, fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 6px" }}>{report.title}</h3>
              <p style={{ color: "#64748B", fontSize: 13.5, lineHeight: 1.45, margin: 0 }}>{report.description}</p>
            </div>
            <p style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, color: "#475569", fontSize: 12.5, lineHeight: 1.4, margin: 0, padding: 10 }}>{report.whenToUse}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {report.formats.map((fmt) => (
                <a key={fmt.label} href={fmt.href} target="_blank" rel="noopener noreferrer" style={{ background: "#0F766E", borderRadius: 999, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "9px 14px", textDecoration: "none" }}>
                  {fmt.label}
                </a>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 18, padding: 16 }}>
        <h2 style={{ color: "#92400E", fontSize: 15, fontWeight: 900, margin: "0 0 6px" }}>Importante</h2>
        <p style={{ color: "#92400E", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
          El archivo explicita la conclusión de LEDGERA con los datos confirmados. Antes de presentar una declaración final, debe revisarse junto con los demás antecedentes tributarios del contribuyente.
        </p>
      </section>
    </div>
  );
}
