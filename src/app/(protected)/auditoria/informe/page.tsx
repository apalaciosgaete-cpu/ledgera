"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PeriodData = {
  year: number;
  status: "OPEN" | "CLOSED" | "REOPENED";
  closedAt: string | null;
  snapshotCount: number;
};

type Declaration = {
  id: string;
  taxYear: number;
  declarationType: string;
  status: string;
};

type InformeData = {
  year: number;
  period: PeriodData | null;
  declarations: Declaration[];
  integrityStatus: string;
  healthScore: number;
};

export default function AuditoriaInformePage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<InformeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [pRes, dRes, iRes] = await Promise.all([
          fetch(`/api/tax/periods/status?year=${year}`, { cache: "no-store" }),
          fetch(`/api/tax/declarations?year=${year}`, { cache: "no-store" }),
          fetch("/api/tax/audit/integrity", { cache: "no-store" }),
        ]);
        const pJson = await pRes.json();
        const dJson = await dRes.json();
        const iJson = await iRes.json();

        const healthRes = await fetch("/api/tax/health", { cache: "no-store" });
        const healthJson = await healthRes.json();

        setData({
          year,
          period: pRes.ok && pJson.ok ? { year: pJson.data.year, status: pJson.data.status, closedAt: pJson.data.closedAt, snapshotCount: 0 } : null,
          declarations: dRes.ok && dJson.ok ? dJson.data.declarations : [],
          integrityStatus: iRes.ok && iJson.ok ? iJson.data.status : "UNKNOWN",
          healthScore: healthRes.ok && healthJson.ok ? healthJson.data.score : 0,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [year]);

  function periodLabel(status: string) {
    switch (status) {
      case "OPEN": return { text: "Abierto", color: "#16A34A" };
      case "CLOSED": return { text: "Cerrado", color: "#64748B" };
      case "REOPENED": return { text: "Reabierto", color: "#D97706" };
      default: return { text: status, color: "#64748B" };
    }
  }

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Informe de auditoría</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Generar informe completo</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            PDF con integridad, declaraciones, períodos, hallazgos, verificación, QR y hash.
          </p>
        </div>
        <Link href="/panel" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver a auditoría
        </Link>
      </section>

      <section style={{ alignItems: "end", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 20, padding: 16 }}>
        <label style={{ color: "#475569", display: "grid", fontSize: 13, fontWeight: 750, gap: 6 }}>
          Año del informe
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", minHeight: 40, padding: "0 10px" }}>
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear - 2}>{currentYear - 2}</option>
          </select>
        </label>
      </section>

      {loading && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando datos del informe...</p>}
      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{error}</div>}

      {!loading && data && (
        <>
          <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 24 }}>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Período {year}</p>
              <p style={{ color: data.period ? periodLabel(data.period.status).color : "#64748B", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>
                {data.period ? periodLabel(data.period.status).text : "N/A"}
              </p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Declaraciones</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{data.declarations.length}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Integridad</p>
              <p style={{ color: data.integrityStatus === "OK" ? "#16A34A" : "#991B1B", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{data.integrityStatus}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Salud datos</p>
              <p style={{ color: data.healthScore >= 70 ? "#15803D" : "#991B1B", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{data.healthScore}/100</p>
            </article>
          </section>

          <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", marginBottom: 24 }}>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 20 }}>
              <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 10px" }}>Trazabilidad de período</h3>
              <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.55, margin: "0 0 14px" }}>
                PDF con historial de cierres, reaperturas, snapshots y registros de auditoría del período {year}.
              </p>
              <a href={`/api/tax/periods/audit/export/pdf?year=${year}`} download={`ledgera-auditoria-periodo-${year}.pdf`} style={{ background: "#0F2A3D", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 16px", textDecoration: "none" }}>
                Descargar PDF período
              </a>
            </article>

            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 20 }}>
              <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 10px" }}>Trazabilidad CSV</h3>
              <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.55, margin: "0 0 14px" }}>
                CSV con historial de acciones, hashes de verificación y registros de cierre del período {year}.
              </p>
              <a href={`/api/tax/periods/audit/export/csv?year=${year}`} download={`ledgera-auditoria-periodo-${year}.csv`} style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 16px", textDecoration: "none" }}>
                Descargar CSV período
              </a>
            </article>

            {data.declarations.map((d) => (
              <article key={d.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 20 }}>
                <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 10px" }}>Declaración {d.declarationType}</h3>
                <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.55, margin: "0 0 14px" }}>
                  Año {d.taxYear} · Estado: {d.status}
                </p>
                <a href={`/api/tax/declarations/${d.id}/audit-pdf`} download={`ledgera-auditoria-declaracion-${d.id}.pdf`} style={{ background: "#0F2A3D", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 16px", textDecoration: "none" }}>
                  Descargar PDF auditoría
                </a>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
