"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type EvidenceItem = {
  id: string;
  taxYear: number;
  type: string;
  status: string;
  statusText: string;
  statusColor: string;
  statusBg: string;
  hash: string;
  hashShort: string;
  verifyUrl: string;
  generatedAt: string;
  confirmedAt: string | null;
  voidedAt: string | null;
};

type EvidenceData = {
  evidence: EvidenceItem[];
  publicVerifyUrl: string;
  total: number;
  confirmedCount: number;
  voidedCount: number;
};

export default function AuditoriaEvidenciaPage() {
  const [data, setData] = useState<EvidenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tax/evidence", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "Error cargando evidencia.");
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Evidencia de auditoría</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Evidencias para fiscalización</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Reportes, declaraciones, hashes y verificaciones reunidos desde un único lugar.
          </p>
        </div>
        <Link href="/panel" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver a auditoría
        </Link>
      </section>

      {loading && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando evidencias...</p>}
      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{error}</div>}

      {!loading && data && (
        <>
          {data.total === 0 ? (
            <section style={{ background: "#FFFFFF", border: "1px dashed #CBD5E1", borderRadius: 8, padding: 28, textAlign: "center" }}>
              <h2 style={{ color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Sin evidencias</h2>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: 0 }}>Las evidencias se generan al crear declaraciones o reportes verificables.</p>
            </section>
          ) : (
            <>
              <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 20 }}>
                <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
                  <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 6px", textTransform: "uppercase" }}>Total</p>
                  <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{data.total}</p>
                </article>
                <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
                  <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 6px", textTransform: "uppercase" }}>Confirmadas</p>
                  <p style={{ color: "#16A34A", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{data.confirmedCount}</p>
                </article>
                <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
                  <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 6px", textTransform: "uppercase" }}>Anuladas</p>
                  <p style={{ color: "#DC2626", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{data.voidedCount}</p>
                </article>
              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.evidence.map((doc) => (
                  <div key={doc.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", justifyContent: "space-between" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0F2A3D" }}>{doc.type}</span>
                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 700, background: doc.statusBg, color: doc.statusColor }}>
                          {doc.statusText}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontFamily: "monospace", fontSize: "0.75rem", color: "#94A3B8", wordBreak: "break-all" }}>{doc.hashShort}</p>
                      <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#64748B" }}>{doc.taxYear} · {new Date(doc.generatedAt).toLocaleDateString("es-CL")}</p>
                    </div>
                    <a href={doc.verifyUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "0.5rem 1rem", borderRadius: "8px", background: "#0F2A3D", color: "#ffffff", fontSize: "0.8125rem", fontWeight: 600, textDecoration: "none", textAlign: "center", whiteSpace: "nowrap", flexShrink: 0 }}>
                      Verificar →
                    </a>
                  </div>
                ))}
              </section>

              <section style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, marginTop: 20, padding: "14px 18px" }}>
                <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
                  <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Verificación pública disponible en:</p>
                  <a href={data.publicVerifyUrl} target="_blank" rel="noopener noreferrer" style={{ background: "#0F2A3D", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none", whiteSpace: "nowrap" }}>
                    {data.publicVerifyUrl}
                  </a>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
