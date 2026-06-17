"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CATEGORY_EMOJIS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  categorizePriority,
  type DecisionItem,
  type DecisionPriority,
  type DecisionCategory,
} from "@/modules/decision-center/domain/decision-center";

interface QueueData {
  userId: string;
  total: number;
  urgentCount: number;
  attentionCount: number;
  opportunityCount: number;
  items: DecisionItem[];
  generatedAt: string;
}

function priorityColor(priority: DecisionPriority) {
  if (priority === "CRITICAL") return "#B91C1C";
  if (priority === "HIGH") return "#B45309";
  if (priority === "MEDIUM") return "#0F766E";
  return "#64748B";
}

function priorityBg(priority: DecisionPriority) {
  if (priority === "CRITICAL") return "rgba(185,28,28,0.10)";
  if (priority === "HIGH") return "rgba(180,83,9,0.10)";
  if (priority === "MEDIUM") return "rgba(15,118,110,0.10)";
  return "transparent";
}

function categoryColor(cat: DecisionCategory) {
  switch (cat) {
    case "RIESGO": return "#B91C1C";
    case "CUMPLIMIENTO": return "#B45309";
    case "AHORRO_TRIBUTARIO": return "#047857";
    case "INVERSION": return "#0369A1";
    case "DOCUMENTACION": return "#6D28D9";
    case "AUTOMATIZACION": return "#0F766E";
    case "AI": return "#9333EA";
  }
}

export default function DecisionesPage() {
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);

  const fetchDecisions = useCallback(async () => {
    try {
      const res = await fetch("/api/decisions");
      if (!res.ok) return;
      const json = await res.json();
      setData(json.data ?? null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  async function handleRebuild() {
    setRebuilding(true);
    try {
      const res = await fetch("/api/decisions/rebuild", { method: "POST" });
      if (!res.ok) return;
      const json = await res.json();
      setData(json.data ?? null);
    } catch {
      // silent
    } finally {
      setRebuilding(false);
    }
  }

  const urgent = data?.items.filter((i) => categorizePriority(i.priority) === "urgent") ?? [];
  const attention = data?.items.filter((i) => categorizePriority(i.priority) === "attention") ?? [];
  const opportunities = data?.items.filter((i) => categorizePriority(i.priority) === "opportunity") ?? [];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
        <p style={{ color: "#94A3B8", fontSize: 16 }}>Cargando decisiones...</p>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 24 }}>
      {/* Header */}
      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>
              Centro de Decisiones
            </p>
            <h1 style={{ color: "#0F2A3D", fontSize: "2rem", fontWeight: 900, margin: "0 0 8px" }}>
              Cola de Decisiones Tributarias
            </h1>
            <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 600 }}>
              LEDGERA unifica señales de Monitor, Copiloto, Automatizaciones, Agente AI y Simulador en una cola priorizada.
            </p>
          </div>
          <button
            onClick={handleRebuild}
            disabled={rebuilding}
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              border: "none",
              background: rebuilding ? "#94A3B8" : "#0F766E",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 800,
              cursor: rebuilding ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {rebuilding ? "Reconstruyendo..." : "Reconstruir cola"}
          </button>
        </div>
      </section>

      {/* Summary metrics */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <MetricCard
          label="Total decisiones"
          value={data?.total ?? 0}
          detail="En cola ahora"
          color="#0F2A3D"
        />
        <MetricCard
          label="🔥 Urgentes"
          value={data?.urgentCount ?? 0}
          detail="Requieren acción inmediata"
          color="#B91C1C"
        />
        <MetricCard
          label="⚠️ Atención"
          value={data?.attentionCount ?? 0}
          detail="Prioridad alta"
          color="#B45309"
        />
        <MetricCard
          label="💡 Oportunidades"
          value={data?.opportunityCount ?? 0}
          detail="Mejora continua"
          color="#0F766E"
        />
      </section>

      {/* Urgent section */}
      {urgent.length > 0 && (
        <DecisionSection title="🔥 Urgente" description="Decisiones que requieren acción inmediata" items={urgent} />
      )}

      {/* Attention section */}
      {attention.length > 0 && (
        <DecisionSection title="⚠️ Atención" description="Prioridad alta — revisa pronto" items={attention} />
      )}

      {/* Opportunities section */}
      {opportunities.length > 0 && (
        <DecisionSection title="💡 Oportunidades" description="Mejoras y optimizaciones disponibles" items={opportunities} />
      )}

      {data?.items.length === 0 && (
        <section style={{ background: "#ECFDF5", border: "1px solid #BBF7D0", borderRadius: 18, padding: 24, textAlign: "center" }}>
          <p style={{ color: "#166534", fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>✅ Sin decisiones pendientes</p>
          <p style={{ color: "#166534", fontSize: 14, margin: 0 }}>LEDGERA no detectó señales que requieran tu atención ahora.</p>
        </section>
      )}

      {data && data.items.length > 0 && (
        <p style={{ color: "#94A3B8", fontSize: 12, textAlign: "center", margin: 0 }}>
          Última actualización: {new Date(data.generatedAt).toLocaleString("es-CL")}
        </p>
      )}
    </main>
  );
}

function MetricCard({ label, value, detail, color }: { label: string; value: number | string; detail: string; color: string }) {
  return (
    <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 18 }}>
      <p style={{ color: "#64748B", fontSize: 13, fontWeight: 800, margin: "0 0 8px" }}>{label}</p>
      <p style={{ color, fontSize: 26, fontWeight: 900, margin: 0 }}>{value}</p>
      <p style={{ color: "#94A3B8", fontSize: 13, margin: "4px 0 0" }}>{detail}</p>
    </article>
  );
}

function DecisionSection({ title, description, items }: { title: string; description: string; items: DecisionItem[] }) {
  return (
    <section style={{ display: "grid", gap: 14 }}>
      <div>
        <h2 style={{ color: "#0F2A3D", fontSize: 20, fontWeight: 900, margin: "0 0 4px" }}>{title}</h2>
        <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>{description}</p>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {items.map((item) => (
          <article
            key={item.id}
            style={{
              background: "#FFFFFF",
              border: `1px solid ${priorityColor(item.priority)}22`,
              borderLeft: `4px solid ${priorityColor(item.priority)}`,
              borderRadius: 14,
              padding: "16px 20px",
              display: "grid",
              gap: 10,
              transition: "box-shadow 0.15s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: categoryColor(item.category),
                      background: `${categoryColor(item.category)}14`,
                      padding: "2px 10px",
                      borderRadius: 999,
                      textTransform: "uppercase",
                    }}
                  >
                    {CATEGORY_EMOJIS[item.category]} {CATEGORY_LABELS[item.category]}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: priorityColor(item.priority),
                      background: priorityBg(item.priority),
                      padding: "2px 10px",
                      borderRadius: 999,
                    }}
                  >
                    {PRIORITY_LABELS[item.priority]}
                  </span>
                  <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>
                    {item.source.replace("_", " ")}
                  </span>
                </div>
                <h3 style={{ color: "#0F2A3D", fontSize: 17, fontWeight: 900, margin: "0 0 4px" }}>{item.title}</h3>
                <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: 0 }}>{item.description}</p>
              </div>
              {item.impact && (
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ color: "#0F2A3D", fontSize: 22, fontWeight: 900, margin: 0 }}>{item.impact.value}</p>
                  <p style={{ color: "#94A3B8", fontSize: 11, margin: 0 }}>{item.impact.label}</p>
                </div>
              )}
            </div>
            <div>
              <Link
                href={item.actionHref}
                style={{
                  color: "#0F766E",
                  fontSize: 14,
                  fontWeight: 850,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {item.actionLabel} →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
