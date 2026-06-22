"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Recommendation = {
  id: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  status: string;
  sourceType: string;
  sourceId: string | null;
  createdAt: string;
  updatedAt: string;
};

const priorityLabel: Record<Recommendation["priority"], string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

const priorityColor: Record<Recommendation["priority"], string> = {
  LOW: "#64748B",
  MEDIUM: "#B45309",
  HIGH: "#DC2626",
  CRITICAL: "#991B1B",
};

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/recommendations?status=ACTIVE", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Error cargando recomendaciones.");
      setRecommendations(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleAction(id: string, action: "dismiss" | "complete") {
    try {
      const res = await fetch(`/api/recommendations/${id}/${action}`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Error actualizando recomendación.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    }
  }

  async function regenerate() {
    try {
      setLoading(true);
      const res = await fetch("/api/recommendations/generate", {
        method: "POST",
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Error regenerando recomendaciones.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ maxWidth: 800, width: "100%" }}>
      <header style={{ marginBottom: 24 }}>
        <p
          style={{
            color: "#0F766E",
            fontSize: 12,
            fontWeight: 850,
            letterSpacing: "0.06em",
            margin: "0 0 7px",
            textTransform: "uppercase",
          }}
        >
          Recomendaciones
        </p>
        <h1
          style={{
            color: "#0F2A3D",
            fontSize: "1.9rem",
            fontWeight: 850,
            lineHeight: 1.12,
            margin: "0 0 8px",
          }}
        >
          Qué hacer ahora
        </h1>
        <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          Acciones claras para mantener tu situación tributaria en orden.
        </p>
      </header>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button
          onClick={regenerate}
          disabled={loading}
          style={{
            background: "#0F766E",
            border: "none",
            borderRadius: 8,
            color: "#FFFFFF",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 850,
            padding: "11px 16px",
          }}
        >
          {loading ? "Analizando…" : "Actualizar recomendaciones"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            color: "#991B1B",
            fontWeight: 750,
            marginBottom: 24,
            padding: 16,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#64748B", fontSize: 14 }}>Cargando recomendaciones…</p>
      ) : recommendations.length === 0 ? (
        <EmptyState onRefresh={regenerate} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {recommendations.map((r) => (
            <RecommendationCard
              key={r.id}
              recommendation={r}
              onDismiss={() => handleAction(r.id, "dismiss")}
              onComplete={() => handleAction(r.id, "complete")}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RecommendationCard({
  recommendation,
  onDismiss,
  onComplete,
}: {
  recommendation: Recommendation;
  onDismiss: () => void;
  onComplete: () => void;
}) {
  return (
    <article
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderLeft: `4px solid ${priorityColor[recommendation.priority]}`,
        borderRadius: 12,
        padding: "20px",
      }}
    >
      <div style={{ alignItems: "center", display: "flex", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <span
          style={{
            color: priorityColor[recommendation.priority],
            fontSize: 11,
            fontWeight: 850,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {priorityLabel[recommendation.priority]}
        </span>
        <span style={{ color: "#94A3B8", fontSize: 11 }}>• {categoryLabel(recommendation.category)}</span>
      </div>

      <h2
        style={{
          color: "#0F2A3D",
          fontSize: "1.15rem",
          fontWeight: 850,
          lineHeight: 1.25,
          margin: "0 0 8px",
        }}
      >
        {recommendation.title}
      </h2>
      <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.55, margin: "0 0 16px" }}>
        {recommendation.description}
      </p>

      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 12 }}>
        <Link
          href={recommendation.actionUrl}
          onClick={onComplete}
          style={{
            background: "#0F766E",
            borderRadius: 8,
            color: "#FFFFFF",
            display: "inline-flex",
            fontSize: 14,
            fontWeight: 850,
            padding: "10px 16px",
            textDecoration: "none",
          }}
        >
          {recommendation.actionLabel}
        </Link>
        <button
          onClick={onDismiss}
          style={{
            background: "transparent",
            border: "1px solid #CBD5E1",
            borderRadius: 8,
            color: "#64748B",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 750,
            padding: "9px 14px",
          }}
        >
          Descartar
        </button>
      </div>
    </article>
  );
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div
      style={{
        background: "#F0FDF4",
        border: "1px solid #86EFAC",
        borderRadius: 12,
        padding: "32px 24px",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 28, margin: "0 0 10px" }}>✅</p>
      <h2
        style={{
          color: "#166534",
          fontSize: "1.15rem",
          fontWeight: 850,
          margin: "0 0 8px",
        }}
      >
        Todo en orden
      </h2>
      <p style={{ color: "#166534", fontSize: 14, lineHeight: 1.55, margin: "0 0 18px" }}>
        No tienes recomendaciones activas. Sigue así.
      </p>
      <button
        onClick={onRefresh}
        style={{
          background: "#166534",
          border: "none",
          borderRadius: 8,
          color: "#FFFFFF",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 850,
          padding: "10px 16px",
        }}
      >
        Revisar de nuevo
      </button>
    </div>
  );
}

function categoryLabel(category: string): string {
  switch (category) {
    case "TRIBUTARY":
      return "Tributario";
    case "COMPLIANCE":
      return "Cumplimiento";
    case "OPERATIONS":
      return "Operaciones";
    case "CONNECTIONS":
      return "Conexiones";
    case "BILLING":
      return "Suscripción";
    case "RISK":
      return "Riesgo";
    default:
      return category;
  }
}
