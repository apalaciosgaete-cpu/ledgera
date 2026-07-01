"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function ExpertSmartTaxScorePage() {
  const [scores, setScores] = useState<
    Array<{ id: string; userId: string; score: number; level: string; evaluatedAt: string }>
  >([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (filter) params.set("level", filter);
        const res = await fetch(`/api/tax-score/list?${params.toString()}`);
        const json = await res.json();
        if (json.ok) setScores(json.data);
      } catch (error) {
        console.error("[experto/score-tributario] error loading scores", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [filter]);

  const distribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of scores) {
      map.set(s.level, (map.get(s.level) ?? 0) + 1);
    }
    return map;
  }, [scores]);

  function levelColor(level: string) {
    switch (level) {
      case "DEFICIENT":
        return "#C4634A";
      case "DEVELOPING":
        return "#E8B84B";
      case "HEALTHY":
        return "#3FA687";
      case "OPTIMAL":
        return "#3FA687";
      default:
        return "var(--text-soft)";
    }
  }

  const average = useMemo(() => {
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length);
  }, [scores]);

  return (
    <section style={{ padding: "24px 0" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 850, margin: "0 0 8px" }}>
          Score Tributario Inteligente
        </h1>
        <p style={{ color: "var(--text-soft)", margin: 0 }}>
          Madurez tributaria por usuario y distribución general.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(4, 1fr)",
          marginBottom: 24,
        }}
      >
        <Metric label="Promedio" value={average} />
        <Metric label="Deficientes" value={distribution.get("DEFICIENT") ?? 0} accent="danger" />
        <Metric label="En desarrollo" value={distribution.get("DEVELOPING") ?? 0} accent="warn" />
        <Metric label="Óptimos" value={distribution.get("OPTIMAL") ?? 0} accent="good" />
      </div>

      <div
        style={{
          background: "var(--bg-elev)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          marginBottom: 24,
          padding: 16,
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", fontSize: 12, gap: 4, maxWidth: 240 }}>
          Filtrar por nivel
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 4,
              fontSize: 13,
              padding: "6px 8px",
            }}
          >
            <option value="">Todos</option>
            <option value="DEFICIENT">DEFICIENT</option>
            <option value="DEVELOPING">DEVELOPING</option>
            <option value="HEALTHY">HEALTHY</option>
            <option value="OPTIMAL">OPTIMAL</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
        <Link
          href="/experto/riesgo"
          style={{
            background: "var(--accent)",
            borderRadius: 6,
            color: "var(--text)",
            display: "inline-block",
            fontWeight: 700,
            padding: "10px 16px",
            textDecoration: "none",
          }}
        >
          Ir a Riesgo
        </Link>
        <Link
          href="/experto/alertas"
          style={{
            background: "var(--bg-sunken)",
            borderRadius: 6,
            color: "var(--text)",
            display: "inline-block",
            fontWeight: 700,
            padding: "10px 16px",
            textDecoration: "none",
          }}
        >
          Ir a Alertas
        </Link>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : scores.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>No hay scores registrados.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {scores.map((item) => (
            <li
              key={item.id}
              style={{
                background: "var(--bg-elev)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                marginBottom: 12,
                padding: 16,
              }}
            >
              <div style={{ alignItems: "center", display: "flex", marginBottom: 8 }}>
                <strong style={{ flex: 1 }}>Usuario {item.userId}</strong>
                <span
                  style={{
                    color: levelColor(item.level),
                    fontSize: "1.25rem",
                    fontWeight: 850,
                  }}
                >
                  {item.score}
                </span>
              </div>
              <p style={{ color: "var(--text-soft)", fontSize: 13, margin: 0 }}>
                Nivel {item.level} · Evaluado{" "}
                {new Date(item.evaluatedAt).toLocaleDateString("es-CL")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  accent = "neutral",
}: {
  label: string;
  value: number;
  accent?: "neutral" | "good" | "warn" | "danger";
}) {
  const color =
    accent === "good" ? "#3FA687" : accent === "warn" ? "#E8B84B" : accent === "danger" ? "#C4634A" : "var(--text)";

  return (
    <article
      style={{
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 16,
      }}
    >
      <p
        style={{
          color: "var(--text-soft)",
          fontSize: 11,
          fontWeight: 850,
          letterSpacing: "0.04em",
          margin: "0 0 8px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <p style={{ color, fontSize: "1.75rem", fontWeight: 850, margin: 0 }}>{value}</p>
    </article>
  );
}
