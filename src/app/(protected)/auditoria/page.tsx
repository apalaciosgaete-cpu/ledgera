"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DashboardData = {
  year: number;
  integrity: {
    healthScore: number;
    status: string;
    color: string;
    issues: {
      sellWithoutEvent: number;
      orphanEvents: number;
      unknownTypeCount: number;
      missingPriceCount: number;
      missingQuantityCount: number;
      futureDateCount: number;
      pendingEvents: number;
    };
    totalIssues: number;
  };
  period: {
    year: number;
    status: "OPEN" | "CLOSED" | "REOPENED";
    closedAt: string | null;
    reopenedAt: string | null;
    closedReason: string | null;
    snapshotCount: number;
    logCount: number;
  };
  declarations: {
    counts: {
      total: number;
      draft: number;
      reviewed: number;
      confirmed: number;
      voided: number;
      exported: number;
    };
    recent: {
      id: string;
      taxYear: number;
      type: string;
      status: string;
      hash: string;
      generatedAt: string;
    }[];
  };
  movements: { total: number; inYear: number };
  events: { total: number; pendingEvents: number };
  validations: { total: number; valid: number; revoked: number };
  snapshots: { id: string; contentHash: string; createdAt: string }[];
};

function buildFindings(data: DashboardData): string[] {
  const findings: string[] = [];
  const i = data.integrity.issues;
  if (i.sellWithoutEvent > 0) findings.push(`${i.sellWithoutEvent} venta${i.sellWithoutEvent > 1 ? "s" : ""} sin clasificación`);
  if (i.pendingEvents > 0) findings.push(`${i.pendingEvents} evento${i.pendingEvents > 1 ? "s" : ""} pendiente${i.pendingEvents > 1 ? "s" : ""} de clasificar`);
  if (i.orphanEvents > 0) findings.push(`${i.orphanEvents} evento${i.orphanEvents > 1 ? "s" : ""} huérfano${i.orphanEvents > 1 ? "s" : ""}`);
  if (i.unknownTypeCount > 0) findings.push(`${i.unknownTypeCount} tipo${i.unknownTypeCount > 1 ? "s" : ""} de movimiento desconocido${i.unknownTypeCount > 1 ? "s" : ""}`);
  if (i.missingPriceCount > 0) findings.push(`${i.missingPriceCount} precio${i.missingPriceCount > 1 ? "s" : ""} faltante${i.missingPriceCount > 1 ? "s" : ""}`);
  if (i.missingQuantityCount > 0) findings.push(`${i.missingQuantityCount} cantidad${i.missingQuantityCount > 1 ? "es" : ""} faltante${i.missingQuantityCount > 1 ? "s" : ""}`);
  if (i.futureDateCount > 0) findings.push(`${i.futureDateCount} fecha${i.futureDateCount > 1 ? "s" : ""} futura${i.futureDateCount > 1 ? "s" : ""}`);
  return findings;
}

const auditorTools = [
  { key: "fifo", title: "FIFO", description: "Desglose de lotes FIFO para cada venta. Cost basis, consumo y ganancia verificable.", href: "/auditoria/fifo", available: true },
  { key: "movimientos", title: "Operaciones auditadas", description: "Origen de cada cálculo. Fecha, activo, cantidad, precio, fee y relación con evento tributario.", href: "/auditoria/movimientos", available: true },
  { key: "eventos", title: "Eventos pendientes", description: "Auditoría de taxEvents. Clasificación, PnL, fuente, relación movimiento e historial.", href: "/auditoria/eventos", available: true },
  { key: "periodos", title: "Estado del período", description: "Cierre, reapertura, snapshots, timeline y trazabilidad de períodos tributarios.", href: "/auditoria/periodos", available: true },
  { key: "declaraciones", title: "Declaraciones", description: "Cadena de custodia de DDJJ. CREATED → REVIEWED → CONFIRMED → EXPORTED → VOIDED.", href: "/auditoria/declaraciones", available: true },
  { key: "verificacion", title: "Verificaciones públicas", description: "Códigos de verificación, hashes, estados y revocaciones de documentos.", href: "/auditoria/verificacion", available: true },
];

export default function AuditoriaHubPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/audit/dashboard", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "Error cargando dashboard.");
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const findings = data ? buildFindings(data) : [];
  const healthy = data ? data.integrity.totalIssues === 0 : true;

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      {/* Header */}
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Auditoría</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Estado de auditoría</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Demuestra que el cálculo es correcto. Trazabilidad, FIFO, integridad y cadena de custodia.
          </p>
        </div>
      </section>

      {loading ? (
        <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando estado de auditoría...</p>
      ) : error ? (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{error}</div>
      ) : data ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* 1. Estado de Auditoría */}
          <section style={{
            background: healthy ? "#F0FDF4" : "#FEF9C3",
            border: `2px solid ${healthy ? "#86EFAC" : "#FDE047"}`,
            borderRadius: 14,
            padding: "28px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>{healthy ? "✓" : "⚠"}</span>
              <h2 style={{ color: healthy ? "#166534" : "#854D0E", fontSize: "1.35rem", fontWeight: 850, margin: 0 }}>
                {healthy ? "Sin observaciones" : "Requiere revisión"}
              </h2>
            </div>

            <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.55, margin: "0 0 20px", maxWidth: 640 }}>
              {healthy
                ? "Integridad verificada, FIFO verificado, declaraciones sin inconsistencias."
                : `${findings.length} hallazgo${findings.length > 1 ? "s" : ""} detectado${findings.length > 1 ? "s" : ""}. Revisa antes de declarar.`}
            </p>

            {healthy && (
              <ul style={{ listStyle: "none", margin: "0 0 20px", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#166534" }}>
                  <span style={{ fontWeight: 700 }}>✓</span> Integridad verificada
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#166534" }}>
                  <span style={{ fontWeight: 700 }}>✓</span> FIFO verificado
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#166534" }}>
                  <span style={{ fontWeight: 700 }}>✓</span> Declaraciones sin inconsistencias
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#166534" }}>
                  <span style={{ fontWeight: 700 }}>✓</span> {data.validations.valid} verificación{data.validations.valid !== 1 ? "es" : ""} válida{data.validations.valid !== 1 ? "s" : ""}
                </li>
              </ul>
            )}

            {!healthy && findings.length > 0 && (
              <ul style={{ listStyle: "none", margin: "0 0 20px", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {findings.slice(0, 4).map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#854D0E" }}>
                    <span style={{ fontWeight: 700 }}>•</span> {f}
                  </li>
                ))}
              </ul>
            )}

            <Link
              href={healthy ? "/auditoria/evidencia" : "/auditoria/integridad"}
              style={{
                background: healthy ? "#16A34A" : "#B45309",
                borderRadius: 8,
                color: "#FFFFFF",
                display: "inline-flex",
                fontSize: 14,
                fontWeight: 850,
                padding: "12px 22px",
                textDecoration: "none",
              }}
            >
              {healthy ? "Ver evidencia →" : "Revisar observaciones →"}
            </Link>
          </section>

          {/* 2. Hallazgos (solo si hay problemas) */}
          {!healthy && findings.length > 0 && (
            <section>
              <p style={{ color: "#334155", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 14px", textTransform: "uppercase" }}>Hallazgos</p>
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "22px 24px" }}>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {findings.map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#0F2A3D" }}>
                      <span style={{ color: "#DC2626", fontWeight: 700 }}>•</span>
                      <span>{f.charAt(0).toUpperCase() + f.slice(1)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* 3. Cadena de custodia (visual) */}
          <section>
            <p style={{ color: "#334155", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 14px", textTransform: "uppercase" }}>Cadena de custodia</p>
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", fontSize: 13 }}>
                {[
                  { label: "Operación", count: data.movements.total, color: "#0F766E" },
                  { label: "FIFO", count: data.events.total, color: "#0F766E" },
                  { label: "Evento tributario", count: data.events.total, color: "#0F766E" },
                  { label: "Declaración", count: data.declarations.counts.total, color: "#0F766E" },
                  { label: "Hash", count: data.validations.total, color: "#0F766E" },
                  { label: "Verificación", count: data.validations.valid, color: "#16A34A" },
                ].map((step, i, arr) => (
                  <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ background: step.color + "14", border: `1px solid ${step.color}33`, borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 11, color: "#64748B", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{step.label}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 850, color: step.color }}>{step.count}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <span style={{ color: "#CBD5E1", fontSize: 16, fontWeight: 700 }}>→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 4. Evidencia */}
          <section>
            <p style={{ color: "#334155", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 14px", textTransform: "uppercase" }}>Evidencia</p>
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <p style={{ color: "#0F2A3D", fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Evidencia disponible</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                  <span style={{ fontSize: 13, color: "#166534", display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontWeight: 700 }}>✓</span> Hash válido</span>
                  <span style={{ fontSize: 13, color: "#166534", display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontWeight: 700 }}>✓</span> Verificación pública</span>
                  <span style={{ fontSize: 13, color: "#166534", display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontWeight: 700 }}>✓</span> Declaraciones auditadas</span>
                </div>
              </div>
              <Link href="/auditoria/evidencia" style={{ background: "#0F766E", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 14, fontWeight: 850, padding: "12px 22px", textDecoration: "none", flexShrink: 0 }}>
                Abrir evidencia →
              </Link>
            </div>
          </section>

          {/* 5. Herramientas del auditor */}
          <section>
            <p style={{ color: "#334155", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 14px", textTransform: "uppercase" }}>Herramientas del auditor</p>
            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))" }}>
              {auditorTools.map((tool) => {
                const content = (
                  <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 18, height: "100%" }}>
                    <h3 style={{ color: "#0F2A3D", fontSize: "0.95rem", fontWeight: 850, margin: "0 0 6px" }}>{tool.title}</h3>
                    <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{tool.description}</p>
                  </article>
                );
                return tool.available ? (
                  <Link key={tool.key} href={tool.href} style={{ textDecoration: "none" }}>{content}</Link>
                ) : (
                  <div key={tool.key}>{content}</div>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
