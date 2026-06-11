"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type IntegrityIssue = {
  type: string;
  count: number;
  message: string;
};

type IntegrityData = {
  status: string;
  issues: IntegrityIssue[];
  metrics?: Record<string, unknown>;
};

function statusConfig(status: string) {
  switch (status) {
    case "CRITICAL": return { label: "Crítico", color: "#991B1B", bg: "#FEF2F2", border: "#FECACA" };
    case "RISK": return { label: "Riesgo", color: "#92400E", bg: "#FFFBEB", border: "#FCD34D" };
    case "LEGACY_UNVERIFIABLE": return { label: "Legacy no verificable", color: "#475569", bg: "#F1F5F9", border: "#CBD5E1" };
    default: return { label: "OK", color: "#166534", bg: "#F0FDF4", border: "#86EFAC" };
  }
}

export default function AuditoriaIntegridadPage() {
  const [integrityData, setIntegrityData] = useState<IntegrityData | null>(null);
  const [healthData, setHealthData] = useState<{ score: number; label: string; color: string; problems: { severity: string; label: string; detail: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [iRes, hRes] = await Promise.all([
          fetch("/api/tax/audit/integrity", { cache: "no-store" }),
          fetch("/api/tax/health", { cache: "no-store" }),
        ]);
        const iJson = await iRes.json();
        const hJson = await hRes.json();
        if (iRes.ok && iJson.ok) setIntegrityData(iJson.data);
        if (hRes.ok && hJson.ok) setHealthData(hJson.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando integridad.");
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
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Integridad tributaria</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Estado de integridad</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Ventas sin evento, eventos huérfanos, duplicados e inconsistencias detectadas.
          </p>
        </div>
        <Link href="/panel" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver a auditoría
        </Link>
      </section>

      {loading && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando integridad...</p>}
      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{error}</div>}

      {!loading && healthData && (
        <section style={{ background: healthData.color === "#166534" ? "#F0FDF4" : healthData.color === "#0F766E" ? "#ECFDF5" : healthData.color === "#854D0E" ? "#FFFBEB" : "#FEF2F2", border: `2px solid ${healthData.color === "#166534" ? "#86EFAC" : healthData.color === "#0F766E" ? "#6EE7B7" : healthData.color === "#854D0E" ? "#FCD34D" : "#FCA5A5"}`, borderRadius: 12, marginBottom: 24, padding: 22 }}>
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{healthData.score >= 70 ? "✓" : "⚠"}</span>
            <span style={{ background: "#FFFFFF", borderRadius: 999, color: healthData.color, display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "6px 12px" }}>
              {healthData.label} — {healthData.score}/100
            </span>
          </div>
          <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.55, margin: 0 }}>
            {healthData.score >= 70
              ? "Los datos tributarios están en buen estado. La integridad es suficiente para auditoría."
              : "Se detectaron problemas que afectan la integridad tributaria. Revisa los hallazgos abajo."}
          </p>
        </section>
      )}

      {!loading && integrityData && (
        <>
          <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid #E2E8F0" }}>
              <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: 0 }}>Hallazgos de auditoría</h3>
            </div>
            {integrityData.issues.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <p style={{ color: "#16A34A", fontWeight: 700, margin: "0 0 4px" }}>Sin hallazgos críticos</p>
                <p style={{ color: "#94A3B8", fontSize: 13, margin: 0 }}>No se detectaron problemas de integridad.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 0 }}>
                {integrityData.issues.map((issue, i) => (
                  <div key={i} style={{ alignItems: "center", borderTop: i > 0 ? "1px solid #E2E8F0" : "none", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: "14px 18px" }}>
                    <div>
                      <p style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 750, margin: "0 0 2px" }}>{issue.message}</p>
                      <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>Tipo: {issue.type}</p>
                    </div>
                    <span style={{ background: "#FEF2F2", borderRadius: 999, color: "#991B1B", fontSize: 13, fontWeight: 850, padding: "4px 12px" }}>
                      {issue.count} afectado{issue.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {!loading && healthData && healthData.problems.length > 0 && (
        <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #E2E8F0" }}>
            <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: 0 }}>Problemas detectados ({healthData.problems.length})</h3>
          </div>
          <div style={{ display: "grid", gap: 0 }}>
            {healthData.problems.map((p, i) => (
              <div key={i} style={{ alignItems: "flex-start", borderTop: i > 0 ? "1px solid #E2E8F0" : "none", display: "flex", flexWrap: "wrap", gap: 10, padding: "14px 18px" }}>
                <span style={{
                  background: p.severity === "high" ? "#FEF2F2" : p.severity === "medium" ? "#FFFBEB" : "#F0FDF4",
                  borderRadius: 999,
                  color: p.severity === "high" ? "#991B1B" : p.severity === "medium" ? "#92400E" : "#166534",
                  flexShrink: 0,
                  fontSize: 11,
                  fontWeight: 800,
                  marginTop: 2,
                  padding: "2px 8px",
                  textTransform: "uppercase",
                }}>
                  {p.severity}
                </span>
                <div>
                  <p style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 750, margin: "0 0 2px" }}>{p.label}</p>
                  <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>{p.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
