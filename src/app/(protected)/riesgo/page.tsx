"use client";

import { useEffect, useState } from "react";

export default function RiskPage() {
  const [score, setScore] = useState<{ score: number; level: string; breakdown: Array<Record<string, unknown>>; evaluatedAt: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/risk/score");
        const json = await res.json();
        if (json.ok) setScore(json.data);
      } catch (error) {
        console.error("[riesgo] error loading score", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleRecalculate() {
    setLoading(true);
    try {
      const res = await fetch("/api/risk/evaluate", { method: "POST" });
      const json = await res.json();
      if (json.ok) setScore({ ...json.data, evaluatedAt: new Date().toISOString() });
    } catch (error) {
      console.error("[riesgo] error evaluating", error);
    } finally {
      setLoading(false);
    }
  }

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
    <section style={{ padding: 24 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 850, margin: "0 0 8px" }}>
          Riesgo Tributario
        </h1>
        <p style={{ color: "var(--text-soft)", margin: 0 }}>
          Evaluación preventiva de tu situación tributaria.
        </p>
      </header>

      {loading ? (
        <p>Cargando...</p>
      ) : score ? (
        <div style={{ display: "grid", gap: 16 }}>
          <div
            style={{
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 24,
              textAlign: "center",
            }}
          >
            <p style={{ color: "var(--text-soft)", fontSize: 12, margin: "0 0 8px" }}>Score actual</p>
            <p
              style={{
                color: levelColor(score.level),
                fontSize: "3rem",
                fontWeight: 850,
                margin: "0 0 8px",
              }}
            >
              {score.score}
              <span style={{ color: "var(--text-soft)", fontSize: "1rem" }}>/100</span>
            </p>
            <p style={{ color: levelColor(score.level), fontWeight: 700, margin: 0 }}>
              {score.level}
            </p>
            <button
              onClick={handleRecalculate}
              disabled={loading}
              style={{
                background: "var(--accent)",
                border: "none",
                borderRadius: 6,
                color: "var(--text)",
                cursor: "pointer",
                fontWeight: 700,
                marginTop: 16,
                padding: "10px 16px",
              }}
            >
              Recalcular
            </button>
          </div>

          <div
            style={{
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 12px" }}>Desglose por factor</h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {score.breakdown.map((item, index) => (
                <li
                  key={index}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    padding: "12px 0",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <strong>{String(item.label)}</strong>
                    <span>
                      {String(item.score)} / {String(item.maxScore)}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-soft)", fontSize: 13, margin: 0 }}>{String(item.message)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ color: "var(--text-soft)" }}>No hay score calculado.</p>
          <button
            onClick={handleRecalculate}
            style={{
              background: "var(--accent)",
              border: "none",
              borderRadius: 6,
              color: "var(--text)",
              cursor: "pointer",
              fontWeight: 700,
              padding: "10px 16px",
            }}
          >
            Evaluar ahora
          </button>
        </div>
      )}
    </section>
  );
}
