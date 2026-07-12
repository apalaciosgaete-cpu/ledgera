"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TaxSummary = {
  availableYears: number[];
  decision?: {
    label?: string;
    headline?: string;
  };
  rows?: Array<{ symbol: string }>;
  totals?: {
    eventsCount?: number;
    realizedPnlClp?: number;
    baseImponibleClp?: number;
    confidenceLevel?: number;
  };
};

function formatClp(value: number | undefined): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Math.round(value ?? 0));
}

const primaryButtonStyle = {
  alignItems: "center",
  background: "var(--accent)",
  borderRadius: 999,
  color: "#ffffff",
  display: "inline-flex",
  fontSize: 13,
  fontWeight: 900,
  justifyContent: "center",
  minHeight: 40,
  padding: "9px 15px",
  textDecoration: "none",
} as const;

const secondaryButtonStyle = {
  alignItems: "center",
  background: "var(--bg-sunken)",
  border: "1px solid var(--border)",
  borderRadius: 999,
  color: "var(--text)",
  display: "inline-flex",
  fontSize: 13,
  fontWeight: 850,
  justifyContent: "center",
  minHeight: 40,
  padding: "9px 15px",
  textDecoration: "none",
} as const;

export default function DeclaracionesPage() {
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await fetch(`/api/tax/summary?year=${year}`, { cache: "no-store" });
        const json = await res.json();
        if (!active) return;
        if (!res.ok || !json.data) throw new Error(json.message || "No fue posible cargar el resumen.");

        const years = Array.isArray(json.data.availableYears) ? json.data.availableYears : [];
        if (years.length > 0 && !years.includes(Number(year))) {
          setYear(String(years[0]));
          return;
        }

        setSummary(json.data as TaxSummary);
      } catch {
        if (!active) return;
        setSummary(null);
        setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [year]);

  const commercialYear = Number(year);
  const taxYear = commercialYear + 1;
  const availableYears = summary?.availableYears ?? [];
  const yearsForSelect = useMemo(
    () => availableYears.length > 0 ? availableYears : [commercialYear],
    [availableYears, commercialYear],
  );
  const eventCount = summary?.totals?.eventsCount ?? 0;
  const assetCount = summary?.rows?.length ?? 0;
  const confidence = summary?.totals?.confidenceLevel ?? 0;

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between" }}>
        <div style={{ maxWidth: 720 }}>
          <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Declaraciones</p>
          <h1 style={{ color: "var(--text)", fontSize: "1.85rem", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.08, margin: "0 0 8px", maxWidth: 720 }}>
            Prepara tu respaldo para el Formulario 22
          </h1>
          <p style={{ color: "var(--text-soft)", fontSize: "0.95rem", lineHeight: 1.55, margin: 0, maxWidth: 690 }}>
            Genera el extracto referencial de los códigos 1032 y 1865, junto con el informe anual y la trazabilidad de las operaciones confirmadas. LEDGERA no presenta automáticamente el Formulario 22 ante el SII.
          </p>
        </div>
        <Link href="/obligaciones-tributarias" style={secondaryButtonStyle}>
          Revisar cálculo tributario
        </Link>
      </section>

      <section style={{ alignItems: "center", background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", padding: 16 }}>
        <label style={{ color: "var(--text)", display: "grid", fontSize: 13, fontWeight: 850, gap: 7 }}>
          Año comercial de las operaciones
          <select value={year} onChange={(event) => setYear(event.target.value)} style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontWeight: 850, minHeight: 40, minWidth: 120, padding: "0 10px" }}>
            {yearsForSelect.map((availableYear) => (
              <option key={availableYear} value={String(availableYear)}>{availableYear}</option>
            ))}
          </select>
        </label>
        <div style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-soft)", borderRadius: 14, display: "grid", gap: 3, minWidth: 300, padding: "11px 14px" }}>
          <strong style={{ color: "var(--accent)", fontSize: 14 }}>Año Tributario {taxYear}</strong>
          <span style={{ color: "var(--accent)", fontSize: 12.5, lineHeight: 1.4 }}>
            Operaciones comprendidas: 1 ene {commercialYear} – 31 dic {commercialYear}
          </span>
        </div>
      </section>

      <section style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,190px),1fr))" }}>
        {[
          ["Eventos tributarios", loading ? "…" : String(eventCount)],
          ["Activos incluidos", loading ? "…" : String(assetCount)],
          ["Resultado neto", loading ? "…" : formatClp(summary?.totals?.realizedPnlClp)],
          ["Base imponible detectada", loading ? "…" : formatClp(summary?.totals?.baseImponibleClp)],
          ["Integridad del cálculo", loading ? "…" : `${confidence}%`],
        ].map(([label, value]) => (
          <article key={label} style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 16, display: "grid", gap: 5, padding: 14 }}>
            <span style={{ color: "var(--text-soft)", fontSize: 11.5, fontWeight: 800 }}>{label}</span>
            <strong style={{ color: "var(--text)", fontSize: 16, fontWeight: 900 }}>{loadError ? "No disponible" : value}</strong>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))" }}>
        <article style={{ background: "var(--bg-elev)", border: "1px solid var(--accent-soft)", borderRadius: 20, display: "grid", gap: 14, padding: 18 }}>
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
            <span style={{ background: "var(--accent-soft)", borderRadius: 999, color: "var(--accent)", fontSize: 11.5, fontWeight: 900, padding: "6px 9px" }}>Documento principal</span>
            <span style={{ color: "var(--text-soft)", fontSize: 12.5, fontWeight: 850 }}>AT {taxYear}</span>
          </div>
          <div>
            <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Extracto F22 para criptoactivos</h2>
            <p style={{ color: "var(--text-soft)", fontSize: 13.5, lineHeight: 1.48, margin: 0 }}>
              Hoja de preparación de una página con los montos referenciales que LEDGERA asigna a los códigos 1032 y 1865. Incluye folio, hash y QR de verificación.
            </p>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ alignItems: "center", background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 12, display: "grid", gap: 10, gridTemplateColumns: "58px 1fr", padding: 10 }}>
              <strong style={{ background: "var(--accent)", borderRadius: 8, color: "#ffffff", fontSize: 13, padding: "8px 6px", textAlign: "center" }}>1032</strong>
              <span style={{ color: "var(--text)", fontSize: 12.5, lineHeight: 1.4 }}>Otras rentas de fuente chilena afectas al IGC o IA, sujeto a letra m) del artículo 17 N.º 8 y contraparte no relacionada.</span>
            </div>
            <div style={{ alignItems: "center", background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 12, display: "grid", gap: 10, gridTemplateColumns: "58px 1fr", padding: 10 }}>
              <strong style={{ background: "var(--text)", borderRadius: 8, color: "var(--bg-elev)", fontSize: 13, padding: "8px 6px", textAlign: "center" }}>1865</strong>
              <span style={{ color: "var(--text)", fontSize: 12.5, lineHeight: 1.4 }}>Otras rentas, cuando no se cumplen los requisitos utilizados para la clasificación referencial en el código 1032.</span>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <a href={`/api/tax/declarations/f22-crypto/pdf?year=${year}`} target="_blank" rel="noopener noreferrer" style={primaryButtonStyle}>
              Descargar extracto F22
            </a>
          </div>
        </article>

        <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 20, display: "grid", gap: 14, padding: 18 }}>
          <div>
            <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Paquete tributario AT {taxYear}</h2>
            <p style={{ color: "var(--text-soft)", fontSize: 13.5, lineHeight: 1.48, margin: 0 }}>
              Informe PDF y Excel con base de costo, eventos tributarios, detalle de operaciones y trazabilidad filtrados por el año comercial {commercialYear}.
            </p>
          </div>
          <p style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)", fontSize: 12.5, lineHeight: 1.45, margin: 0, padding: 11 }}>
            Úsalo como respaldo del cálculo que sustenta el extracto F22. El PDF incorpora verificación por QR y el Excel conserva el detalle completo.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <a href={`/api/tax/declarations/support/pdf?year=${year}`} target="_blank" rel="noopener noreferrer" style={primaryButtonStyle}>PDF anual</a>
            <a href={`/api/tax/declarations/support/xlsx?year=${year}`} target="_blank" rel="noopener noreferrer" style={secondaryButtonStyle}>Excel anual</a>
          </div>
        </article>
      </section>

      <article style={{ alignItems: "center", background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", padding: 16 }}>
        <div style={{ maxWidth: 720 }}>
          <h2 style={{ color: "var(--text)", fontSize: 16, fontWeight: 900, margin: "0 0 5px" }}>Historial consolidado</h2>
          <p style={{ color: "var(--text-soft)", fontSize: 13, lineHeight: 1.45, margin: 0 }}>
            Incluye todos los años disponibles. Es útil para auditoría, conciliación y archivo histórico; no corresponde a un período anual específico del Formulario 22.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <a href="/api/tax/declarations/support/pdf" target="_blank" rel="noopener noreferrer" style={secondaryButtonStyle}>PDF histórico</a>
          <a href="/api/tax/declarations/support/xlsx" target="_blank" rel="noopener noreferrer" style={secondaryButtonStyle}>Excel histórico</a>
        </div>
      </article>

      <section style={{ background: "rgba(232,184,75,0.14)", border: "1px solid rgba(232,184,75,0.18)", borderRadius: 18, padding: 16 }}>
        <h2 style={{ color: "var(--warn)", fontSize: 15, fontWeight: 900, margin: "0 0 6px" }}>Documento referencial</h2>
        <p style={{ color: "var(--warn)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
          El extracto no reemplaza el Formulario 22 ni acredita una presentación ante el SII. La asignación entre los códigos 1032 y 1865 debe revisarse con el perfil tributario, la relación con la contraparte y los demás antecedentes del contribuyente.
        </p>
      </section>
    </div>
  );
}
