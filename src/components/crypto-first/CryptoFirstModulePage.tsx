"use client";

import { useEffect, useState } from "react";
import type { DigitalModuleDefinition } from "@/modules/digital-operating-system";
import { fonts } from "@/styles/tokens";

type Props = {
  module: DigitalModuleDefinition;
  sections?: string[];
};

type TaxEvent = {
  id: string;
  eventType: string;
  symbol: string;
  executedAt: string | null;
  quantity: number;
  effectiveTaxCategory: string;
  realizedPnlUsd: number;
  realizedPnlClp: number;
  proceedsGrossUsd: number;
  costBasisUsd: number;
};

type TaxHealthStatus = "OK" | "REVIEW" | "RISK";

type TaxHealth = {
  status: TaxHealthStatus;
  score: number;
  issues: Array<{ type: string; count: number; message: string }>;
};

const HEALTH_COLORS: Record<TaxHealthStatus, string> = {
  OK: "#16A34A",
  REVIEW: "#F59E0B",
  RISK: "#EF4444",
};

export function CryptoFirstModulePage({ module, sections = [] }: Props) {
  const [events, setEvents] = useState<TaxEvent[]>([]);
  const [taxHealth, setTaxHealth] = useState<TaxHealth | null>(null);
  const [totalEvents, setTotalEvents] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/tax/events", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;

        const data = json?.data;
        const eventList: TaxEvent[] = data?.events ?? [];
        setEvents(eventList);
        setTotalEvents(data?.totals?.totalEvents ?? eventList.length);

        const health: TaxHealth | undefined = data?.taxHealth;
        setTaxHealth(health ?? null);

        const pending = eventList.filter(
          (e: TaxEvent) =>
            e.effectiveTaxCategory === "PENDING" ||
            e.effectiveTaxCategory === "" ||
            e.effectiveTaxCategory == null,
        ).length;
        setPendingCount(pending);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  const healthStatus = taxHealth?.status ?? null;
  const healthColor = healthStatus ? HEALTH_COLORS[healthStatus] : "#94A3B8";
  const hasEvents = events.length > 0;

  const buckets = events.reduce<Record<string, number>>((acc, e) => {
    const cat = e.effectiveTaxCategory || "SIN_CLASIFICAR";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <main style={{ display: "grid", gap: 12, alignContent: "start" }}>
      <section style={{ padding: "0 14px 4px" }}>
        <p style={{ color: "#0F766E", fontSize: 11, fontWeight: 850, letterSpacing: "0.08em", margin: "0 0 6px", textTransform: "uppercase", fontFamily: fonts.body }}>
          Obligaciones Tributarias
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.3rem, 3.5vw, 1.8rem)", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>
              {module.label}
            </h1>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, maxWidth: 640, margin: 0, fontFamily: fonts.body }}>
              {module.description}
            </p>
          </div>
        </div>
      </section>

      <section style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #F8FFFB 100%)", border: "1px solid #D9F5E8", borderRadius: 24, padding: 18, boxShadow: "0 14px 34px rgba(15,42,61,0.06)", display: "grid", gap: 14 }}>
        {loading ? (
          <p style={{ color: "#64748B", fontSize: 13, fontFamily: fonts.body, margin: 0 }}>Cargando eventos tributarios…</p>
        ) : error ? (
          <p style={{ color: "#DC2626", fontSize: 13, fontFamily: fonts.body, margin: 0 }}>Error: {error}</p>
        ) : !hasEvents ? (
          <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 16, alignItems: "center" }}>
            <div style={{ width: 58, height: 58, borderRadius: 18, background: "#ECFDF5", color: "#0F766E", display: "grid", placeItems: "center", fontSize: 28, boxShadow: "inset 0 0 0 1px #BBF7D0" }}>
              🧾
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: "#0F766E", fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", margin: "0 0 5px", textTransform: "uppercase", fontFamily: fonts.body }}>
                Eventos tributarios desde Activos
              </p>
              <h2 style={{ color: "#0F2A3D", fontSize: "clamp(1.15rem,2vw,1.45rem)", fontWeight: 950, letterSpacing: "-0.04em", margin: "0 0 6px", fontFamily: fonts.display }}>
                Aún no hay eventos tributarios detectados
              </h2>
              <p style={{ color: "#475569", fontSize: 13.5, lineHeight: 1.45, margin: 0, maxWidth: 800, fontFamily: fonts.body }}>
                Cuando Activos tenga transacciones clasificadas, LEDGERA mostrará aquí ventas, swaps, staking, airdrops, retiros y movimientos sin respaldo que podrían afectar impuestos.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "8px 14px", color: "#0F2A3D", fontSize: 13, fontFamily: fonts.body }}>
                <strong>{totalEvents}</strong> eventos totales
              </span>
              {pendingCount > 0 && (
                <span style={{ background: "#FFFBF6", border: "1px solid #FFE8D6", borderRadius: 12, padding: "8px 14px", color: "#B45309", fontSize: 13, fontFamily: fonts.body }}>
                  <strong>{pendingCount}</strong> por revisar
                </span>
              )}
              {taxHealth && taxHealth.score != null && (
                <span style={{ background: `${healthColor}12`, border: `1px solid ${healthColor}24`, borderRadius: 12, padding: "8px 14px", color: healthColor, fontSize: 13, fontFamily: fonts.body }}>
                  Score: <strong>{taxHealth.score}</strong>/100
                </span>
              )}
            </div>

            {Object.keys(buckets).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(buckets).map(([cat, count]) => (
                  <button
                    key={cat}
                    type="button"
                    style={{ border: "1px solid #E2E8F0", background: "#FFFFFF", color: "#475569", borderRadius: 999, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontFamily: fonts.body }}
                  >
                    {cat.replace(/_/g, " ")} ({count})
                  </button>
                ))}
              </div>
            )}

            {taxHealth?.issues && taxHealth.issues.length > 0 && (
              <div style={{ marginTop: 2, display: "grid", gap: 6 }}>
                {taxHealth.issues.map((issue, i) => (
                  <div key={i} style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#B91C1C", fontFamily: fonts.body }}>
                    <strong>⚠ {issue.message}</strong> ({issue.count})
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {["Eventos detectados", "Revisión pendiente", "Respaldo documental", "Estado tributario"].map((title, index) => (
          <article key={title} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: "10px 14px", minHeight: "105px", display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#0F766E", fontSize: 12, fontWeight: 850 }}>{String(index + 1).padStart(2, "0")}</span>
            <h3 style={{ color: "#0F2A3D", fontSize: 18, fontWeight: 850, margin: "10px 0 8px", fontFamily: fonts.body }}>{title}</h3>
            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: 0, fontFamily: fonts.body }}>
              {sections[index] ?? "Se alimentará con datos del Sistema Operativo Crypto First."}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
