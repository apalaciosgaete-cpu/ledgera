"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Problem = {
  severity: "high" | "medium" | "low";
  label: string;
  detail: string;
};

type HealthData = {
  score: number;
  label: string;
  color: string;
  icon: string;
  totalMovements: number;
  totalEvents: number;
  sellWithoutEvent: number;
  orphanEvents: number;
  unknownTypeCount: number;
  missingPriceCount: number;
  missingQuantityCount: number;
  futureDateCount: number;
  problems: Problem[];
  recommendations: string[];
};

function severityBg(severity: Problem["severity"]) {
  switch (severity) {
    case "high": return { bg: "#FEF2F2", border: "#FCA5A5", color: "#991B1B" };
    case "medium": return { bg: "#FEF9C3", border: "#FDE047", color: "#854D0E" };
    case "low": return { bg: "#F0FDF4", border: "#86EFAC", color: "#166534" };
  }
}

export default function SaludPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tax/health", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo cargar la salud tributaria.");
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando salud.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div style={{ maxWidth: 800, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Salud tributaria</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>¿Cómo están tus datos?</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Score, problemas detectados y recomendaciones para mejorar tu estado tributario.
          </p>
        </div>
        <Link href="/impuestos" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver al centro tributario
        </Link>
      </section>

      {loading ? (
        <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando salud tributaria...</p>
      ) : error ? (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>
          {error}
        </div>
      ) : data ? (
        <>
          <section style={{ background: data.color + "14", border: `2px solid ${data.color}44`, borderRadius: 12, marginBottom: 24, padding: "28px 24px", textAlign: "center" }}>
            <p style={{ color: "#64748B", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>Score tributario</p>
            <p style={{ color: data.color, fontSize: "3.5rem", fontWeight: 850, lineHeight: 1, margin: "0 0 8px" }}>{data.score}</p>
            <p style={{ color: data.color, fontSize: "1.35rem", fontWeight: 850, margin: "0 0 6px" }}>{data.icon} {data.label}</p>
            <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>De 100 posibles</p>
          </section>

          <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: 24 }}>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16, textAlign: "center" }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Movimientos</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.6rem", fontWeight: 850, lineHeight: 1.15, margin: 0 }}>{data.totalMovements}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16, textAlign: "center" }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Eventos</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.6rem", fontWeight: 850, lineHeight: 1.15, margin: 0 }}>{data.totalEvents}</p>
            </article>
            <article style={{ background: data.sellWithoutEvent > 0 ? "#FEF2F2" : "#F0FDF4", border: `1px solid ${data.sellWithoutEvent > 0 ? "#FCA5A5" : "#86EFAC"}`, borderRadius: 8, padding: 16, textAlign: "center" }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Ventas sin evento</p>
              <p style={{ color: data.sellWithoutEvent > 0 ? "#991B1B" : "#166534", fontSize: "1.6rem", fontWeight: 850, lineHeight: 1.15, margin: 0 }}>{data.sellWithoutEvent}</p>
            </article>
            <article style={{ background: data.orphanEvents > 0 ? "#FEF2F2" : "#F0FDF4", border: `1px solid ${data.orphanEvents > 0 ? "#FCA5A5" : "#86EFAC"}`, borderRadius: 8, padding: 16, textAlign: "center" }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Eventos huérfanos</p>
              <p style={{ color: data.orphanEvents > 0 ? "#991B1B" : "#166534", fontSize: "1.6rem", fontWeight: 850, lineHeight: 1.15, margin: 0 }}>{data.orphanEvents}</p>
            </article>
            <article style={{ background: data.unknownTypeCount > 0 ? "#FEF9C3" : "#F0FDF4", border: `1px solid ${data.unknownTypeCount > 0 ? "#FDE047" : "#86EFAC"}`, borderRadius: 8, padding: 16, textAlign: "center" }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Tipos desconocidos</p>
              <p style={{ color: data.unknownTypeCount > 0 ? "#854D0E" : "#166534", fontSize: "1.6rem", fontWeight: 850, lineHeight: 1.15, margin: 0 }}>{data.unknownTypeCount}</p>
            </article>
            <article style={{ background: data.missingPriceCount > 0 ? "#FEF9C3" : "#F0FDF4", border: `1px solid ${data.missingPriceCount > 0 ? "#FDE047" : "#86EFAC"}`, borderRadius: 8, padding: 16, textAlign: "center" }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Sin precio</p>
              <p style={{ color: data.missingPriceCount > 0 ? "#854D0E" : "#166534", fontSize: "1.6rem", fontWeight: 850, lineHeight: 1.15, margin: 0 }}>{data.missingPriceCount}</p>
            </article>
          </section>

          {data.problems.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <h2 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 12px" }}>Problemas detectados</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {data.problems.map((p, i) => {
                  const token = severityBg(p.severity);
                  return (
                    <div key={i} style={{ background: token.bg, border: `1px solid ${token.border}`, borderRadius: 8, color: token.color, padding: "14px 16px" }}>
                      <p style={{ fontWeight: 850, margin: "0 0 4px" }}>{p.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.5, margin: 0 }}>{p.detail}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 8, padding: 20 }}>
            <h2 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 12px" }}>Recomendaciones</h2>
            <ul style={{ color: "#475569", display: "grid", gap: 8, listStyle: "none", margin: 0, padding: 0 }}>
              {data.recommendations.map((r, i) => (
                <li key={i} style={{ alignItems: "flex-start", display: "flex", gap: 8 }}>
                  <span style={{ color: "#0F766E", flexShrink: 0, fontSize: 14, fontWeight: 850 }}>→</span>
                  <span style={{ fontSize: 14, lineHeight: 1.5 }}>{r}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
