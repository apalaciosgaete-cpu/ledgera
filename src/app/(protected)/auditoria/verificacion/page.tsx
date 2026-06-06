"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Validation = {
  id: string;
  hash: string;
  type: string;
  typeLabel: string;
  isValid: boolean;
  issuedAt: string;
  year: number;
  symbol: string | null;
  revokedAt: string | null;
};

type ValidationsData = {
  year: number;
  validations: Validation[];
};

export default function AuditoriaVerificacionPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<ValidationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/report-validations?year=${year}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Error cargando verificaciones.");
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  async function copyLink(id: string, url: string) {
    try { await navigator.clipboard.writeText(url); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); } catch { /* noop */ }
  }

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Verificación pública</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Códigos de verificación</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Un tercero puede validar la autenticidad de cada documento emitido por LEDGERA.
          </p>
        </div>
        <Link href="/auditoria" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver a auditoría
        </Link>
      </section>

      <section style={{ alignItems: "end", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 20, padding: 16 }}>
        <label style={{ color: "#475569", display: "grid", fontSize: 13, fontWeight: 750, gap: 6 }}>
          Año
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", minHeight: 40, padding: "0 10px" }}>
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear - 2}>{currentYear - 2}</option>
          </select>
        </label>
      </section>

      {loading && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando verificaciones...</p>}
      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{error}</div>}

      {!loading && data && (
        <>
          {data.validations.length === 0 ? (
            <section style={{ background: "#FFFFFF", border: "1px dashed #CBD5E1", borderRadius: 8, padding: 28, textAlign: "center" }}>
              <h2 style={{ color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Sin verificaciones para {year}</h2>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: 0 }}>Las verificaciones se generan al descargar reportes con hash.</p>
            </section>
          ) : (
            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.validations.map((v) => {
                const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : "https://ledgera.cl"}/verify/report/${v.hash}`;
                return (
                  <div key={v.id} style={{ background: "#FFFFFF", border: `1px solid ${v.isValid ? "#E2E8F0" : "rgba(220,38,38,0.15)"}`, borderRadius: 10, padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 700, background: v.isValid ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)", color: v.isValid ? "#16A34A" : "#DC2626" }}>
                            {v.isValid ? "Válido" : "Revocado"}
                          </span>
                          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0F2A3D" }}>{v.typeLabel}</span>
                        </div>
                        <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "#94A3B8" }}>Emitido: {new Date(v.issuedAt).toLocaleDateString("es-CL")}{v.symbol ? ` · Activo: ${v.symbol}` : ""} · Año: {v.year}</p>
                        <p style={{ margin: 0, fontFamily: "monospace", fontSize: "0.75rem", color: "#64748B", wordBreak: "break-all" }}>{v.hash}</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                        <a href={verifyUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "0.4rem 1rem", borderRadius: "8px", background: "#0F2A3D", color: "#ffffff", fontSize: "0.8125rem", fontWeight: 600, textDecoration: "none", textAlign: "center", whiteSpace: "nowrap" }}>
                          Ver verificación
                        </a>
                        <button onClick={() => copyLink(v.id, verifyUrl)} style={{ background: copiedId === v.id ? "rgba(22,163,74,0.08)" : "#F1F5F9", border: `1px solid ${copiedId === v.id ? "rgba(22,163,74,0.3)" : "transparent"}`, borderRadius: "8px", padding: "0.4rem 1rem", fontSize: "0.8125rem", fontWeight: 600, color: copiedId === v.id ? "#16A34A" : "#64748B", cursor: "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>
                          {copiedId === v.id ? "Copiado" : "Copiar enlace"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </>
      )}
    </div>
  );
}
