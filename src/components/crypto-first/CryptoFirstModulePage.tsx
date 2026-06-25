"use client";

import { useCallback, useEffect, useState } from "react";
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

type TaxAssistant = {
  title: string;
  summary: string;
  whatIsThis: string;
  whyItMatters: string;
  howToOperate: string[];
  fullFlow: string[];
  nextBestAction: string;
  safeDisclaimer: string;
};

const HEALTH_COLORS: Record<TaxHealthStatus, string> = {
  OK: "#16A34A",
  REVIEW: "#F59E0B",
  RISK: "#EF4444",
};

const DEFAULT_ASSISTANT: TaxAssistant = {
  title: "Cómo funciona esta sección",
  summary: "Obligaciones Tributarias toma información validada desde Activos y muestra solo lo que podría importar para impuestos.",
  whatIsThis: "Aquí no se ingresan datos manualmente. LEDGERA muestra operaciones que podrían necesitar revisión tributaria.",
  whyItMatters: "Algunas ventas, intercambios, rendimientos o movimientos sin respaldo pueden necesitar confirmación antes del cálculo.",
  howToOperate: [
    "Revisa si hay eventos detectados.",
    "Abre los eventos pendientes o sin respaldo.",
    "Confirma si la información es correcta.",
    "Valida o agrega respaldo cuando corresponda.",
    "Deja los eventos listos para cálculo.",
  ],
  fullFlow: [
    "Origen de Fondos carga información.",
    "Activos ordena y valida movimientos.",
    "Obligaciones Tributarias detecta eventos.",
    "El usuario confirma o corrige.",
    "El motor calcula con datos validados.",
  ],
  nextBestAction: "Primero revisa Activos. Cuando haya datos clasificados, aparecerán eventos aquí.",
  safeDisclaimer: "LEDGERA marca posibles efectos tributarios. No reemplaza la revisión final con información completa.",
};

export function CryptoFirstModulePage({ module, sections = [] }: Props) {
  const [events, setEvents] = useState<TaxEvent[]>([]);
  const [taxHealth, setTaxHealth] = useState<TaxHealth | null>(null);
  const [assistant, setAssistant] = useState<TaxAssistant>(DEFAULT_ASSISTANT);
  const [totalEvents, setTotalEvents] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildMessage, setRebuildMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isTaxObligations = module.key === "taxObligations";

  const loadEvents = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const [eventsRes, assistantRes] = await Promise.all([
        fetch("/api/tax/events", { cache: "no-store", credentials: "include" }),
        fetch("/api/tax/assistant", { cache: "no-store", credentials: "include" }),
      ]);

      if (!eventsRes.ok) throw new Error(`HTTP ${eventsRes.status}`);

      const eventsJson = await eventsRes.json();
      const assistantJson = assistantRes.ok ? await assistantRes.json() : null;

      const data = eventsJson?.data;
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
      setPendingCount(data?.totals?.pendingCount ?? pending);

      if (assistantJson?.data) setAssistant(assistantJson.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  async function handleRebuildTaxEvents() {
    setRebuilding(true);
    setRebuildMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/tax/events/rebuild", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || result?.ok === false) {
        throw new Error(result?.message || `HTTP ${response.status}`);
      }

      await loadEvents(false);

      const total = result?.data?.totalEvents;
      setRebuildMessage(
        typeof total === "number"
          ? `Eventos tributarios recalculados: ${total}.`
          : "Eventos tributarios recalculados correctamente.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible recalcular eventos tributarios.");
    } finally {
      setRebuilding(false);
    }
  }

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
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, maxWidth: 700, margin: 0, fontFamily: fonts.body }}>
              {assistant.summary}
            </p>
          </div>
          {isTaxObligations && (
            <button
              type="button"
              onClick={handleRebuildTaxEvents}
              disabled={loading || rebuilding}
              style={{
                background: loading || rebuilding ? "#94A3B8" : "#0F766E",
                border: "none",
                borderRadius: 999,
                color: "#FFFFFF",
                cursor: loading || rebuilding ? "not-allowed" : "pointer",
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: 850,
                padding: "10px 15px",
              }}
            >
              {rebuilding ? "Recalculando…" : "Recalcular eventos"}
            </button>
          )}
        </div>
      </section>

      <section style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #F8FFFB 100%)", border: "1px solid #D9F5E8", borderRadius: 24, padding: 18, boxShadow: "0 14px 34px rgba(15,42,61,0.06)", display: "grid", gap: 14 }}>
        {rebuildMessage && (
          <p style={{ background: "#ECFDF5", border: "1px solid #BBF7D0", borderRadius: 12, color: "#0F766E", fontSize: 13, fontFamily: fonts.body, fontWeight: 750, margin: 0, padding: "9px 12px" }}>
            {rebuildMessage}
          </p>
        )}
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
                Guía LEDGERA
              </p>
              <h2 style={{ color: "#0F2A3D", fontSize: "clamp(1.15rem,2vw,1.45rem)", fontWeight: 950, letterSpacing: "-0.04em", margin: "0 0 6px", fontFamily: fonts.display }}>
                {assistant.title}
              </h2>
              <p style={{ color: "#475569", fontSize: 13.5, lineHeight: 1.45, margin: 0, maxWidth: 820, fontFamily: fonts.body }}>
                {assistant.whatIsThis}
              </p>
              <p style={{ color: "#475569", fontSize: 13.5, lineHeight: 1.45, margin: "6px 0 0", maxWidth: 820, fontFamily: fonts.body }}>
                {assistant.nextBestAction}
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

            <div style={{ borderTop: "1px solid #D9F5E8", paddingTop: 12 }}>
              <p style={{ color: "#0F766E", fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", margin: "0 0 5px", textTransform: "uppercase", fontFamily: fonts.body }}>
                Qué hacer ahora
              </p>
              <h2 style={{ color: "#0F2A3D", fontSize: "clamp(1.05rem,2vw,1.28rem)", fontWeight: 950, letterSpacing: "-0.03em", margin: "0 0 6px", fontFamily: fonts.display }}>
                {assistant.title}
              </h2>
              <p style={{ color: "#475569", fontSize: 13.5, lineHeight: 1.45, margin: 0, fontFamily: fonts.body }}>
                {assistant.nextBestAction}
              </p>
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
        {[
          { title: "Qué es", text: assistant.whatIsThis },
          { title: "Por qué importa", text: assistant.whyItMatters },
          { title: "Cómo usarlo", text: assistant.howToOperate.slice(0, 3).join(" ") },
          { title: "Importante", text: assistant.safeDisclaimer },
        ].map((item, index) => (
          <article key={item.title} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: "10px 14px", minHeight: "105px", display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#0F766E", fontSize: 12, fontWeight: 850 }}>{String(index + 1).padStart(2, "0")}</span>
            <h3 style={{ color: "#0F2A3D", fontSize: 18, fontWeight: 850, margin: "10px 0 8px", fontFamily: fonts.body }}>{item.title}</h3>
            <p style={{ color: "#64748B", fontSize: 13.5, lineHeight: 1.45, margin: 0, fontFamily: fonts.body }}>
              {item.text}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
