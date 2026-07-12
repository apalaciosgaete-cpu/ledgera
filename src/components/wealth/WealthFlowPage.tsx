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
  { key: "activos-detectados", label: "Activos", hint: "Todos los activos detectados en movimientos confirmados." },
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
    subtitle: "Revisa la información consolidada y trazable antes del análisis tributario.",
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

function amountOnly(item: StagingItem): string {
  return item.amountLabel.match(/-?\d[\d.,]*/)?.[0] ?? item.amountLabel;
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

function TransactionsTable({ items, mode }: { items: StagingItem[]; mode: TableMode }) {
  if (items.length === 0) {
    return (
      <div style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg-elev)" }}>
        <EmptyState
          title={mode === "pending" ? "No hay registros por revisar" : "Aún no hay operaciones confirmadas"}
          body={mode === "pending" ? "Los registros pendientes o con inconsistencias aparecerán aquí." : "Confirma operaciones en Importaciones para incorporarlas a Activos."}
        />
      </div>
    );
  }

  const columns = mode === "pending"
    ? "0.8fr 0.8fr 0.7fr 1fr 0.9fr 1.2fr 1fr"
    : mode === "tax"
      ? "0.8fr 0.8fr 1.2fr 0.7fr 1fr 1.1fr"
      : "0.8fr 0.8fr 0.7fr 1.1fr 1fr 1.1fr";

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg-elev)", overflowX: "auto" }}>
      <div style={{ minWidth: mode === "pending" ? 1020 : 860 }}>
        <div style={{ display: "grid", gridTemplateColumns: columns, gap: 16, padding: "11px 14px", background: "var(--bg-sunken)", color: "var(--text-soft)", fontSize: 11, fontWeight: 900, letterSpacing: ".04em", textTransform: "uppercase" }}>
          <span>Fecha</span><span>Fuente</span>
          {mode === "tax" ? <span>Operación para analizar</span> : <span>Activo</span>}
          {mode !== "tax" && <span>Movimiento</span>}
          {mode === "tax" && <span>Activo</span>}
          <span style={{ textAlign: "right", paddingRight: 8 }}>Monto</span>
          {mode === "pending" && <span>Motivo</span>}
          <span style={{ paddingLeft: 18 }}>{mode === "tax" ? "Preparación" : "Estado"}</span>
        </div>
        {items.map((item) => {
          const status = statusMeta(item.status);
          return (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: columns, gap: 16, padding: "12px 14px", borderTop: "1px solid var(--border)", color: "var(--text)", fontSize: 12.5, alignItems: "center" }}>
              <span>{formatDate(item.occurredAt)}</span><span>{sourceLabel(item)}</span>
              {mode === "tax" ? <span>{item.title}</span> : <strong>{extractAsset(item)}</strong>}
              {mode !== "tax" && <span>{item.title}</span>}
              {mode === "tax" && <strong>{extractAsset(item)}</strong>}
              <strong style={{ textAlign: "right", paddingRight: 8, fontVariantNumeric: "tabular-nums" }}>{amountOnly(item)}</strong>
              {mode === "pending" && <span style={{ color: "var(--text-soft)", lineHeight: 1.4 }}>{reviewReason(item)}</span>}
              <span style={{ paddingLeft: 18, color: mode === "tax" ? "var(--accent)" : status.color, fontWeight: 900 }}>{mode === "tax" ? "Listo para analizar" : status.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AssetsTable({ positions }: { positions: AssetPosition[] }) {
  if (positions.length === 0) {
    return <div style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg-elev)" }}><EmptyState title="Aún no hay activos detectados" body="Los activos se incorporarán automáticamente a partir de movimientos confirmados." /></div>;
  }

  const columns = "0.85fr 1.1fr 0.8fr 0.95fr 1.1fr";
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg-elev)", overflowX: "auto" }}>
      <div style={{ minWidth: 760 }}>
        <div style={{ display: "grid", gridTemplateColumns: columns, gap: 12, padding: "11px 14px", background: "var(--bg-sunken)", color: "var(--text-soft)", fontSize: 11, fontWeight: 900, letterSpacing: ".04em", textTransform: "uppercase" }}>
          <span>Activo</span><span style={{ textAlign: "right" }}>Cantidad consolidada</span><span>Movimientos</span><span>Última fecha</span><span>Estado</span>
        </div>
        {positions.map((position) => (
          <div key={position.symbol} style={{ display: "grid", gridTemplateColumns: columns, gap: 12, padding: "12px 14px", borderTop: "1px solid var(--border)", color: "var(--text)", fontSize: 12.5, alignItems: "center" }}>
            <strong>{position.symbol}</strong>
            <strong style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{position.balance.toLocaleString("es-CL", { maximumFractionDigits: 8 })}</strong>
            <span>{position.count}</span><span>{formatDate(position.lastDate)}</span><span style={{ color: "var(--accent)", fontWeight: 800 }}>Incluido en consolidado</span>
          </div>
        ))}
      </div>
    </div>
  );
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
  const copy = STEP_COPY[activeStep];
  const selectedSourceOption = SOURCE_OPTIONS.find((item) => item.key === selectedSource);

  const confirmedItems = useMemo(() => newest((stagingData?.items ?? []).filter((item) => item.status === "CONFIRMED")), [stagingData]);
  const pendingItems = useMemo(() => newest((stagingData?.items ?? []).filter((item) => item.status === "PENDING" || item.status === "REVIEW")), [stagingData]);
  const positions = useMemo(() => buildPositions(confirmedItems), [confirmedItems]);
  const assetViews = useMemo<AssetView[]>(() => ASSET_VIEW_CONFIG.map((view) => ({
    ...view,
    value: loadState === "LOADING" ? "—" : view.key === "transacciones" ? String(confirmedItems.length) : view.key === "activos-detectados" ? String(positions.length) : view.key === "pendientes" ? String(pendingItems.length) : String(confirmedItems.length),
  })), [confirmedItems.length, loadState, pendingItems.length, positions.length]);
  const selectedAssetView = assetViews.find((item) => item.key === assetView) ?? assetViews[0];

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

  function renderAssetContent() {
    if (loadState !== "READY") return <DataState state={loadState} error={loadError} retry={() => void loadStagingData()} />;
    if (assetView === "activos-detectados") return <AssetsTable positions={positions} />;
    if (assetView === "pendientes") return <TransactionsTable items={pendingItems} mode="pending" />;
    if (assetView === "analisis-tributario") return <TransactionsTable items={confirmedItems} mode="tax" />;
    return <TransactionsTable items={confirmedItems} mode="confirmed" />;
  }

  if (activeStep === "activos") {
    const resultCount = assetView === "activos-detectados" ? positions.length : assetView === "pendientes" ? pendingItems.length : confirmedItems.length;
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
              <button key={view.key} type="button" aria-pressed={active} onClick={() => setAssetView(view.key)} style={{ minHeight: 118, borderRadius: 18, border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`, background: active ? "var(--bg-sunken)" : "var(--bg-elev)", cursor: "pointer", textAlign: "center", padding: "15px 16px", display: "grid", alignContent: "center", justifyItems: "center", gap: 6, boxShadow: active ? "0 0 0 1px var(--accent), var(--shadow-sm)" : "var(--shadow-sm)", fontFamily: fonts.body }}>
                <span style={{ color: "var(--accent)", fontSize: 22, fontWeight: 950, lineHeight: 1 }}>{view.value}</span>
                <strong style={{ color: "var(--text)", fontSize: 14, fontWeight: 900 }}>{view.label}</strong>
                <span style={{ color: "var(--text-soft)", fontSize: 11.75, lineHeight: 1.35 }}>{view.hint}</span>
              </button>
            );
          })}
        </section>

        <section style={{ display: "grid", gap: 12 }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg-elev)", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <strong style={{ color: "var(--text)", fontSize: 15, fontWeight: 900 }}>{selectedAssetView.label}</strong>
            <span style={{ color: "var(--text-soft)", fontSize: 12 }}>{loadState === "READY" ? `Consolidado completo · ${resultCount} ${resultCount === 1 ? "registro" : "registros"}` : "Actualizando…"}</span>
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
