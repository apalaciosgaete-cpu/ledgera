"use client";

import { useEffect, useState } from "react";

export default function SmartTaxScorePage() {
  const [score, setScore] = useState<{
    score: number;
    level: string;
    breakdown: Array<{ factor: string; label: string; score: number; maxScore: number; message: string }>;
    evaluatedAt: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tax-score");
        const json = await res.json();
        if (json.ok) setScore(json.data);
      } catch (error) {
        console.error("[score-tributario] error loading score", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleRecalculate() {
    setLoading(true);
    try {
      const res = await fetch("/api/tax-score/evaluate", { method: "POST" });
      const json = await res.json();
      if (json.ok) setScore({ ...json.data, evaluatedAt: new Date().toISOString() });
    } catch (error) {
      console.error("[score-tributario] error evaluating", error);
    } finally {
      setLoading(false);
    }
  }

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

  function recommendations(level: string): string[] {
    switch (level) {
      case "DEFICIENT":
        return [
          "Completa tu identidad tributaria.",
          "Clasifica las operaciones pendientes.",
          "Resuelve las alertas críticas.",
          "Configura conexiones de exchange o bancarias.",
        ];
      case "DEVELOPING":
        return [
          "Reduce las alertas abiertas.",
          "Completa los DTE pendientes.",
          "Mejora la clasificación de movimientos.",
        ];
      case "HEALTHY":
        return ["Mantén las sincronizaciones activas.", "Revisa la auditoría mensualmente."];
      case "OPTIMAL":
        return ["Estado tributario robusto.", "Mantén el monitoreo continuo."];
      default:
        return [];
    }
  }

  return (
    <section style={{ padding: 24 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 850, margin: "0 0 8px" }}>
          Score Tributario Inteligente
        </h1>
        <p style={{ color: "var(--text-soft)", margin: 0 }}>
          Medida de madurez, completitud y cumplimiento tributario.
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
            <p style={{ color: "var(--text-soft)", fontSize: 12, margin: "0 0 8px" }}>Smart Tax Score</p>
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
                    <strong>{item.label}</strong>
                    <span>
                      {item.score} / {item.maxScore}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-soft)", fontSize: 13, margin: 0 }}>{item.message}</p>
                </li>
              ))}
            </ul>
          </div>

          <div
            style={{
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 12px" }}>Recomendaciones</h2>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {recommendations(score.level).map((r, i) => (
                <li key={i} style={{ color: "var(--text)", marginBottom: 6 }}>
                  {r}
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
