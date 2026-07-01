"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CATEGORY_EMOJIS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
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
  if (priority === "CRITICAL") return "#C4634A";
  if (priority === "HIGH") return "#E8B84B";
  if (priority === "MEDIUM") return "#3FA687";
  return "var(--text-soft)";
}

function categoryColor(cat: DecisionCategory) {
  switch (cat) {
    case "RIESGO": return "#C4634A";
    case "CUMPLIMIENTO": return "#E8B84B";
    case "AHORRO_TRIBUTARIO": return "#3FA687";
    case "INVERSION": return "#3FA687";
    case "DOCUMENTACION": return "#3FA687";
    case "AUTOMATIZACION": return "#3FA687";
    case "AI": return "#3FA687";
  }
}

export default function ExpertoDecisionesPage() {
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [filter, setFilter] = useState<"ALL" | DecisionCategory>("ALL");

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

  const filteredItems = data?.items.filter((i) => filter === "ALL" || i.category === filter) ?? [];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
        <p style={{ color: "var(--text-soft)", fontSize: 16 }}>Cargando decisiones...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: 0, textTransform: "uppercase" }}>
            Centro de Decisiones
          </p>
          <h1 style={{ color: "var(--text)", fontSize: "1.5rem", fontWeight: 900, margin: "4px 0 0" }}>
            Dashboard de Decisiones Tributarias
          </h1>
        </div>
        <button
          onClick={handleRebuild}
          disabled={rebuilding}
          style={{
            padding: "10px 22px",
            borderRadius: 999,
            border: "none",
            background: rebuilding ? "var(--bg-elev)" : "var(--accent)",
            color: "var(--text)",
            fontSize: 14,
            fontWeight: 800,
            cursor: rebuilding ? "not-allowed" : "pointer",
          }}
        >
          {rebuilding ? "Reconstruyendo..." : "Reconstruir cola"}
        </button>
      </div>

      {/* Expert KPI cards */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <KpiCard label="Usuarios críticos" value={data?.urgentCount ?? 0} detail="Requieren intervención" color="#C4634A" />
        <KpiCard label="Decisiones pendientes" value={data?.total ?? 0} detail="En cola total" color="var(--text)" />
        <KpiCard label="Ahorro potencial" value="—" detail="Por calcular" color="#3FA687" />
        <KpiCard label="Riesgo agregado" value={data?.urgentCount ?? 0} detail="Señales críticas" color="#E8B84B" />
      </section>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["ALL", "RIESGO", "CUMPLIMIENTO", "AHORRO_TRIBUTARIO", "INVERSION", "DOCUMENTACION", "AUTOMATIZACION", "AI"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: filter === cat ? "2px solid var(--accent)" : "1px solid var(--border)",
              background: filter === cat ? "rgba(15,118,110,0.10)" : "var(--bg-elev)",
              color: filter === cat ? "var(--accent)" : "var(--text-soft)",
              fontSize: 13,
              fontWeight: filter === cat ? 800 : 600,
              cursor: "pointer",
            }}
          >
            {cat === "ALL" ? "Todas" : `${CATEGORY_EMOJIS[cat]} ${CATEGORY_LABELS[cat]}`}
          </button>
        ))}
      </div>

      {/* Decision items table for expert */}
      {filteredItems.length === 0 ? (
        <section style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-soft)", borderRadius: 14, padding: 20, textAlign: "center" }}>
          <p style={{ color: "var(--accent)", fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>Sin decisiones pendientes</p>
          <p style={{ color: "var(--accent)", fontSize: 14, margin: 0 }}>
            {filter === "ALL" ? "No hay señales que requieran atención." : "No hay decisiones en esta categoría."}
          </p>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {filteredItems.map((item) => (
            <article
              key={item.id}
              style={{
                background: "var(--bg-elev)",
                border: "1px solid var(--border)",
                borderLeft: `4px solid ${priorityColor(item.priority)}`,
                borderRadius: 12,
                padding: "14px 18px",
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: 16,
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: categoryColor(item.category), textTransform: "uppercase" }}>
                    {CATEGORY_EMOJIS[item.category]} {CATEGORY_LABELS[item.category]}
                  </span>
                  <span style={{ fontSize: 11, color: priorityColor(item.priority), fontWeight: 800 }}>
                    [{PRIORITY_LABELS[item.priority]}]
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-soft)" }}>{item.source.replace("_", " ")}</span>
                </div>
                <p style={{ color: "var(--text)", fontSize: 15, fontWeight: 800, margin: 0 }}>{item.title}</p>
                <p style={{ color: "var(--text-soft)", fontSize: 13, margin: "2px 0 0" }}>{item.description}</p>
              </div>
              {item.impact && (
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: "var(--text)", fontSize: 18, fontWeight: 900, margin: 0 }}>{item.impact.value}</p>
                  <p style={{ color: "var(--text-soft)", fontSize: 11, margin: 0 }}>{item.impact.label}</p>
                </div>
              )}
              <Link
                href={item.actionHref}
                style={{
                  color: "var(--accent)",
                  fontSize: 13,
                  fontWeight: 850,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {item.actionLabel} →
              </Link>
            </article>
          ))}
        </div>
      )}

      {data && (
        <p style={{ color: "var(--text-soft)", fontSize: 12, textAlign: "center", margin: 0 }}>
          {filteredItems.length} de {data.total} decisiones — Última actualización: {new Date(data.generatedAt).toLocaleString("es-CL")}
        </p>
      )}
    </div>
  );
}

function KpiCard({ label, value, detail, color }: { label: string; value: number | string; detail: string; color: string }) {
  return (
    <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
      <p style={{ color: "var(--text-soft)", fontSize: 12, fontWeight: 800, margin: "0 0 6px" }}>{label}</p>
      <p style={{ color, fontSize: 22, fontWeight: 900, margin: 0 }}>{value}</p>
      <p style={{ color: "var(--text-soft)", fontSize: 12, margin: "2px 0 0" }}>{detail}</p>
    </article>
  );
}
