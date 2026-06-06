"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type EvidenceDoc = {
  name: string;
  type: string;
  hash: string;
  generatedAt: string;
  status: string;
};

type EvidenceData = {
  hash: string;
  generatedAt: string;
  documents: EvidenceDoc[];
  verificationUrl: string;
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
        <Link href="/auditoria" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver a auditoría
        </Link>
      </section>

      {loading && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando evidencias...</p>}
      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{error}</div>}

      {!loading && data && (
        <>
          <section style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, marginBottom: 24, padding: 22 }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>🔐</span>
              <span style={{ background: "#FFFFFF", borderRadius: 999, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "6px 12px" }}>Hash de integridad</span>
            </div>
            <p style={{ color: "#0F2A3D", fontFamily: "monospace", fontSize: 14, fontWeight: 750, margin: "0 0 6px", wordBreak: "break-all" }}>{data.hash}</p>
            <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>Generado: {new Date(data.generatedAt).toLocaleString("es-CL")}</p>
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.documents.map((doc, i) => (
              <div key={i} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", justifyContent: "space-between" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0F2A3D" }}>{doc.name}</span>
                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 700, background: doc.status === "verificado" ? "rgba(22,163,74,0.08)" : "rgba(245,158,11,0.08)", color: doc.status === "verificado" ? "#16A34A" : "#D97706" }}>
                      {doc.status === "verificado" ? "Verificado" : "Pendiente"}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontFamily: "monospace", fontSize: "0.75rem", color: "#94A3B8", wordBreak: "break-all" }}>{doc.hash.slice(0, 20)}…{doc.hash.slice(-8)}</p>
                </div>
                <span style={{ color: "#64748B", fontSize: 12 }}>{new Date(doc.generatedAt).toLocaleDateString("es-CL")}</span>
              </div>
            ))}
          </section>

          <section style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, marginTop: 20, padding: "14px 18px" }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Verificación pública disponible en:</p>
              <a href={data.verificationUrl} target="_blank" rel="noopener noreferrer" style={{ background: "#0F2A3D", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none", whiteSpace: "nowrap" }}>
                {data.verificationUrl}
              </a>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
