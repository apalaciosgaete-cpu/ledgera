"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
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
  effectiveTaxCategory?: string | null;
};

type StagingItem = {
  id: string;
  status: string;
  title: string;
  subtitle: string;
  amountLabel: string;
};

type StagingData = {
  items: StagingItem[];
};

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

type TaxSummary = {
  confirmed: StagingItem[];
  assetCount: number;
  buyCount: number;
  sellOrSwapCount: number;
  yieldCount: number;
  transferLikeCount: number;
};

const card: CSSProperties = {
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: "14px 16px",
  boxShadow: "0 12px 26px rgba(15,42,61,0.04)",
};

function extractAsset(item: StagingItem): string {
  const fromAmount = item.amountLabel.match(/\b[A-Z0-9]{2,12}\b$/)?.[0];
  if (fromAmount) return fromAmount;
  const fromSubtitle = item.subtitle.match(/·\s*([A-Z0-9]{2,12})\b/)?.[1];
  return fromSubtitle ?? "ACTIVO";
}

function summarize(items: StagingItem[]): TaxSummary {
  const confirmed = items.filter((item) => item.status === "CONFIRMED");
  const text = (item: StagingItem) => `${item.title} ${item.subtitle}`;

  return {
    confirmed,
    assetCount: new Set(confirmed.map(extractAsset)).size,
    buyCount: confirmed.filter((item) => /compra|buy/i.test(text(item))).length,
    sellOrSwapCount: confirmed.filter((item) => /venta|sell|swap|permuta/i.test(text(item))).length,
    yieldCount: confirmed.filter((item) => /staking|reward|airdrop|earn|rendimiento/i.test(text(item))).length,
    transferLikeCount: confirmed.filter((item) => /retiro|withdraw|deposit|deposito|transfer/i.test(text(item))).length,
  };
}

function Pill({ label, value, tone }: { label: string; value: number | string; tone: "green" | "amber" | "blue" | "red" | "slate" }) {
  const palette = {
    green: { bg: "rgba(22,163,74,0.09)", border: "rgba(22,163,74,0.24)", color: "var(--accent)" },
    amber: { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.26)", color: "var(--warn)" },
    blue: { bg: "rgba(37,99,235,0.08)", border: "rgba(37,99,235,0.22)", color: "var(--accent)" },
    red: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.22)", color: "var(--loss)" },
    slate: { bg: "var(--bg-sunken)", border: "var(--border)", color: "var(--text)" },
  }[tone];

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.color, padding: "7px 11px", fontFamily: fonts.body, fontSize: 12, fontWeight: 850, whiteSpace: "nowrap" }}>
      <strong>{value}</strong> {label}
    </span>
  );
}

function ButtonLink({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <a href={href} style={{ minHeight: 34, padding: "8px 12px", borderRadius: 9, border: primary ? "1px solid var(--accent)" : "1px solid var(--border)", background: primary ? "var(--accent)" : "var(--bg-elev)", color: primary ? "var(--text)" : "var(--text)", fontSize: 12, fontWeight: 900, textDecoration: "none", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", fontFamily: fonts.body }}>
      {children}
    </a>
  );
}

function DecisionCard({ title, status, text, tone }: { title: string; status: string; text: string; tone: "green" | "amber" }) {
  const color = tone === "green" ? "#3FA687" : "#E8B84B";
  const bg = tone === "green" ? "rgba(22,163,74,0.08)" : "rgba(245,158,11,0.10)";
  const border = tone === "green" ? "rgba(22,163,74,0.24)" : "rgba(245,158,11,0.26)";

  return (
    <article style={{ ...card, border: `1px solid ${border}`, background: bg }}>
      <p style={{ color, fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", margin: "0 0 8px", textTransform: "uppercase", fontFamily: fonts.body }}>{title}</p>
      <h3 style={{ color: "var(--text)", fontSize: 19, fontWeight: 950, margin: "0 0 6px", fontFamily: fonts.display }}>{status}</h3>
      <p style={{ color: "var(--text)", fontSize: 13.5, lineHeight: 1.45, margin: 0, fontFamily: fonts.body }}>{text}</p>
    </article>
  );
}

function PredictiveCard({ title, text }: { title: string; text: string }) {
  return (
    <article style={card}>
      <h3 style={{ color: "var(--text)", fontSize: 15, fontWeight: 900, margin: "0 0 6px", fontFamily: fonts.body }}>{title}</h3>
      <p style={{ color: "var(--text-soft)", fontSize: 13, lineHeight: 1.45, margin: 0, fontFamily: fonts.body }}>{text}</p>
    </article>
  );
}

function GenericModulePage({ module, sections }: Props) {
  const cards = sections?.length ? sections : ["Esta sección se completará con información validada por LEDGERA.", "Carga y confirma movimientos para alimentar esta vista."];

  return (
    <main style={{ display: "grid", gap: 14, alignContent: "start" }}>
      <section style={{ padding: "0 14px 4px" }}>
        <p style={{ color: "var(--accent)", fontSize: 11, fontWeight: 850, letterSpacing: "0.08em", margin: "0 0 6px", textTransform: "uppercase", fontFamily: fonts.body }}>LEDGERA</p>
        <h1 style={{ color: "var(--text)", fontSize: "clamp(1.3rem, 3.5vw, 1.8rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.04em", fontFamily: fonts.display }}>{module.label}</h1>
      </section>
      <section style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {cards.map((text, index) => (
          <article key={text} style={card}>
            <span style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850 }}>{String(index + 1).padStart(2, "0")}</span>
            <p style={{ color: "var(--text)", fontSize: 13.5, lineHeight: 1.45, margin: "10px 0 0", fontFamily: fonts.body }}>{text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export function CryptoFirstModulePage({ module, sections }: Props) {
  const [events, setEvents] = useState<TaxEvent[]>([]);
  const [staging, setStaging] = useState<StagingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isTaxObligations = module.key === "taxObligations";

  const load = useCallback(async (showLoading = true) => {
    if (!isTaxObligations) return;

    try {
      if (showLoading) setLoading(true);
      setError(null);
      const [eventsRes, stagingRes] = await Promise.all([
        fetch("/api/tax/events", { cache: "no-store", credentials: "include" }),
        fetch("/api/imports/staging", { cache: "no-store", credentials: "include" }),
      ]);

      if (!eventsRes.ok) throw new Error(`HTTP ${eventsRes.status}`);
      const eventsJson = await eventsRes.json();
      const stagingJson = stagingRes.ok ? (await stagingRes.json()) as ApiResponse<StagingData> : null;

      setEvents(eventsJson?.data?.events ?? []);
      if (stagingJson?.data) setStaging(stagingJson.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [isTaxObligations]);

  useEffect(() => { void load(); }, [load]);

  async function rebuildTaxEvents() {
    setRebuilding(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/tax/events/rebuild", { method: "POST", cache: "no-store", credentials: "include" });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok === false) throw new Error(result?.message || `HTTP ${response.status}`);
      await load(false);
      setMessage("Eventos tributarios recalculados correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible recalcular eventos tributarios.");
    } finally {
      setRebuilding(false);
    }
  }

  if (!isTaxObligations) return <GenericModulePage module={module} sections={sections} />;

  const summary = summarize(staging?.items ?? []);
  const hasConfirmed = summary.confirmed.length > 0;
  const hasTaxEvents = events.length > 0;

  return (
    <main style={{ display: "grid", gap: 12, alignContent: "start" }}>
      <section style={{ padding: "0 14px 4px" }}>
        <p style={{ color: "var(--accent)", fontSize: 11, fontWeight: 850, letterSpacing: "0.08em", margin: "0 0 6px", textTransform: "uppercase", fontFamily: fonts.body }}>Situación tributaria</p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ color: "var(--text)", fontSize: "clamp(1.3rem, 3.5vw, 1.8rem)", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>Declaración e impacto tributario</h1>
            <p style={{ color: "var(--text-soft)", fontSize: 13, lineHeight: 1.5, maxWidth: 820, margin: 0, fontFamily: fonts.body }}>
              LEDGERA separa lo que debes respaldar o declarar de lo que podría generar impuesto efectivo a pagar.
            </p>
          </div>
          <button type="button" onClick={rebuildTaxEvents} disabled={loading || rebuilding} style={{ background: loading || rebuilding ? "var(--bg-elev)" : "var(--accent)", border: "none", borderRadius: 999, color: "var(--text)", cursor: loading || rebuilding ? "not-allowed" : "pointer", fontFamily: fonts.body, fontSize: 13, fontWeight: 850, padding: "10px 15px" }}>
            {rebuilding ? "Recalculando…" : "Recalcular eventos"}
          </button>
        </div>
      </section>

      <section style={{ background: "linear-gradient(135deg, var(--bg-elev) 0%, var(--bg-elev) 100%)", border: "1px solid var(--border)", borderRadius: 24, padding: 18, boxShadow: "0 14px 34px rgba(15,42,61,0.06)", display: "grid", gap: 14 }}>
        {message && <p style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-soft)", borderRadius: 12, color: "var(--accent)", fontSize: 13, fontFamily: fonts.body, fontWeight: 750, margin: 0, padding: "9px 12px" }}>{message}</p>}
        {error && <p style={{ background: "rgba(196,99,74,0.14)", border: "1px solid rgba(196,99,74,0.14)", borderRadius: 12, color: "var(--loss)", fontSize: 13, fontFamily: fonts.body, fontWeight: 750, margin: 0, padding: "9px 12px" }}>Error: {error}</p>}

        {loading ? (
          <p style={{ color: "var(--text-soft)", fontSize: 13, fontFamily: fonts.body, margin: 0 }}>Cargando situación tributaria…</p>
        ) : !hasConfirmed ? (
          <article style={card}>
            <h2 style={{ color: "var(--text)", fontSize: "clamp(1.15rem,2vw,1.45rem)", fontWeight: 950, margin: "0 0 6px", fontFamily: fonts.display }}>Aún no hay operaciones para analizar</h2>
            <p style={{ color: "var(--text)", fontSize: 13.5, lineHeight: 1.45, margin: 0, fontFamily: fonts.body }}>Primero carga información en Origen de Fondos, confirma movimientos en Importaciones y revisa Activos.</p>
          </article>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
              <DecisionCard title="Declaración / respaldo" status="Información tributaria registrada" tone="amber" text={`${summary.confirmed.length} operaciones documentadas y ${summary.assetCount} activos con base de costo. Aunque no haya impuesto inmediato, esta información debe conservarse para respaldo y futuras declaraciones.`} />
              <DecisionCard title="Pago estimado" status={hasTaxEvents ? "Requiere cálculo" : "Sin impuesto inmediato detectado"} tone={hasTaxEvents ? "amber" : "green"} text={hasTaxEvents ? "LEDGERA detectó eventos que podrían generar impuesto. Revisa su clasificación y resultado." : "No hay ventas, permutas ni rendimientos detectados. Con la información actual, no se observa impuesto inmediato a pagar."} />
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Pill label="operaciones confirmadas" value={summary.confirmed.length} tone="green" />
              <Pill label="activos con base de costo" value={summary.assetCount} tone="blue" />
              <Pill label="compras/base de costo" value={summary.buyCount} tone="amber" />
              <Pill label="ventas/permutas" value={summary.sellOrSwapCount} tone={summary.sellOrSwapCount > 0 ? "red" : "slate"} />
              <Pill label="rendimientos" value={summary.yieldCount} tone={summary.yieldCount > 0 ? "red" : "slate"} />
              <Pill label="eventos imponibles detectados" value={events.length} tone={events.length > 0 ? "red" : "green"} />
            </div>

            <article style={{ ...card, border: "1px solid var(--accent-soft)", background: "var(--bg-elev)" }}>
              <p style={{ color: "var(--accent)", fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", margin: "0 0 6px", textTransform: "uppercase", fontFamily: fonts.body }}>IA LEDGERA dice</p>
              <h2 style={{ color: "var(--text)", fontSize: "clamp(1.12rem,2vw,1.35rem)", fontWeight: 950, margin: "0 0 8px", fontFamily: fonts.display }}>No pagar hoy no significa no declarar ni respaldar</h2>
              <p style={{ color: "var(--text)", fontSize: 13.5, lineHeight: 1.5, margin: 0, fontFamily: fonts.body }}>
                Detecté {summary.confirmed.length} operaciones asociadas a {summary.assetCount} activos. {summary.buyCount > 0 ? `Interpreto que ${summary.buyCount} ${summary.buyCount === 1 ? "operación corresponde" : "operaciones corresponden"} a compra/base de costo. ` : ""}Una compra spot normalmente no genera impuesto inmediato a pagar, pero sí es relevante para declarar, respaldar y calcular costo tributario futuro.
              </p>
              <p style={{ color: "var(--text)", fontSize: 13.5, lineHeight: 1.5, margin: "6px 0 0", fontFamily: fonts.body }}>
                Cuando exista venta, permuta, retiro tributariamente relevante, staking, reward o airdrop, usaré esta base de costo para estimar ganancia, pérdida e impacto tributario.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <ButtonLink href="/cryptoactivos" primary>Revisar activos</ButtonLink>
                <ButtonLink href="/origen-fondos/documentacion">Subir otro documento</ButtonLink>
                <ButtonLink href="/reportes">Preparar reportes</ButtonLink>
              </div>
            </article>
          </>
        )}
      </section>

      <section style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <PredictiveCard title="Si vendes cripto" text="LEDGERA calculará ganancia o pérdida usando la base de costo registrada." />
        <PredictiveCard title="Si haces swap o permuta" text="Puede existir evento tributario aunque no retires dinero a banco." />
        <PredictiveCard title="Si recibes staking, rewards o airdrops" text="La operación puede requerir clasificación tributaria adicional." />
        <PredictiveCard title="Si mueves entre wallets propias" text="Normalmente no debería ser venta, pero conviene respaldar propiedad y trazabilidad." />
      </section>
    </main>
  );
}
