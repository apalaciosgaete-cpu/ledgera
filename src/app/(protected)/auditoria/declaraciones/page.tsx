"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Declaration = {
  id: string;
  taxYear: number;
  declarationType: string;
  status: string;
  contentHash: string;
  generatedAt: string;
  confirmedAt: string | null;
  voidedAt: string | null;
};

type DeclarationsData = {
  declarations: Declaration[];
};

function statusLabel(status: string) {
  switch (status) {
    case "DRAFT": return { text: "Borrador", bg: "#F1F5F9", color: "#475569" };
    case "REVIEWED": return { text: "Revisada", bg: "#E0F2FE", color: "#075985" };
    case "CONFIRMED": return { text: "Confirmada", bg: "#F0FDF4", color: "#166534" };
    case "VOIDED": return { text: "Anulada", bg: "#FEF2F2", color: "#991B1B" };
    case "EXPORTED": return { text: "Exportada", bg: "#FFFBEB", color: "#92400E" };
    default: return { text: status, bg: "#F1F5F9", color: "#475569" };
  }
}

function typeLabel(type: string) {
  switch (type) {
    case "DJ_CRYPTO_SUMMARY": return "Resumen cripto";
    case "DJ_REALIZED_GAINS": return "Ganancias realizadas";
    case "DJ_FOREIGN_EXCHANGE_ACTIVITY": return "Actividad cambiaria";
    case "DJ_TAX_SUPPORTING_LEDGER": return "Libro de apoyo";
    default: return type;
  }
}

export default function AuditoriaDeclaracionesPage() {
  const [data, setData] = useState<DeclarationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (selectedYear) params.set("year", selectedYear);
        const res = await fetch(`/api/tax/declarations?${params.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "Error cargando declaraciones.");
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [selectedYear]);

  const availableYears = data
    ? Array.from(new Set(data.declarations.map((d) => d.taxYear))).sort((a, b) => b - a)
    : [];

  const counts = data
    ? {
        total: data.declarations.length,
        draft: data.declarations.filter((d) => d.status === "DRAFT").length,
        reviewed: data.declarations.filter((d) => d.status === "REVIEWED").length,
        confirmed: data.declarations.filter((d) => d.status === "CONFIRMED").length,
        voided: data.declarations.filter((d) => d.status === "VOIDED").length,
        exported: data.declarations.filter((d) => d.status === "EXPORTED").length,
      }
    : null;

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Auditoría de declaraciones</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Cadena de custodia DDJJ</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            CREATED → REVIEWED → CONFIRMED → EXPORTED → VOIDED. Cada transición queda registrada.
          </p>
        </div>
        <Link href="/panel" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver a auditoría
        </Link>
      </section>

      {loading && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando declaraciones...</p>}
      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{error}</div>}

      {!loading && data && counts && (
        <>
          <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: 20 }}>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Total</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{counts.total}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Borradores</p>
              <p style={{ color: "#475569", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{counts.draft}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Revisadas</p>
              <p style={{ color: "#075985", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{counts.reviewed}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Confirmadas</p>
              <p style={{ color: "#166534", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{counts.confirmed}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Exportadas</p>
              <p style={{ color: "#92400E", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{counts.exported}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Anuladas</p>
              <p style={{ color: "#991B1B", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{counts.voided}</p>
            </article>
          </section>

          {availableYears.length > 0 && (
            <section style={{ marginBottom: 16 }}>
              <label style={{ alignItems: "center", color: "#475569", display: "inline-flex", fontSize: 13, fontWeight: 750, gap: 8 }}>
                Año
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 13, fontWeight: 750, minHeight: 38, padding: "0 10px" }}>
                  <option value="">Todos</option>
                  {availableYears.map((y) => (<option key={y} value={String(y)}>{y}</option>))}
                </select>
              </label>
            </section>
          )}

          {data.declarations.length === 0 ? (
            <section style={{ background: "#FFFFFF", border: "1px dashed #CBD5E1", borderRadius: 8, padding: 28, textAlign: "center" }}>
              <h2 style={{ color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Sin declaraciones</h2>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: 0 }}>No hay declaraciones registradas para los filtros seleccionados.</p>
            </section>
          ) : (
            <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", minWidth: 900, width: "100%" }}>
                  <thead>
                    <tr style={{ background: "#0F2A3D", color: "#F8FAFC", textAlign: "left" }}>
                      <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Año</th>
                      <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Tipo</th>
                      <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Estado</th>
                      <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Hash</th>
                      <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Generada</th>
                      <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Confirmada</th>
                      <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Anulada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.declarations.map((d) => {
                      const st = statusLabel(d.status);
                      return (
                        <tr key={d.id} style={{ borderTop: "1px solid #E2E8F0" }}>
                          <td style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 750, padding: "14px" }}>{d.taxYear}</td>
                          <td style={{ color: "#334155", fontSize: 13, padding: "14px" }}>{typeLabel(d.declarationType)}</td>
                          <td style={{ padding: "14px" }}>
                            <span style={{ background: st.bg, borderRadius: 999, color: st.color, fontSize: 12, fontWeight: 800, padding: "2px 10px" }}>{st.text}</span>
                          </td>
                          <td style={{ color: "#64748B", fontSize: 12, fontFamily: "monospace", padding: "14px" }}>{d.contentHash.slice(0, 10)}…{d.contentHash.slice(-6)}</td>
                          <td style={{ color: "#334155", fontSize: 13, padding: "14px" }}>{new Date(d.generatedAt).toLocaleDateString("es-CL")}</td>
                          <td style={{ color: "#334155", fontSize: 13, padding: "14px" }}>{d.confirmedAt ? new Date(d.confirmedAt).toLocaleDateString("es-CL") : "—"}</td>
                          <td style={{ color: "#334155", fontSize: 13, padding: "14px" }}>{d.voidedAt ? new Date(d.voidedAt).toLocaleDateString("es-CL") : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
