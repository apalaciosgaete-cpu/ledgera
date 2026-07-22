"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import type { DigitalModuleDefinition } from "@/modules/digital-operating-system";
import { httpClient } from "@/shared/http/httpClient";
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
  realizedPnlClp?: number | null;
};

type StagingItem = {
  id: string;
  status: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  occurredAt?: string | null;
  provider?: string | null;
  source?: string | null;
  sources?: string[];
};

type StagingData = { items: StagingItem[] };
type ApiResponse<T> = { ok: boolean; message: string; data: T };
type TaxEventsData = { events: TaxEvent[] };

type TaxSummary = {
  confirmed: StagingItem[];
  reviewCount: number;
  assetCount: number;
  sources: string[];
  period: string;
};

type TaxAnalysis = {
  taxable: TaxEvent[];
  nonTaxable: TaxEvent[];
  pending: TaxEvent[];
  realizedPnlClp: number;
};

type AnalysisState = "CLEAR" | "REVIEW" | "IMPACT";

const card: CSSProperties = {
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: "16px 18px",
  boxShadow: "0 12px 26px rgba(15,42,61,0.04)",
};

const genericSourceLabels = new Set([
  "EXCHANGE",
  "EXCHANGES",
  "IMPORTACION",
  "IMPORTACIÓN",
  "API",
  "ARCHIVO",
]);

function extractAsset(item: StagingItem): string {
  return item.amountLabel.match(/\b[A-Z0-9]{2,12}\b$/)?.[0]
    ?? item.subtitle.match(/·\s*([A-Z0-9]{2,12})\b/)?.[1]
    ?? "ACTIVO";
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatUpdated(value: Date | null): string {
  if (!value) return "Sin actualización registrada";
  return value.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatClp(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildPeriod(items: StagingItem[]): string {
  const dates = items
    .map((item) => item.occurredAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => ({ value, timestamp: new Date(value).getTime() }))
    .filter((item) => Number.isFinite(item.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (dates.length === 0) return "Sin período disponible";
  const first = formatDate(dates[0].value);
  const last = formatDate(dates[dates.length - 1].value);
  return first === last ? first : `${first} al ${last}`;
}

function summarize(items: StagingItem[]): TaxSummary {
  const confirmed = items.filter((item) => item.status === "CONFIRMED");
  const reviewCount = items.filter(
    (item) => item.status === "PENDING" || item.status === "REVIEW",
  ).length;

  const rawSources = Array.from(new Set(
    confirmed
      .flatMap((item) => [item.provider, ...(item.sources ?? []), item.source])
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => value.trim()),
  ));

  const specificSources = rawSources.filter(
    (value) => !genericSourceLabels.has(value.toUpperCase()),
  );

  return {
    confirmed,
    reviewCount,
    assetCount: new Set(confirmed.map(extractAsset)).size,
    sources: (specificSources.length > 0 ? specificSources : rawSources)
      .sort((a, b) => a.localeCompare(b)),
    period: buildPeriod(confirmed),
  };
}

function analyzeEvents(events: TaxEvent[]): TaxAnalysis {
  const taxable: TaxEvent[] = [];
  const nonTaxable: TaxEvent[] = [];
  const pending: TaxEvent[] = [];

  for (const event of events) {
    const category = (event.effectiveTaxCategory ?? "").trim().toUpperCase();
    if (category === "CAPITAL_GAIN" || category === "ORDINARY_INCOME") taxable.push(event);
    else if (category === "NON_TAXABLE") nonTaxable.push(event);
    else pending.push(event);
  }

  return {
    taxable,
    nonTaxable,
    pending,
    realizedPnlClp: taxable.reduce(
      (total, event) => total + Number(event.realizedPnlClp ?? 0),
      0,
    ),
  };
}

function ButtonLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        minHeight: 38,
        padding: "9px 14px",
        borderRadius: 10,
        border: primary ? "1px solid var(--accent)" : "1px solid var(--border)",
        background: primary ? "var(--accent)" : "transparent",
        color: "var(--text)",
        fontSize: 12.5,
        fontWeight: 900,
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
        fontFamily: fonts.body,
      }}
    >
      {children}
    </Link>
  );
}

function MetricCard({ value, label, detail }: { value: number; label: string; detail: string }) {
  return (
    <article style={{ ...card, minHeight: 112, display: "grid", alignContent: "center", gap: 5, textAlign: "center" }}>
      <strong style={{ color: "var(--accent)", fontSize: 24, lineHeight: 1, fontFamily: fonts.display }}>{value}</strong>
      <span style={{ color: "var(--text)", fontSize: 14, fontWeight: 900 }}>{label}</span>
      <span style={{ color: "var(--text-soft)", fontSize: 12, lineHeight: 1.35 }}>{detail}</span>
    </article>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <span style={{ color: "var(--text-soft)", fontSize: 10.5, fontWeight: 850, letterSpacing: ".05em", textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color: "var(--text)", fontSize: 12.5, lineHeight: 1.35 }}>{value}</strong>
    </div>
  );
}

function GenericModulePage({ module, sections }: Props) {
  const cards = sections?.length
    ? sections
    : [
        "Esta sección se completará con información validada por LEDGERA.",
        "Carga y confirma movimientos para alimentar esta vista.",
      ];

  return (
    <main style={{ display: "grid", gap: 14, alignContent: "start" }}>
      <section style={{ padding: "0 14px 4px" }}>
        <p style={{ color: "var(--accent)", fontSize: 11, fontWeight: 850, letterSpacing: ".08em", margin: "0 0 6px", textTransform: "uppercase" }}>LEDGERA</p>
        <h1 style={{ color: "var(--text)", fontSize: "clamp(1.3rem,3.5vw,1.8rem)", fontWeight: 900, margin: 0, letterSpacing: "-.04em", fontFamily: fonts.display }}>{module.label}</h1>
      </section>
      <section style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
        {cards.map((text, index) => (
          <article key={text} style={card}>
            <span style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850 }}>{String(index + 1).padStart(2, "0")}</span>
            <p style={{ color: "var(--text)", fontSize: 13.5, lineHeight: 1.45, margin: "10px 0 0" }}>{text}</p>
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isTaxObligations = module.key === "taxObligations";

  const load = useCallback(async (showLoading = true): Promise<boolean> => {
    if (!isTaxObligations) return false;

    try {
      if (showLoading) setLoading(true);
      setError(null);

      const [eventsResponse, stagingResponse] = await Promise.all([
        httpClient<ApiResponse<TaxEventsData>>("/api/tax/events", { auth: true }),
        httpClient<ApiResponse<StagingData>>("/api/imports/staging", { auth: true }),
      ]);

      setEvents(eventsResponse.data?.events ?? []);
      setStaging(stagingResponse.data);
      setLastUpdated(new Date());
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible completar el análisis.");
      return false;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [isTaxObligations]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateAnalysis() {
    setRebuilding(true);
    setMessage(null);
    setError(null);

    try {
      const csrfResponse = await fetch("/api/csrf", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!csrfResponse.ok) {
        throw new Error("No fue posible preparar la actualización segura.");
      }

      await httpClient<ApiResponse<unknown>>("/api/tax/events/rebuild", {
        method: "POST",
        auth: true,
        body: {},
      });

      const refreshed = await load(false);
      if (!refreshed) {
        throw new Error("El análisis se actualizó, pero no fue posible recargar el resultado.");
      }
      setMessage("Análisis actualizado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar el análisis tributario.");
    } finally {
      setRebuilding(false);
    }
  }

  if (!isTaxObligations) {
    return <GenericModulePage module={module} sections={sections} />;
  }

  const summary = summarize(staging?.items ?? []);
  const taxAnalysis = analyzeEvents(events);
  const attentionCount = summary.reviewCount + taxAnalysis.pending.length;
  const hasConfirmed = summary.confirmed.length > 0;
  const analysisState: AnalysisState = attentionCount > 0
    ? "REVIEW"
    : taxAnalysis.taxable.length > 0
      ? "IMPACT"
      : "CLEAR";

  const resultCopy = analysisState === "REVIEW"
    ? {
        eyebrow: "Información pendiente",
        title: "Tu situación tributaria todavía no está completa",
        body: `Encontramos ${attentionCount} ${attentionCount === 1 ? "registro que necesita" : "registros que necesitan"} revisión antes de cerrar el análisis. El resultado puede cambiar cuando se complete esa información.`,
        signal: "#E8B84B",
      }
    : analysisState === "IMPACT"
      ? {
          eyebrow: "Revisión tributaria",
          title: "Detectamos operaciones que debes revisar",
          body: `LEDGERA calculó resultado para ${taxAnalysis.taxable.length} ${taxAnalysis.taxable.length === 1 ? "operación" : "operaciones"}. El resultado acumulado es ${formatClp(taxAnalysis.realizedPnlClp)}; esta cifra no corresponde todavía al impuesto final.`,
          signal: "var(--loss)",
        }
      : {
          eyebrow: "Estado tributario",
          title: "Sin impuestos por pagar",
          body: `LEDGERA revisó ${summary.confirmed.length} ${summary.confirmed.length === 1 ? "operación confirmada" : "operaciones confirmadas"} asociadas a ${summary.assetCount} ${summary.assetCount === 1 ? "activo" : "activos"}. No se encontraron eventos clasificados con impacto tributario en la información incorporada.`,
          signal: "#3FA687",
        };

  const sourceLabel = summary.sources.length > 0
    ? summary.sources.join(", ")
    : "Sin fuente identificada";

  return (
    <main style={{ display: "grid", gap: 16, alignContent: "start", paddingBottom: 64, fontFamily: fonts.body }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start", flexWrap: "wrap", padding: "0 14px 2px" }}>
        <div style={{ display: "grid", gap: 6, maxWidth: 900 }}>
          <p style={{ color: "var(--accent)", fontSize: 11, fontWeight: 900, letterSpacing: ".08em", margin: 0, textTransform: "uppercase" }}>Tu situación tributaria</p>
          <h1 style={{ color: "var(--text)", fontSize: "clamp(1.65rem,3.5vw,2.25rem)", fontWeight: 950, margin: 0, letterSpacing: "-.045em", fontFamily: fonts.display }}>Operaciones detectadas y resultado tributario</h1>
        </div>
        <div style={{ display: "grid", justifyItems: "end", gap: 7 }}>
          <span style={{ color: "var(--text-soft)", fontSize: 11.5 }}>Actualizado · {formatUpdated(lastUpdated)}</span>
          <button
            type="button"
            onClick={updateAnalysis}
            disabled={loading || rebuilding}
            style={{ minHeight: 38, border: "1px solid var(--border)", borderRadius: 10, background: "transparent", color: "var(--text)", cursor: loading || rebuilding ? "not-allowed" : "pointer", opacity: loading || rebuilding ? 0.6 : 1, fontSize: 12.5, fontWeight: 850, padding: "8px 13px" }}
          >
            {rebuilding ? "Actualizando…" : "Actualizar análisis"}
          </button>
        </div>
      </header>

      {message && <p role="status" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-soft)", borderRadius: 12, color: "var(--accent)", fontSize: 12.5, fontWeight: 750, margin: 0, padding: "9px 12px" }}>{message}</p>}

      {error && (
        <div role="alert" style={{ background: "rgba(196,99,74,0.12)", border: "1px solid rgba(196,99,74,0.28)", borderRadius: 14, color: "var(--loss)", fontSize: 12.5, fontWeight: 750, padding: "11px 13px", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span>{error}</span>
          {!staging && <button type="button" onClick={() => void load()} style={{ border: "1px solid currentColor", borderRadius: 9, background: "transparent", color: "inherit", padding: "7px 11px", cursor: "pointer", fontWeight: 850 }}>Reintentar</button>}
        </div>
      )}

      {loading ? (
        <section style={{ ...card, minHeight: 250, display: "grid", placeItems: "center", color: "var(--text-soft)", fontSize: 13 }}>Analizando tu situación tributaria…</section>
      ) : !hasConfirmed ? (
        <section style={{ ...card, minHeight: 250, display: "grid", placeItems: "center", textAlign: "center" }}>
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ color: "var(--text)", fontSize: "clamp(1.2rem,2.5vw,1.55rem)", fontWeight: 950, margin: "0 0 8px", fontFamily: fonts.display }}>Aún no hay operaciones para analizar</h2>
            <p style={{ color: "var(--text-soft)", fontSize: 13.5, lineHeight: 1.5, margin: "0 0 14px" }}>Primero incorpora información en Origen de Fondos y confirma los movimientos en Importaciones.</p>
            <ButtonLink href="/origen-fondos" primary>Incorporar información</ButtonLink>
          </div>
        </section>
      ) : (
        <>
          <section style={{ ...card, background: "var(--bg-elev)", border: "1px solid var(--border)", padding: "clamp(20px,3vw,30px)", display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span aria-hidden="true" style={{ width: 11, height: 11, flex: "0 0 11px", borderRadius: 999, background: resultCopy.signal, boxShadow: `0 0 0 4px color-mix(in srgb, ${resultCopy.signal} 16%, transparent)` }} />
              <p style={{ color: "var(--text-soft)", fontSize: 11, fontWeight: 900, letterSpacing: ".08em", margin: 0, textTransform: "uppercase" }}>{resultCopy.eyebrow}</p>
            </div>
            <h2 style={{ color: "var(--text)", fontSize: "clamp(1.45rem,3vw,2rem)", fontWeight: 950, margin: 0, letterSpacing: "-.035em", fontFamily: fonts.display }}>{resultCopy.title}</h2>
            <p style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.6, margin: 0, maxWidth: 920 }}>{resultCopy.body}</p>
            <p style={{ color: "var(--text-soft)", fontSize: 12, lineHeight: 1.5, margin: "2px 0 0" }}>Resultado preliminar basado únicamente en las operaciones y respaldos actualmente incorporados.</p>
          </section>

          <section aria-labelledby="tax-why" style={{ display: "grid", gap: 10 }}>
            <h2 id="tax-why" style={{ color: "var(--text)", fontSize: 16, fontWeight: 950, margin: 0, fontFamily: fonts.display }}>¿Por qué LEDGERA llegó a esta conclusión?</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 10 }}>
              <MetricCard value={summary.confirmed.length} label="Operaciones analizadas" detail="Movimientos confirmados incorporados al análisis." />
              <MetricCard value={summary.assetCount} label="Activos identificados" detail="Criptoactivos presentes en las operaciones confirmadas." />
              <MetricCard
                value={analysisState === "IMPACT" ? taxAnalysis.taxable.length : attentionCount}
                label={analysisState === "IMPACT" ? "Con posible impacto" : "Requieren revisión"}
                detail={analysisState === "IMPACT" ? "Operaciones con resultado tributario calculado." : "Registros que aún necesitan atención."}
              />
            </div>
          </section>

          <section style={{ ...card, display: "grid", gap: 10 }}>
            <div>
              <p style={{ color: "var(--accent)", fontSize: 11, fontWeight: 900, letterSpacing: ".07em", margin: "0 0 5px", textTransform: "uppercase" }}>Qué debes hacer ahora</p>
              <h2 style={{ color: "var(--text)", fontSize: "clamp(1.15rem,2vw,1.45rem)", fontWeight: 950, margin: "0 0 7px", fontFamily: fonts.display }}>
                {analysisState === "REVIEW"
                  ? `Revisa ${attentionCount} ${attentionCount === 1 ? "registro" : "registros"}`
                  : analysisState === "IMPACT"
                    ? "Revisa el cálculo antes de declarar"
                    : "No tienes tareas tributarias pendientes"}
              </h2>
              <p style={{ color: "var(--text-soft)", fontSize: 13.5, lineHeight: 1.55, margin: 0, maxWidth: 900 }}>
                {analysisState === "REVIEW"
                  ? "Completa o corrige la información pendiente para que LEDGERA pueda entregar un resultado confiable."
                  : analysisState === "IMPACT"
                    ? "Comprueba las operaciones incluidas, su resultado y los respaldos asociados antes de continuar con tu declaración."
                    : "Conserva los comprobantes y antecedentes de tus operaciones. LEDGERA los utilizará cuando exista una venta u otra operación con impacto tributario."}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 3 }}>
              {analysisState === "REVIEW" ? (
                <><ButtonLink href="/importaciones" primary>Resolver operaciones</ButtonLink><ButtonLink href="/cryptoactivos">Revisar activos</ButtonLink></>
              ) : analysisState === "IMPACT" ? (
                <><ButtonLink href="/declaraciones" primary>Revisar cálculo</ButtonLink><ButtonLink href="/cryptoactivos">Ver operaciones</ButtonLink></>
              ) : (
                <><ButtonLink href="/documentos" primary>Ver respaldo registrado</ButtonLink><ButtonLink href="/cryptoactivos">Revisar operaciones</ButtonLink></>
              )}
            </div>
          </section>

          <section style={{ ...card, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16 }}>
            <ContextItem label="Período analizado" value={summary.period} />
            <ContextItem label="Fuente incluida" value={sourceLabel} />
            <ContextItem label="Última actualización" value={formatUpdated(lastUpdated)} />
          </section>

          <details style={{ ...card, padding: 0, overflow: "hidden" }}>
            <summary style={{ cursor: "pointer", color: "var(--text)", fontSize: 13.5, fontWeight: 900, padding: "15px 18px", listStylePosition: "inside" }}>Ver detalle técnico</summary>
            <div style={{ borderTop: "1px solid var(--border)", padding: "14px 18px 18px", display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10 }}>
                <ContextItem label="Eventos calculados" value={String(events.length)} />
                <ContextItem label="Con posible impacto" value={String(taxAnalysis.taxable.length)} />
                <ContextItem label="No afectos" value={String(taxAnalysis.nonTaxable.length)} />
                <ContextItem label="Pendientes de clasificación" value={String(taxAnalysis.pending.length)} />
              </div>
              {taxAnalysis.taxable.length > 0 && <p style={{ color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>Resultado acumulado calculado: <strong style={{ color: "var(--text)" }}>{formatClp(taxAnalysis.realizedPnlClp)}</strong>. Este valor representa ganancia o pérdida calculada, no el impuesto final.</p>}
            </div>
          </details>

          <details style={{ ...card, padding: 0, overflow: "hidden" }}>
            <summary style={{ cursor: "pointer", color: "var(--text)", fontSize: 13.5, fontWeight: 900, padding: "15px 18px", listStylePosition: "inside" }}>Qué podría cambiar tu situación tributaria</summary>
            <div style={{ borderTop: "1px solid var(--border)", padding: "14px 18px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
              <article style={card}><strong style={{ color: "var(--text)", fontSize: 13.5 }}>Vender cripto</strong><p style={{ color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.45, margin: "6px 0 0" }}>Puede generar una ganancia o pérdida que deba calcularse.</p></article>
              <article style={card}><strong style={{ color: "var(--text)", fontSize: 13.5 }}>Intercambiar un activo por otro</strong><p style={{ color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.45, margin: "6px 0 0" }}>Un intercambio puede requerir revisión aunque no retires dinero al banco.</p></article>
              <article style={card}><strong style={{ color: "var(--text)", fontSize: 13.5 }}>Recibir staking, rewards o airdrops</strong><p style={{ color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.45, margin: "6px 0 0" }}>Estos ingresos pueden necesitar clasificación tributaria adicional.</p></article>
              <article style={card}><strong style={{ color: "var(--text)", fontSize: 13.5 }}>Mover fondos entre cuentas propias</strong><p style={{ color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.45, margin: "6px 0 0" }}>Conviene mantener respaldo para demostrar propiedad y trazabilidad.</p></article>
            </div>
          </details>
        </>
      )}
    </main>
  );
}
