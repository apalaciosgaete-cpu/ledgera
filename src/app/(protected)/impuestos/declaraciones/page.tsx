"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Declaration = {
  id: string;
  taxYear: number;
  declarationType: string;
  status: string;
  source: string;
  contentHash: string;
  generatedAt: string;
  confirmedAt: string | null;
  voidedAt: string | null;
  createdAt: string;
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

function hashShort(hash: string) {
  return hash.slice(0, 8) + "..." + hash.slice(-8);
}

export default function DeclaracionesPage() {
  const [data, setData] = useState<DeclarationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (selectedYear) params.set("year", selectedYear);
        const res = await fetch(`/api/tax/declarations?${params.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "No se pudieron cargar las declaraciones.");
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando declaraciones.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [selectedYear]);

  const availableYears = data
    ? Array.from(new Set(data.declarations.map((d) => d.taxYear))).sort((a, b) => b - a)
    : [];

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Declaraciones</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Historial de declaraciones</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Borrador, revisada, confirmada o anulada. Toda declaración queda registrada.
          </p>
        </div>
        <Link href="/mi-situacion" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver al centro tributario
        </Link>
      </section>

      {loading ? (
        <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando declaraciones...</p>
      ) : error ? (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>
          {error}
        </div>
      ) : data ? (
        <>
          {availableYears.length > 0 && (
            <section style={{ marginBottom: 16 }}>
              <label style={{ alignItems: "center", color: "#475569", display: "inline-flex", fontSize: 13, fontWeight: 750, gap: 8 }}>
                Año
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 13, fontWeight: 750, minHeight: 38, padding: "0 10px" }}
                >
                  <option value="">Todos</option>
                  {availableYears.map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </label>
            </section>
          )}

          {data.declarations.length === 0 ? (
            <section style={{ background: "#FFFFFF", border: "1px dashed #CBD5E1", borderRadius: 8, padding: 28, textAlign: "center" }}>
              <h2 style={{ color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Sin declaraciones registradas</h2>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: "0 auto 16px", maxWidth: 520 }}>
                Las declaraciones se generan automáticamente desde el panel de administración o al exportar reportes. Cuando existan, aparecerán acá.
              </p>
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
                    </tr>
                  </thead>
                  <tbody>
                    {data.declarations.map((d) => {
                      const st = statusLabel(d.status);
                      return (
                        <tr key={d.id} style={{ borderTop: "1px solid #E2E8F0" }}>
                          <td style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 850, padding: "14px" }}>{d.taxYear}</td>
                          <td style={{ color: "#334155", fontSize: 13, padding: "14px" }}>{typeLabel(d.declarationType)}</td>
                          <td style={{ padding: "14px" }}>
                            <span style={{ alignItems: "center", background: st.bg, borderRadius: 999, color: st.color, display: "inline-flex", fontSize: 12, fontWeight: 800, height: 26, padding: "0 10px" }}>
                              {st.text}
                            </span>
                          </td>
                          <td style={{ color: "#64748B", fontSize: 12, fontFamily: "monospace", padding: "14px" }}>{hashShort(d.contentHash)}</td>
                          <td style={{ color: "#334155", fontSize: 13, padding: "14px" }}>
                            {new Date(d.generatedAt).toLocaleDateString("es-CL")}
                          </td>
                          <td style={{ color: "#334155", fontSize: 13, padding: "14px" }}>
                            {d.confirmedAt ? new Date(d.confirmedAt).toLocaleDateString("es-CL") : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}
