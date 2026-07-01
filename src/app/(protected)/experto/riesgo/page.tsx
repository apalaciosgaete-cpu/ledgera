"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ExpertRiskPage() {
  const [scores, setScores] = useState<
    Array<{
      id: string;
      userId: string;
      score: number;
      level: string;
      evaluatedAt: string;
    }>
  >([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (filter) params.set("level", filter);
        const res = await fetch(`/api/risk/scores?${params.toString()}`);
        const json = await res.json();
        if (json.ok) setScores(json.data);
      } catch (error) {
        console.error("[experto/riesgo] error loading scores", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [filter]);

  function levelColor(level: string) {
    switch (level) {
      case "CRITICAL":
        return "#C4634A";
      case "HIGH":
        return "#E8B84B";
      case "MEDIUM":
        return "#E8B84B";
      default:
        return "#3FA687";
    }
  }

  return (
    <section style={{ padding: "24px 0" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 850, margin: "0 0 8px" }}>
          Panel de Riesgo Tributario
        </h1>
        <p style={{ color: "var(--text-soft)", margin: 0 }}>
          Usuarios con mayor riesgo tributario y desglose resumido.
        </p>
      </header>

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
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Link
          href="/experto/alertas"
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
