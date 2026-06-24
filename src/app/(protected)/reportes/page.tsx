"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fonts } from "@/styles/tokens";

type ReportFormat = {
  label: string;
  href: string;
};

type ReportCard = {
  title: string;
  description: string;
  whenToUse: string;
  formats: ReportFormat[];
};

const flowSteps = [
  "Revisa que tus movimientos estén cargados en Origen de Fondos.",
  "Confirma o corrige tus datos en Activos.",
  "Revisa posibles eventos en Obligaciones Tributarias.",
  "Genera el reporte que necesitas.",
  "Compártelo con tu contador o guárdalo como respaldo.",
];

export default function ReportesPage() {
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    async function loadYears() {
      try {
        const res = await fetch(`/api/tax/summary?year=${year}`, { cache: "no-store" });
        const json = await res.json();
        if (json.data?.availableYears) setAvailableYears(json.data.availableYears);
      } catch {
        setAvailableYears([]);
      }
    }

    void loadYears();
  }, [year]);

  const reports: ReportCard[] = [
    {
      title: "Reporte simple para ti",
      description: "Resumen entendible de tus operaciones con posible efecto tributario.",
      whenToUse: "Úsalo para revisar tu situación sin lenguaje técnico.",
      formats: [{ label: "Descargar PDF", href: `/api/tax/reports/pdf-informative?year=${year}` }],
    },
    {
      title: "Reporte para contador",
      description: "Documento más detallado para revisión profesional.",
      whenToUse: "Úsalo cuando quieras compartir tu información con un contador.",
      formats: [{ label: "Descargar PDF", href: `/api/tax/reports/pdf-strict?year=${year}` }],
    },
    {
      title: "Eventos tributarios",
      description: "Listado exportable de ventas, swaps, rendimientos u otros eventos detectados.",
      whenToUse: "Úsalo si necesitas trabajar los datos en planilla.",
      formats: [
        { label: "CSV simple", href: `/api/tax/events/export-informative?year=${year}` },
        { label: "CSV contador", href: `/api/tax/events/export-strict?year=${year}` },
      ],
    },
    {
      title: "Libro tributario",
      description: "Respaldo ordenado de movimientos, costos y resultados usados para el cálculo.",
      whenToUse: "Úsalo como soporte documental cuando ya revisaste Activos y Obligaciones Tributarias.",
      formats: [
        { label: "Descargar CSV", href: `/api/tax/ledger/export/csv?year=${year}` },
        { label: "Descargar PDF", href: `/api/tax/ledger/export/pdf?year=${year}` },
      ],
    },
  ];

  return (
    <main style={{ display: "grid", gap: 16, width: "100%", maxWidth: 1180, margin: "0 auto" }}>
      <section style={{ display: "grid", gap: 10 }}>
        <p style={{ color: "#0F766E", fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", margin: 0, textTransform: "uppercase", fontFamily: fonts.body }}>
          Reportes
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ color: "#0F2A3D", fontFamily: fonts.display, fontSize: "clamp(1.45rem,3vw,2rem)", fontWeight: 950, letterSpacing: "-0.045em", lineHeight: 1.05, margin: "0 0 6px" }}>
              Genera reportes cuando tus datos estén revisados
            </h1>
            <p style={{ color: "#64748B", fontFamily: fonts.body, fontSize: 14, lineHeight: 1.55, margin: 0, maxWidth: 760 }}>
              Los reportes no corrigen datos. Solo empaquetan la información validada desde Origen de Fondos, Activos y Obligaciones Tributarias para que puedas revisarla, guardarla o compartirla.
            </p>
          </div>
          <Link href="/obligaciones-tributarias" style={{ border: "1px solid #CBD5E1", borderRadius: 999, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none", fontFamily: fonts.body }}>
            Revisar obligaciones primero
          </Link>
        </div>
      </section>

      <section style={{ background: "linear-gradient(135deg,#FFFFFF 0%,#F8FFFB 100%)", border: "1px solid #D9F5E8", borderRadius: 24, boxShadow: "0 14px 34px rgba(15,42,61,0.06)", padding: 18, display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 14, alignItems: "center" }}>
          <div style={{ width: 58, height: 58, borderRadius: 18, background: "#ECFDF5", color: "#0F766E", display: "grid", placeItems: "center", fontSize: 28, boxShadow: "inset 0 0 0 1px #BBF7D0" }}>
            📄
          </div>
          <div>
            <p style={{ color: "#0F766E", fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", margin: "0 0 5px", textTransform: "uppercase", fontFamily: fonts.body }}>
              Guía LEDGERA
            </p>
            <h2 style={{ color: "#0F2A3D", fontSize: "clamp(1.15rem,2vw,1.45rem)", fontWeight: 950, letterSpacing: "-0.04em", margin: "0 0 6px", fontFamily: fonts.display }}>
              ¿Para qué sirven los reportes?
            </h2>
            <p style={{ color: "#475569", fontSize: 13.5, lineHeight: 1.45, margin: 0, maxWidth: 820, fontFamily: fonts.body }}>
              Sirven para ordenar y exportar tu información. Un reporte ayuda a revisar, respaldar y compartir datos, pero no reemplaza la validación previa de tus movimientos.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
          {flowSteps.map((step, index) => (
            <article key={step} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 12 }}>
              <span style={{ color: "#0F766E", fontSize: 12, fontWeight: 900, fontFamily: fonts.body }}>{String(index + 1).padStart(2, "0")}</span>
              <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.4, margin: "7px 0 0", fontFamily: fonts.body }}>
                {step}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ alignItems: "center", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: 16 }}>
        <label style={{ alignItems: "center", color: "#475569", display: "inline-flex", fontSize: 13, fontWeight: 800, gap: 8, fontFamily: fonts.body }}>
          Año del reporte
          <select
            value={year}
            onChange={(event) => setYear(event.target.value)}
            style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 10, color: "#0F2A3D", fontSize: 13, fontWeight: 800, minHeight: 38, padding: "0 10px", fontFamily: fonts.body }}
          >
            {availableYears.length > 0 ? (
              availableYears.map((availableYear) => (
                <option key={availableYear} value={String(availableYear)}>{availableYear}</option>
              ))
            ) : (
              <option value={String(new Date().getFullYear())}>{new Date().getFullYear()}</option>
            )}
          </select>
        </label>
        <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.4, margin: 0, fontFamily: fonts.body }}>
          Elige el año y descarga el formato que necesites.
        </p>
      </section>

      <section style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))" }}>
        {reports.map((report) => (
          <article key={report.title} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 20, padding: 18, display: "grid", gap: 10 }}>
            <div>
              <h3 style={{ color: "#0F2A3D", fontFamily: fonts.display, fontSize: 19, fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 6px" }}>
                {report.title}
              </h3>
              <p style={{ color: "#64748B", fontSize: 13.5, lineHeight: 1.45, margin: 0, fontFamily: fonts.body }}>
                {report.description}
              </p>
            </div>
            <p style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, color: "#475569", fontSize: 12.5, lineHeight: 1.4, margin: 0, padding: 10, fontFamily: fonts.body }}>
              {report.whenToUse}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {report.formats.map((format) => (
                <a key={format.label} href={format.href} target="_blank" rel="noopener noreferrer" style={{ background: "#0F766E", borderRadius: 999, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "9px 14px", textDecoration: "none", fontFamily: fonts.body }}>
                  {format.label}
                </a>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 18, padding: 16 }}>
        <h2 style={{ color: "#92400E", fontSize: 15, fontWeight: 900, margin: "0 0 6px", fontFamily: fonts.body }}>Importante</h2>
        <p style={{ color: "#92400E", fontSize: 13, lineHeight: 1.5, margin: 0, fontFamily: fonts.body }}>
          Generar un reporte no significa que la declaración esté lista. Primero deben estar revisados los datos de Activos y los eventos de Obligaciones Tributarias.
        </p>
      </section>
    </main>
  );
}
