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
  movements: {
    total: number;
    inYear: number;
  };
  events: {
    total: number;
    pendingEvents: number;
  };
  validations: {
    total: number;
    valid: number;
    revoked: number;
    recent: {
      id: string;
      hash: string;
      type: string;
      year: number | null;
      issuedAt: string;
    }[];
  };
  snapshots: {
    id: string;
    contentHash: string;
    createdAt: string;
  }[];
  recentLogs: {
    period: {
      id: string;
      action: string;
      reason: string | null;
      actorEmail: string | null;
      createdAt: string;
    }[];
    declarations: {
      id: string;
      action: string;
      declarationId: string;
      actorEmail: string | null;
      statusFrom: string | null;
      statusTo: string | null;
      createdAt: string;
    }[];
  };
};

const sections = [
  { key: "periodos", title: "Períodos", description: "Cierre, reapertura, snapshots, timeline y trazabilidad de períodos tributarios.", href: "/auditoria/periodos", available: true },
  { key: "movimientos", title: "Movimientos", description: "Origen de cada cálculo. Fecha, activo, cantidad, precio, fee y relación con evento tributario.", href: "/auditoria/movimientos", available: true },
  { key: "fifo", title: "FIFO", description: "Desglose de lotes FIFO para cada venta. Cost basis, consumo y ganancia verificable.", href: "/auditoria/fifo", available: true },
  { key: "eventos", title: "Eventos Tributarios", description: "Auditoría de taxEvents. Clasificación, PnL, fuente, relación movimiento e historial.", href: "/auditoria/eventos", available: true },
  { key: "declaraciones", title: "Declaraciones", description: "Cadena de custodia de DDJJ. CREATED → REVIEWED → CONFIRMED → EXPORTED → VOIDED.", href: "/auditoria/declaraciones", available: true },
  { key: "integridad", title: "Integridad", description: "Ventas sin evento, eventos huérfanos, duplicados, inconsistencias y score de salud.", href: "/auditoria/integridad", available: true },
  { key: "verificacion", title: "Verificación Pública", description: "Códigos de verificación, hashes, estados y revocaciones de documentos.", href: "/auditoria/verificacion", available: true },
  { key: "evidencia", title: "Evidencia", description: "Reportes, declaraciones, hashes y verificaciones reunidos para fiscalización.", href: "/auditoria/evidencia", available: true },
  { key: "cadena", title: "Cadena de Custodia", description: "Movimiento → FIFO → Tax Event → DDJJ → Reporte → Hash → Verificación. Trazabilidad completa.", href: "/auditoria/cadena", available: true },
  { key: "informe", title: "Informe de Auditoría", description: "PDF completo con integridad, declaraciones, períodos, hallazgos, QR y hash.", href: "/auditoria/informe", available: true },
];

function periodLabel(status: string) {
  switch (status) {
    case "OPEN": return { text: "Abierto", color: "#16A34A", bg: "#F0FDF4" };
    case "CLOSED": return { text: "Cerrado", color: "#64748B", bg: "#F8FAFC" };
    case "REOPENED": return { text: "Reabierto", color: "#D97706", bg: "#FFFBEB" };
    default: return { text: status, color: "#64748B", bg: "#F1F5F9" };
  }
}

function declarationStatusLabel(status: string) {
  switch (status) {
    case "DRAFT": return { text: "Borrador", bg: "#F1F5F9", color: "#475569" };
    case "REVIEWED": return { text: "Revisada", bg: "#E0F2FE", color: "#075985" };
    case "CONFIRMED": return { text: "Confirmada", bg: "#F0FDF4", color: "#166534" };
    case "VOIDED": return { text: "Anulada", bg: "#FEF2F2", color: "#991B1B" };
    case "EXPORTED": return { text: "Exportada", bg: "#FFFBEB", color: "#92400E" };
    default: return { text: status, bg: "#F1F5F9", color: "#475569" };
  }
}

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

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Auditoría</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Centro de Auditoría</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Demuéstrame que el cálculo es correcto. Trazabilidad, FIFO, integridad y cadena de custodia.
          </p>
        </div>
      </section>

      {loading && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando dashboard de auditoría...</p>}
      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{error}</div>}

      {!loading && data && (
        <>
          {/* KPIs */}
          <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 24 }}>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Integridad</p>
              <p style={{ color: data.integrity.color, fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{data.integrity.status}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{data.integrity.healthScore}/100 · {data.integrity.totalIssues} problema{data.integrity.totalIssues !== 1 ? "s" : ""}</p>
            </article>

            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Período {data.period.year}</p>
              <p style={{ color: periodLabel(data.period.status).color, fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{periodLabel(data.period.status).text}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{data.period.snapshotCount} snapshot{data.period.snapshotCount !== 1 ? "s" : ""} · {data.period.logCount} log{data.period.logCount !== 1 ? "s" : ""}</p>
            </article>

            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Declaraciones</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{data.declarations.counts.total}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{data.declarations.counts.confirmed} confirmada{data.declarations.counts.confirmed !== 1 ? "s" : ""} · {data.declarations.counts.voided} anulada{data.declarations.counts.voided !== 1 ? "s" : ""}</p>
            </article>

            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Eventos</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{data.events.total}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{data.events.pendingEvents} pendiente{data.events.pendingEvents !== 1 ? "s" : ""} de clasificar</p>
            </article>

            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Movimientos</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{data.movements.total}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{data.movements.inYear} en {data.year}</p>
            </article>

            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Verificaciones</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{data.validations.total}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{data.validations.valid} válida{data.validations.valid !== 1 ? "s" : ""} · {data.validations.revoked} revocada{data.validations.revoked !== 1 ? "s" : ""}</p>
            </article>
          </section>

          {/* Declaraciones recientes */}
          {data.declarations.recent.length > 0 && (
            <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 24, overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid #E2E8F0" }}>
                <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: 0 }}>Declaraciones recientes</h3>
              </div>
              <div style={{ display: "grid", gap: 0 }}>
                {data.declarations.recent.map((d) => {
                  const st = declarationStatusLabel(d.status);
                  return (
                    <div key={d.id} style={{ alignItems: "center", borderTop: "1px solid #E2E8F0", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: "12px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ background: st.bg, borderRadius: 999, color: st.color, fontSize: 12, fontWeight: 800, padding: "2px 10px" }}>{st.text}</span>
                        <span style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 750 }}>{d.type}</span>
                        <span style={{ color: "#64748B", fontSize: 12 }}>{d.taxYear}</span>
                      </div>
                      <span style={{ color: "#94A3B8", fontSize: 12, fontFamily: "monospace" }}>{d.hash.slice(0, 12)}…{d.hash.slice(-6)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Snapshots */}
          {data.snapshots.length > 0 && (
            <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 24, overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid #E2E8F0" }}>
                <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: 0 }}>Snapshots del período {data.year}</h3>
              </div>
              <div style={{ display: "grid", gap: 0 }}>
                {data.snapshots.map((s, i) => (
                  <div key={s.id} style={{ alignItems: "center", borderTop: "1px solid #E2E8F0", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: "12px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ color: "#94A3B8", fontSize: 12, fontWeight: 750 }}>#{i + 1}</span>
                      <span style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 750 }}>{new Date(s.createdAt).toLocaleDateString("es-CL")}</span>
                    </div>
                    <span style={{ color: "#94A3B8", fontSize: 12, fontFamily: "monospace" }}>{s.contentHash}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Secciones */}
          <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", marginBottom: 24 }}>
            {sections.map((section) => {
              const content = (
                <article style={{
                  background: section.available ? "#FFFFFF" : "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  opacity: section.available ? 1 : 0.7,
                  padding: 20,
                }}>
                  <div style={{ alignItems: "center", display: "flex", gap: 10, marginBottom: 8 }}>
                    <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: 0 }}>{section.title}</h3>
                    {!section.available && (
                      <span style={{ background: "#F1F5F9", borderRadius: 999, color: "#64748B", fontSize: 11, fontWeight: 850, padding: "2px 8px" }}>Próximamente</span>
                    )}
                  </div>
                  <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{section.description}</p>
                </article>
              );

              if (section.available) {
                return (
                  <Link key={section.key} href={section.href} style={{ textDecoration: "none" }}>
                    {content}
                  </Link>
                );
              }
              return <div key={section.key}>{content}</div>;
            })}
          </section>
        </>
      )}
    </div>
  );
}
