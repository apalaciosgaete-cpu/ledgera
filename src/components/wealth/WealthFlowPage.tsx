"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { httpClient } from "@/shared/http/httpClient";
import { fonts } from "@/styles/tokens";

type WealthStepKey = "origen-fondos" | "activos";
type SourceOptionKey = "bancos" | "exchanges" | "wallets" | "documentacion";
type AssetViewKey = "transacciones" | "activos-detectados" | "pendientes" | "analisis-tributario";
type LoadState = "LOADING" | "READY" | "ERROR";
type TableMode = "confirmed" | "pending" | "tax";

type SourceOption = { key: SourceOptionKey; icon: string; label: string; hint: string };
type AssetView = { key: AssetViewKey; label: string; value: string; hint: string };

type StagingItem = {
  id: string;
  source: string;
  sources: string[];
  allIds: string[];
  provider: string;
  status: string;
  occurredAt: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  rawType: string;
  linkedMovementId: string | null;
  direction?: "INFLOW" | "OUTFLOW";
};

type StagingData = {
  items: StagingItem[];
  counts: { pending: number; review: number; confirmed: number; rejected: number };
};

type ApiResponse<T> = { ok: boolean; message: string; data: T };

type AssetPosition = {
  symbol: string;
  inflows: number;
  outflows: number;
  balance: number;
  count: number;
  lastDate: string;
};

const SOURCE_OPTIONS: SourceOption[] = [
  { key: "bancos", icon: "🏦", label: "Bancos", hint: "Abrí Bancos. Selecciona tu banco para continuar." },
  { key: "exchanges", icon: "📊", label: "Exchanges", hint: "Abrí Exchanges. Selecciona tu exchange para continuar." },
  { key: "wallets", icon: "💳", label: "Wallets", hint: "La integración de wallets estará disponible próximamente." },
  { key: "documentacion", icon: "📄", label: "Documentación", hint: "Abrí Documentación. Puedes cargar PDF, Excel o CSV." },
];

const ASSET_VIEW_CONFIG: Array<Omit<AssetView, "value">> = [
  { key: "transacciones", label: "Transacciones", hint: "Movimientos confirmados desde tus fuentes." },
  { key: "activos-detectados", label: "Activos", hint: "Entradas, salidas y saldos detectados desde movimientos confirmados." },
  { key: "pendientes", label: "Por revisar", hint: "Datos pendientes o marcados para revisión." },
  { key: "analisis-tributario", label: "Para análisis tributario", hint: "Operaciones confirmadas disponibles para clasificación tributaria." },
];

const STEP_COPY = {
  "origen-fondos": {
    title: "Origen de Fondos",
    subtitle: "Selecciona o indica cómo ingresaron tus fondos.",
    examples: ["bancos", "exchanges", "wallets", "documentación"],
  },
  activos: {
    title: "Activos",
    subtitle: "Revisa las operaciones confirmadas, corrige inconsistencias y valida la información antes del análisis tributario.",
    examples: ["transacciones", "pendientes", "análisis tributario", "activos"],
  },
} satisfies Record<WealthStepKey, { title: string; subtitle: string; examples: string[] }>;

const controlStyle: CSSProperties = {
  minHeight: 42,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--bg-sunken)",
  color: "var(--text)",
  padding: "0 12px",
  fontSize: 13,
  fontFamily: fonts.body,
};

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function resolveSourceIntent(text: string): SourceOptionKey | null {
  const clean = normalize(text);
  if (/banco|cuenta|cartola|deposito|transferencia/.test(clean)) return "bancos";
  if (/exchange|binance|coinbase|buda|plataforma/.test(clean)) return "exchanges";
  if (/wallet|direccion|on.?chain|autocustodia/.test(clean)) return "wallets";
  if (/document|pdf|excel|csv|archivo|xls|xlsx|subir/.test(clean)) return "documentacion";
  return null;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : date.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function extractAsset(item: StagingItem): string {
  return item.amountLabel.match(/\b[A-Z0-9]{2,12}\b$/)?.[0]
    ?? item.subtitle.match(/·\s*([A-Z0-9]{2,12})\b/)?.[1]
    ?? "ACTIVO";
}

function extractQuantity(item: StagingItem): number {
  const value = Number.parseFloat(item.amountLabel.replace(/,/g, ".").match(/-?\d+(?:\.\d+)?/)?.[0] ?? "0");
  return Number.isFinite(value) ? value : 0;
}

function signedQuantity(item: StagingItem): number {
  const raw = extractQuantity(item);
  const absolute = Math.abs(raw);
  if (item.direction === "INFLOW") return absolute;
  if (item.direction === "OUTFLOW") return -absolute;

  const operation = normalize(`${item.rawType} ${item.title}`);
  if (/sell|venta|withdraw|retiro|send|envio|outflow|salida/.test(operation)) return -absolute;
  if (/buy|compra|deposit|deposito|receive|recepcion|inflow|entrada/.test(operation)) return absolute;
  return raw;
}

function buildPositions(items: StagingItem[]): AssetPosition[] {
  const map = new Map<string, AssetPosition>();
  for (const item of items) {
    const symbol = extractAsset(item);
    const quantity = signedQuantity(item);
    const position = map.get(symbol) ?? { symbol, inflows: 0, outflows: 0, balance: 0, count: 0, lastDate: item.occurredAt };
    if (quantity >= 0) position.inflows += quantity;
    else position.outflows += Math.abs(quantity);
    position.balance += quantity;
    position.count += 1;
    if (new Date(item.occurredAt).getTime() > new Date(position.lastDate).getTime()) position.lastDate = item.occurredAt;
    map.set(symbol, position);
  }
  return [...map.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
}

function sourceLabel(item: StagingItem) {
  return item.provider || item.sources[0] || item.source || "Fuente";
}

function statusMeta(status: string) {
  switch (status.toUpperCase()) {
    case "CONFIRMED": return { label: "Confirmado", color: "var(--accent)" };
    case "REVIEW": return { label: "Requiere revisión", color: "var(--warning, #d9901a)" };
    case "PENDING": return { label: "Pendiente", color: "var(--warning, #d9901a)" };
    case "REJECTED": return { label: "Descartado", color: "var(--loss)" };
    default: return { label: status || "Sin estado", color: "var(--text-soft)" };
  }
}

function reviewReason(item: StagingItem) {
  if (item.status === "REVIEW") return item.subtitle || "El registro requiere revisión manual.";
  if (item.status === "PENDING") return "Pendiente de confirmación en Importaciones.";
  return item.subtitle || "Revisa la información del movimiento.";
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ minHeight: 220, display: "grid", placeItems: "center", padding: 24, textAlign: "center", fontFamily: fonts.body }}>
      <div>
        <strong style={{ display: "block", color: "var(--text)", fontSize: 16, marginBottom: 6 }}>{title}</strong>
        <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 13, lineHeight: 1.5 }}>{body}</p>
      </div>
    </div>
  );
}

function DataState({ state, error, retry }: { state: LoadState; error: string; retry: () => void }) {
  if (state === "LOADING") {
    return <div style={{ minHeight: 240, border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg-elev)", display: "grid", placeItems: "center", color: "var(--text-soft)", fontSize: 13 }}>Actualizando activos…</div>;
  }
  if (state === "ERROR") {
    return (
      <div role="alert" style={{ minHeight: 240, border: "1px solid var(--loss)", borderRadius: 18, background: "var(--bg-elev)", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
        <div>
          <strong style={{ display: "block", color: "var(--text)", fontSize: 16, marginBottom: 6 }}>No fue posible cargar los activos</strong>
          <p style={{ margin: "0 0 14px", color: "var(--text-soft)", fontSize: 13 }}>{error}</p>
          <button type="button" onClick={retry} style={{ border: "1px solid var(--accent)", borderRadius: 12, background: "transparent", color: "var(--accent)", padding: "9px 13px", cursor: "pointer", fontWeight: 900 }}>Reintentar</button>
        </div>
      </div>
    );
  }
  return null;
}

function TransactionsTable({ items, mode, filtered, onReview }: { items: StagingItem[]; mode: TableMode; filtered: boolean; onReview: (item: StagingItem) => void }) {
  if (items.length === 0) {
    return (
      <div style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg-elev)" }}>
        <EmptyState
          title={filtered ? "No hay resultados" : mode === "pending" ? "No hay registros por revisar" : "Aún no hay operaciones confirmadas"}
          body={filtered ? "Ajusta la búsqueda o elimina los filtros aplicados." : mode === "pending" ? "Los registros pendientes o con inconsistencias aparecerán aquí." : "Confirma operaciones en Importaciones para incorporarlas a Activos."}
        />
      </div>
    );
  }

  const columns = mode === "pending"
    ? "0.8fr 0.8fr 0.7fr 1fr 0.9fr 1.2fr 0.85fr 0.65fr"
    : mode === "tax"
      ? "0.8fr 0.8fr 1.15fr 0.7fr 0.9fr 1fr 0.65fr"
      : "0.8fr 0.8fr 0.7fr 1.05fr 0.9fr 0.8fr 0.65fr";

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg-elev)", overflowX: "auto" }}>
      <div style={{ minWidth: mode === "pending" ? 1080 : 900 }}>
        <div style={{ display: "grid", gridTemplateColumns: columns, gap: 12, padding: "11px 14px", background: "var(--bg-sunken)", color: "var(--text-soft)", fontSize: 11, fontWeight: 900, letterSpacing: ".04em", textTransform: "uppercase" }}>
          <span>Fecha</span><span>Fuente</span>
          {mode === "tax" ? <span>Operación para analizar</span> : <span>Activo</span>}
          {mode !== "tax" && <span>Movimiento</span>}
          {mode === "tax" && <span>Activo</span>}
          <span style={{ textAlign: "right" }}>Monto</span>
          {mode === "pending" && <span>Motivo</span>}
          <span>{mode === "tax" ? "Preparación" : "Estado"}</span><span>Acción</span>
        </div>
        {items.map((item) => {
          const status = statusMeta(item.status);
          return (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: columns, gap: 12, padding: "12px 14px", borderTop: "1px solid var(--border)", color: "var(--text)", fontSize: 12.5, alignItems: "center" }}>
              <span>{formatDate(item.occurredAt)}</span><span>{sourceLabel(item)}</span>
              {mode === "tax" ? <span>{item.title}</span> : <strong>{extractAsset(item)}</strong>}
              {mode !== "tax" && <span>{item.title}</span>}
              {mode === "tax" && <strong>{extractAsset(item)}</strong>}
              <strong style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{item.amountLabel}</strong>
              {mode === "pending" && <span style={{ color: "var(--text-soft)", lineHeight: 1.4 }}>{reviewReason(item)}</span>}
              <span style={{ color: mode === "tax" ? "var(--accent)" : status.color, fontWeight: 900 }}>{mode === "tax" ? "Listo para analizar" : status.label}</span>
              <button type="button" onClick={() => onReview(item)} style={{ width: "fit-content", border: "none", background: "transparent", color: "var(--accent)", padding: 0, cursor: "pointer", fontSize: 12, fontWeight: 900 }}>{mode === "pending" ? "Revisar →" : "Ver →"}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AssetsTable({ positions, filtered }: { positions: AssetPosition[]; filtered: boolean }) {
  if (positions.length === 0) {
    return <div style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg-elev)" }}><EmptyState title={filtered ? "No hay activos para estos filtros" : "Aún no hay activos detectados"} body={filtered ? "Ajusta la búsqueda o elimina los filtros aplicados." : "Los activos se calcularán a partir de movimientos confirmados."} /></div>;
  }

  const columns = "0.75fr 1fr 1fr 1fr 0.75fr 0.85fr 1.1fr";
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg-elev)", overflowX: "auto" }}>
      <div style={{ minWidth: 900 }}>
        <div style={{ display: "grid", gridTemplateColumns: columns, gap: 12, padding: "11px 14px", background: "var(--bg-sunken)", color: "var(--text-soft)", fontSize: 11, fontWeight: 900, letterSpacing: ".04em", textTransform: "uppercase" }}>
          <span>Activo</span><span style={{ textAlign: "right" }}>Entradas</span><span style={{ textAlign: "right" }}>Salidas</span><span style={{ textAlign: "right" }}>Saldo detectado</span><span>Movimientos</span><span>Última fecha</span><span>Estado</span>
        </div>
        {positions.map((position) => (
          <div key={position.symbol} style={{ display: "grid", gridTemplateColumns: columns, gap: 12, padding: "12px 14px", borderTop: "1px solid var(--border)", color: "var(--text)", fontSize: 12.5, alignItems: "center" }}>
            <strong>{position.symbol}</strong>
            {[position.inflows, position.outflows, position.balance].map((value, index) => <strong key={index} style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{value.toLocaleString("es-CL", { maximumFractionDigits: 8 })}</strong>)}
            <span>{position.count}</span><span>{formatDate(position.lastDate)}</span><span style={{ color: "var(--text-soft)", fontWeight: 800 }}>Calculado desde confirmados</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function matchesFilters(item: StagingItem, query: string, sourceFilter: string, assetFilter: string) {
  const source = sourceLabel(item);
  const asset = extractAsset(item);
  if (sourceFilter !== "ALL" && source !== sourceFilter) return false;
  if (assetFilter !== "ALL" && asset !== assetFilter) return false;
  const clean = normalize(query.trim());
  if (!clean) return true;
  return normalize([item.id, item.source, item.sources.join(" "), item.provider, item.status, item.title, item.subtitle, item.amountLabel, item.rawType, source, asset, formatDate(item.occurredAt)].join(" ")).includes(clean);
}

function newest(items: StagingItem[]) {
  return [...items].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

export function WealthFlowPage({ activeStep }: { activeStep: WealthStepKey }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<SourceOptionKey | null>(null);
  const [assetView, setAssetView] = useState<AssetViewKey>("transacciones");
  const [stagingData, setStagingData] = useState<StagingData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("LOADING");
  const [loadError, setLoadError] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [assetFilter, setAssetFilter] = useState("ALL");
  const copy = STEP_COPY[activeStep];
  const selectedSourceOption = SOURCE_OPTIONS.find((item) => item.key === selectedSource);

  const confirmedItems = useMemo(() => (stagingData?.items ?? []).filter((item) => item.status === "CONFIRMED"), [stagingData]);
  const pendingItems = useMemo(() => (stagingData?.items ?? []).filter((item) => item.status === "PENDING" || item.status === "REVIEW"), [stagingData]);
  const positions = useMemo(() => buildPositions(confirmedItems), [confirmedItems]);
  const assetViews = useMemo<AssetView[]>(() => ASSET_VIEW_CONFIG.map((view) => ({
    ...view,
    value: loadState === "LOADING" ? "—" : view.key === "transacciones" ? String(confirmedItems.length) : view.key === "activos-detectados" ? String(positions.length) : view.key === "pendientes" ? String(pendingItems.length) : String(confirmedItems.length),
  })), [confirmedItems.length, loadState, pendingItems.length, positions.length]);
  const selectedAssetView = assetViews.find((item) => item.key === assetView) ?? assetViews[0];

  const sourceOptions = useMemo(() => [...new Set((stagingData?.items ?? []).map(sourceLabel))].sort((a, b) => a.localeCompare(b)), [stagingData]);
  const assetOptions = useMemo(() => [...new Set((stagingData?.items ?? []).map(extractAsset))].sort((a, b) => a.localeCompare(b)), [stagingData]);
  const filteredConfirmed = useMemo(() => newest(confirmedItems.filter((item) => matchesFilters(item, query, sourceFilter, assetFilter))), [assetFilter, confirmedItems, query, sourceFilter]);
  const filteredPending = useMemo(() => newest(pendingItems.filter((item) => matchesFilters(item, query, sourceFilter, assetFilter))), [assetFilter, pendingItems, query, sourceFilter]);
  const filteredPositions = useMemo(() => buildPositions(filteredConfirmed), [filteredConfirmed]);
  const hasFilters = Boolean(query.trim()) || sourceFilter !== "ALL" || assetFilter !== "ALL";

  const loadStagingData = useCallback(async () => {
    setLoadState("LOADING");
    setLoadError("");
    try {
      const response = await httpClient<ApiResponse<StagingData>>("/api/imports/staging", { auth: true });
      setStagingData(response.data);
      setLoadState("READY");
    } catch (error) {
      setStagingData(null);
      setLoadState("ERROR");
      setLoadError(error instanceof Error ? error.message : "La información consolidada no está disponible.");
    }
  }, []);

  useEffect(() => { if (activeStep === "activos") void loadStagingData(); }, [activeStep, loadStagingData]);

  function openSourceOption(option: SourceOption) {
    setSelectedSource(option.key);
    setQuery(option.label);
    const routes: Record<SourceOptionKey, string> = { bancos: "/origen-fondos/bancos", exchanges: "/origen-fondos/exchanges", wallets: "/origen-fondos", documentacion: "/origen-fondos/documentacion" };
    router.push(routes[option.key]);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (activeStep !== "origen-fondos") return;
    const option = SOURCE_OPTIONS.find((item) => item.key === resolveSourceIntent(query.trim()));
    if (option) openSourceOption(option);
  }

  function clearFilters() { setQuery(""); setSourceFilter("ALL"); setAssetFilter("ALL"); }
  function review(item: StagingItem) { router.push(`/importaciones?registro=${encodeURIComponent(item.id)}`); }

  function renderAssetContent() {
    if (loadState !== "READY") return <DataState state={loadState} error={loadError} retry={() => void loadStagingData()} />;
    if (assetView === "activos-detectados") return <AssetsTable positions={filteredPositions} filtered={hasFilters} />;
    if (assetView === "pendientes") return <TransactionsTable items={filteredPending} mode="pending" filtered={hasFilters} onReview={review} />;
    if (assetView === "analisis-tributario") return <TransactionsTable items={filteredConfirmed} mode="tax" filtered={hasFilters} onReview={review} />;
    return <TransactionsTable items={filteredConfirmed} mode="confirmed" filtered={hasFilters} onReview={review} />;
  }

  if (activeStep === "activos") {
    const resultCount = assetView === "activos-detectados" ? filteredPositions.length : assetView === "pendientes" ? filteredPending.length : filteredConfirmed.length;
    return (
      <main style={{ minHeight: "calc(100vh - 100px)", display: "grid", gap: 20, alignContent: "start", paddingBottom: 80, fontFamily: fonts.body }}>
        <header style={{ display: "grid", gap: 6 }}>
          <h1 style={{ color: "var(--text)", fontSize: "clamp(1.65rem,3vw,2.25rem)", fontWeight: 900, margin: 0, letterSpacing: "-.045em", fontFamily: fonts.display }}>{copy.title}</h1>
          <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.55, margin: 0, maxWidth: 820 }}>{copy.subtitle}</p>
        </header>

        <section aria-label="Vistas de activos" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 12 }}>
          {assetViews.map((view) => {
            const active = assetView === view.key;
            return (
              <button key={view.key} type="button" aria-pressed={active} onClick={() => setAssetView(view.key)} style={{ minHeight: 118, borderRadius: 18, border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`, background: active ? "var(--bg-sunken)" : "var(--bg-elev)", cursor: "pointer", textAlign: "left", padding: "15px 16px", display: "grid", alignContent: "start", gap: 6, boxShadow: active ? "0 0 0 1px var(--accent), var(--shadow-sm)" : "var(--shadow-sm)", fontFamily: fonts.body }}>
                <span style={{ color: "var(--accent)", fontSize: 22, fontWeight: 950, lineHeight: 1 }}>{view.value}</span>
                <strong style={{ color: "var(--text)", fontSize: 14, fontWeight: 900 }}>{view.label}</strong>
                <span style={{ color: "var(--text-soft)", fontSize: 11.75, lineHeight: 1.35 }}>{view.hint}</span>
              </button>
            );
          })}
        </section>

        <section style={{ display: "grid", gap: 12 }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg-elev)", padding: 14, display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <strong style={{ color: "var(--text)", fontSize: 15, fontWeight: 900 }}>{selectedAssetView.label}</strong>
              <span style={{ color: "var(--text-soft)", fontSize: 12 }}>{loadState === "READY" ? `${resultCount} ${resultCount === 1 ? "resultado" : "resultados"}` : "Actualizando…"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,190px),1fr))", gap: 10 }}>
              <label style={{ display: "grid", gap: 5, color: "var(--text-soft)", fontSize: 11.5, fontWeight: 800 }}>Buscar<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Activo, fuente, movimiento, fecha…" style={controlStyle} /></label>
              <label style={{ display: "grid", gap: 5, color: "var(--text-soft)", fontSize: 11.5, fontWeight: 800 }}>Fuente<select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} style={controlStyle}><option value="ALL">Todas las fuentes</option>{sourceOptions.map((source) => <option key={source} value={source}>{source}</option>)}</select></label>
              <label style={{ display: "grid", gap: 5, color: "var(--text-soft)", fontSize: 11.5, fontWeight: 800 }}>Activo<select value={assetFilter} onChange={(event) => setAssetFilter(event.target.value)} style={controlStyle}><option value="ALL">Todos los activos</option>{assetOptions.map((asset) => <option key={asset} value={asset}>{asset}</option>)}</select></label>
              <div style={{ display: "flex", alignItems: "end" }}><button type="button" onClick={clearFilters} disabled={!hasFilters} style={{ ...controlStyle, width: "100%", background: "transparent", color: hasFilters ? "var(--text)" : "var(--text-faint)", cursor: hasFilters ? "pointer" : "not-allowed", fontWeight: 900 }}>Limpiar filtros</button></div>
            </div>
          </div>
          {renderAssetContent()}
        </section>
      </main>
    );
  }

  return (
    <main style={{ height: "calc(100vh - 160px)", overflow: "hidden", display: "grid", gap: 14, gridTemplateRows: "auto 110px 1fr" }}>
      <section><h1 style={{ color: "var(--text)", fontSize: "clamp(1.65rem,3vw,2.05rem)", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-.04em", fontFamily: fonts.display }}>{copy.title}</h1><p style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.35, margin: 0, fontFamily: fonts.body }}>{copy.subtitle}</p></section>
      <section style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(4,minmax(0,1fr))" }}>{SOURCE_OPTIONS.map((option) => <button key={option.key} type="button" onClick={() => openSourceOption(option)} style={{ height: 110, borderRadius: 18, border: "1px solid var(--border)", background: "var(--bg-elev)", color: "var(--text)", cursor: "pointer", display: "grid", gap: 6, padding: "12px 10px", placeItems: "center", alignContent: "center", fontFamily: fonts.body }}><span style={{ fontSize: 36 }}>{option.icon}</span><strong style={{ fontSize: 14 }}>{option.label}</strong></button>)}</section>
      <section style={{ alignSelf: "end", border: "1px solid var(--border)", borderRadius: 20, background: "var(--bg-elev)", padding: 12, display: "grid", gap: 10 }}><p style={{ margin: 0, color: "var(--text)", fontSize: 12.5 }}>{selectedSourceOption ? selectedSourceOption.hint : `Escribe: ${copy.examples.join(", ")}.`}</p><form onSubmit={submit}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Escribe aquí..." style={{ ...controlStyle, width: "100%" }} /></form></section>
    </main>
  );
}
