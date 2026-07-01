"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type StagingItem = {
  id: string;
  source: string;
  sources: string[];
  provider: string;
  status: string;
  occurredAt: string;
  title: string;
  subtitle: string;
  amountLabel: string;
};

type StagingData = {
  items: StagingItem[];
  counts?: {
    pending?: number;
    review?: number;
    confirmed?: number;
    rejected?: number;
  };
};

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

const HEALTH_COLORS: Record<TaxHealthStatus, string> = {
  OK: "#16A34A",
  REVIEW: "#F59E0B",
  RISK: "#EF4444",
};

const DEFAULT_ASSISTANT: TaxAssistant = {
  title: "Cómo funciona esta sección",
  summary: "Obligaciones Tributarias se completa automáticamente con la información validada en Activos.",
  whatIsThis: "Aquí LEDGERA muestra operaciones que podrían tener efecto tributario. Las compras normalmente quedan como base de costo y no generan impuesto inmediato.",
  whyItMatters: "Ventas, permutas, rendimientos o movimientos sin respaldo pueden generar efectos tributarios. Las compras sirven para calcular la base de costo futura.",
  howToOperate: [
    "Revisa si hay eventos tributarios detectados.",
    "Si solo hay compras, valida que queden como base de costo.",
    "Cuando existan ventas o permutas, revisa ganancia o pérdida.",
    "Confirma o corrige eventos pendientes cuando aparezcan.",
    "Genera reportes solo con datos ya validados.",
  ],
  fullFlow: [
    "Origen de Fondos carga información.",
    "Importaciones valida y confirma operaciones.",
    "Activos consolida movimientos y saldos.",
    "Obligaciones Tributarias detecta eventos imponibles.",
    "Reportes prepara la salida final.",
  ],
  nextBestAction: "Si no hay eventos tributarios, revisa Activos y conserva las compras como base de costo para cálculos futuros.",
  safeDisclaimer: "LEDGERA marca posibles efectos tributarios. No reemplaza la revisión final con información completa.",
};

function extractAsset(item: StagingItem): string {
  const amountSymbol = item.amountLabel.match(/\b[A-Z0-9]{2,12}\b$/)?.[0];
  if (amountSymbol) return amountSymbol;
  const subtitleSymbol = item.subtitle.match(/·\s*([A-Z0-9]{2,12})\b/)?.[1];
  if (subtitleSymbol) return subtitleSymbol;
  return "ACTIVO";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function classifyConfirmedOperations(items: StagingItem[]) {
  const confirmed = items.filter((item) => item.status === "CONFIRMED");
  const assets = new Set(confirmed.map(extractAsset));
  const buys = confirmed.filter((item) => /compra|buy/i.test(item.title) || /buy/i.test(item.subtitle));
  const possibleTaxable = confirmed.filter((item) => /venta|sell|swap|permuta|retiro|withdraw|reward|staking|airdrop|earn/i.test(`${item.title} ${item.subtitle}`));

  return {
    confirmed,
    assetCount: assets.size,
    buyCount: buys.length,
    possibleTaxableCount: possibleTaxable.length,
  };
}

function StatPill({ label, value, tone }: { label: string; value: number; tone: "green" | "blue" | "amber" | "red" }) {
  const palette = {
    green: { bg: "rgba(22,163,74,0.09)", border: "rgba(22,163,74,0.24)", color: "#15803D" },
    blue: { bg: "rgba(37,99,235,0.08)", border: "rgba(37,99,235,0.22)", color: "#1D4ED8" },
    amber: { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.26)", color: "#B45309" },
    red: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.22)", color: "#DC2626" },
  }[tone];

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      borderRadius: 999,
      border: `1px solid ${palette.border}`,
      background: palette.bg,
      color: palette.color,
      padding: "7px 11px",
      fontFamily: fonts.body,
      fontSize: 12,
      fontWeight: 850,
      whiteSpace: "nowrap",
    }}>
      <strong>{value}</strong> {label}
    </span>
  );
}

function TaxNeutralState({
  confirmedCount,
  assetCount,
  buyCount,
}: {
  confirmedCount: number;
  assetCount: number;
  buyCount: number;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 16, alignItems: "center" }}>
      <div style={{ width: 58, height: 58, borderRadius: 18, background: "#ECFDF5", color: "#0F766E", display: "grid", placeItems: "center", fontSize: 28, boxShadow: "inset 0 0 0 1px #BBF7D0" }}>
        🧾
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ color: "#0F766E", fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", margin: "0 0 5px", textTransform: "uppercase", fontFamily: fonts.body }}>
          IA LEDGERA
        </p>
        <h2 style={{ color: "#0F2A3D", fontSize: "clamp(1.15rem,2vw,1.45rem)", fontWeight: 950, letterSpacing: "-0.04em", margin: "0 0 6px", fontFamily: fonts.display }}>
          No hay eventos tributarios imponibles detectados
        </h2>
        <p style={{ color: "#475569", fontSize: 13.5, lineHeight: 1.45, margin: 0, maxWidth: 900, fontFamily: fonts.body }}>
          Hay {confirmedCount} operaciones confirmadas y {assetCount} activos detectados. La IA interpreta que {buyCount} operación{buyCount === 1 ? "" : "es"} corresponde{buyCount === 1 ? "" : "n"} a compra/base de costo. Una compra spot normalmente no genera impuesto inmediato; queda registrada para calcular ganancia o pérdida cuando exista venta, permuta u otro evento tributariamente relevante.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <a href="/cryptoactivos" style={linkButton("primary")}>Revisar activos</a>
          <a href="/reportes" style={linkButton("secondary")}>Ir a reportes</a>
          <a href="/origen-fondos/documentacion" style={linkButton("secondary")}>Subir otro documento</a>
        </div>
      </div>
    </div>
  );
}

function linkButton(variant: "primary" | "secondary"): React.CSSProperties {
  return {
    minHeight: 34,
    padding: "8px 12px",
    borderRadius: 9,
    border: variant === "primary" ? "1px solid #0F766E" : "1px solid #CBD5E1",
    background: variant === "primary" ? "#0F766E" : "#FFFFFF",
    color: variant === "primary" ? "#FFFFFF" : "#475569",
    fontSize: 12,
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap",
    fontFamily: fonts.body,
  };
}

export function CryptoFirstModulePage({ module }: Props) {
  const [events, setEvents] = useState<TaxEvent[]>([]);
  const [taxHealth, setTaxHealth] = useState<TaxHealth | null>(null);
  const [assistant, setAssistant] = useState<TaxAssistant>(DEFAULT_ASSISTANT);
  const [stagingData, setStagingData] = useState<StagingData | null>(null);
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

      const requests: Promise<Response>[] = [
        fetch("/api/tax/events", { cache: "no-store", credentials: "include" }),
        fetch("/api/tax/assistant", { cache: "no-store", credentials: "include" }),
      ];

      if (isTaxObligations) {
        requests.push(fetch("/api/imports/staging", { cache: "no-store", credentials: "include" }));
      }

      const [eventsRes, assistantRes, stagingRes] = await Promise.all(requests);

      if (!eventsRes.ok) throw new Error(`HTTP ${eventsRes.status}`);

      const eventsJson = await eventsRes.json();
      const assistantJson = assistantRes.ok ? await assistantRes.json() : null;
      const stagingJson = stagingRes?.ok ? (await stagingRes.json()) as ApiResponse<StagingData> : null;

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
      if (stagingJson?.data) setStagingData(stagingJson.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [isTaxObligations]);

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

  const confirmedSummary = useMemo(
    () => classifyConfirmedOperations(stagingData?.items ?? []),
    [stagingData],
  );

  const healthStatus = taxHealth?.status ?? null;
  const healthColor = healthStatus ? HEALTH_COLORS[healthStatus] : "#94A3B8";
  const hasEvents = events.length > 0;
  const hasConfirmedOperations = confirmedSummary.confirmed.length > 0;

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
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, maxWidth: 760, margin: 0, fontFamily: fonts.body }}>
              {hasConfirmedOperations && !hasEvents
                ? "Tus activos ya tienen operaciones confirmadas. Esta pantalla indica si esas operaciones generan eventos tributarios imponibles."
                : assistant.summary}
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

        {!loading && !error && hasConfirmedOperations && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StatPill label="operaciones confirmadas" value={confirmedSummary.confirmed.length} tone="green" />
            <StatPill label="activos con base de costo" value={confirmedSummary.assetCount} tone="blue" />
            <StatPill label="compras/base de costo" value={confirmedSummary.buyCount} tone="amber" />
            <StatPill label="eventos imponibles detectados" value={events.length} tone={events.length > 0 ? "red" : "green"} />
          </div>
        )}

        {loading ? (
          <p style={{ color: "#64748B", fontSize: 13, fontFamily: fonts.body, margin: 0 }}>Cargando eventos tributarios…</p>
        ) : error ? (
          <p style={{ color: "#DC2626", fontSize: 13, fontFamily: fonts.body, margin: 0 }}>Error: {error}</p>
        ) : !hasEvents && hasConfirmedOperations ? (
          <TaxNeutralState
            confirmedCount={confirmedSummary.confirmed.length}
            assetCount={confirmedSummary.assetCount}
            buyCount={confirmedSummary.buyCount}
          />
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
          { title: "Qué es", text: hasConfirmedOperations && !hasEvents ? "Esta pantalla valida si las operaciones confirmadas generan eventos tributarios. Si solo hay compras, quedan como base de costo." : assistant.whatIsThis },
          { title: "Por qué importa", text: "Las compras no suelen tributar de inmediato, pero son necesarias para calcular costo y resultado cuando exista venta, permuta o retiro relevante." },
          { title: "Cómo usarlo", text: hasConfirmedOperations && !hasEvents ? "Revisa Activos. Si las cantidades son correctas, conserva esta información para reportes futuros o sube documentos adicionales." : assistant.howToOperate.slice(0, 3).join(" ") },
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
