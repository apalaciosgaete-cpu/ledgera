"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { httpClient } from "@/shared/http/httpClient";

type WealthStepKey = "origen-fondos" | "activos";
type SourceOptionKey = "bancos" | "exchanges" | "wallets" | "documentacion";
type AssetViewKey = "transacciones" | "activos-detectados" | "pendientes" | "eventos-tributarios";
type SourceOption = { key: SourceOptionKey; icon: string; label: string; hint: string; accent: string; bg: string; border: string };
type AssetView = { key: AssetViewKey; label: string; value: string; hint: string; accent: string; bg: string; border: string };

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
  counts: {
    pending: number;
    review: number;
    confirmed: number;
    rejected: number;
  };
};

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

type AssetPosition = {
  symbol: string;
  quantity: number;
  count: number;
  lastDate: string;
};

const SOURCE_OPTIONS: SourceOption[] = [
  { key: "bancos", icon: "🏦", label: "Bancos", hint: "Abrí Bancos. Selecciona tu banco para continuar.", accent: "#6D4AFF", bg: "#FBFAFF", border: "#E6E0FF" },
  { key: "exchanges", icon: "📊", label: "Exchanges", hint: "Abrí Exchanges. Selecciona tu exchange para continuar.", accent: "#20C878", bg: "#F8FFFB", border: "#D9F5E8" },
  { key: "wallets", icon: "💳", label: "Wallets", hint: "Abrí Wallets. Selecciona tu wallet para continuar.", accent: "#2483FF", bg: "#F8FBFF", border: "#DCEBFF" },
  { key: "documentacion", icon: "📄", label: "Documentación", hint: "Abrí Documentación. Puedes cargar PDF o Excel.", accent: "#FF7A1A", bg: "#FFFBF6", border: "#FFE8D6" },
];

const ASSET_VIEWS: Omit<AssetView, "value">[] = [
  { key: "transacciones", label: "Transacciones", hint: "Todos los movimientos confirmados desde tus fuentes.", accent: "#6D4AFF", bg: "#FBFAFF", border: "#E6E0FF" },
  { key: "activos-detectados", label: "Activos", hint: "Saldos y activos detectados desde movimientos confirmados.", accent: "#2483FF", bg: "#F8FBFF", border: "#DCEBFF" },
  { key: "pendientes", label: "Por revisar", hint: "Datos que aún requieren corrección o confirmación.", accent: "#FF7A1A", bg: "#FFFBF6", border: "#FFE8D6" },
  { key: "eventos-tributarios", label: "Eventos tributarios", hint: "Operaciones confirmadas que alimentan el análisis tributario.", accent: "#20C878", bg: "#F8FFFB", border: "#D9F5E8" },
];

const STEP_COPY: Record<WealthStepKey, { title: string; subtitle: string; guide: string; examples: string[] }> = {
  "origen-fondos": {
    title: "Origen de Fondos",
    subtitle: "Selecciona o indica cómo ingresaron tus fondos.",
    guide: "Estás en Origen de Fondos. Escribe Bancos, Exchanges, Wallets o Documentación y se abrirá la opción correcta.",
    examples: ["bancos", "exchanges", "wallets", "documentación"],
  },
  activos: {
    title: "Activos",
    subtitle: "Revisa y corrige la información consolidada antes del análisis tributario.",
    guide: "Estás en Activos. Aquí revisas transacciones, activos detectados y datos pendientes antes de enviarlos al motor tributario.",
    examples: ["ver transacciones", "revisar pendientes", "eventos tributarios", "activos detectados"],
  },
};

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function resolveSourceIntent(text: string): SourceOptionKey | null {
  const clean = normalize(text);
  if (/banco|cuenta|cartola|deposito|transferencia/.test(clean)) return "bancos";
  if (/exchange|binance|coinbase|buda|plataforma/.test(clean)) return "exchanges";
  if (/wallet|direccion|on.?chain|transaccion|autocustodia/.test(clean)) return "wallets";
  if (/document|pdf|excel|archivo|xls|xlsx|subir/.test(clean)) return "documentacion";
  return null;
}

function resolveAssetView(text: string): AssetViewKey | null {
  const clean = normalize(text);
  if (/transaccion|movimiento|historial|operacion/.test(clean)) return "transacciones";
  if (/activo|saldo|posicion|token|moneda/.test(clean)) return "activos-detectados";
  if (/pendiente|corregir|correccion|clasificar|error|inconsistencia/.test(clean)) return "pendientes";
  if (/tributario|impuesto|evento|declaracion|renta/.test(clean)) return "eventos-tributarios";
  return null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function extractAsset(item: StagingItem): string {
  const amountSymbol = item.amountLabel.match(/\b[A-Z0-9]{2,12}\b$/)?.[0];
  if (amountSymbol) return amountSymbol;
  const subtitleSymbol = item.subtitle.match(/·\s*([A-Z0-9]{2,12})\b/)?.[1];
  if (subtitleSymbol) return subtitleSymbol;
  return "ACTIVO";
}

function extractQuantity(item: StagingItem): number {
  const value = Number.parseFloat(item.amountLabel.replace(/,/g, ".").match(/-?\d+(?:\.\d+)?/)?.[0] ?? "0");
  return Number.isFinite(value) ? value : 0;
}

function buildPositions(items: StagingItem[]): AssetPosition[] {
  const map = new Map<string, AssetPosition>();

  for (const item of items) {
    const symbol = extractAsset(item);
    const quantity = extractQuantity(item);
    const existing = map.get(symbol);

    if (!existing) {
      map.set(symbol, { symbol, quantity, count: 1, lastDate: item.occurredAt });
      continue;
    }

    existing.quantity += quantity;
    existing.count += 1;
    if (new Date(item.occurredAt).getTime() > new Date(existing.lastDate).getTime()) {
      existing.lastDate = item.occurredAt;
    }
  }

  return [...map.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
}

function EmptyTransactionsTable() {
  return (
    <div style={{ border: "1px solid #E2E8F0", borderRadius: 18, background: "#FFFFFF", overflow: "hidden", minHeight: 260 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr", padding: "11px 14px", background: "#F8FAFC", color: "#64748B", fontSize: 11, fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: fonts.body }}>
        <span>Fecha</span>
        <span>Fuente</span>
        <span>Activo</span>
        <span>Movimiento</span>
        <span>Estado</span>
        <span>Acción</span>
      </div>
      <div style={{ display: "grid", placeItems: "center", minHeight: 210, padding: 20, textAlign: "center", color: "#64748B", fontFamily: fonts.body }}>
        <div>
          <strong style={{ display: "block", color: "#0F2A3D", fontSize: 16, marginBottom: 6 }}>Aún no hay datos importados</strong>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>Cuando cargues bancos, exchanges, wallets o documentos, las transacciones aparecerán aquí para revisar y corregir.</p>
        </div>
      </div>
    </div>
  );
}

function TransactionsTable({ items }: { items: StagingItem[] }) {
  if (items.length === 0) return <EmptyTransactionsTable />;

  return (
    <div style={{ border: "1px solid #E2E8F0", borderRadius: 18, background: "#FFFFFF", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "0.9fr 0.9fr 0.8fr 1.1fr 0.9fr 0.8fr", padding: "11px 14px", background: "#F8FAFC", color: "#64748B", fontSize: 11, fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: fonts.body }}>
        <span>Fecha</span>
        <span>Fuente</span>
        <span>Activo</span>
        <span>Movimiento</span>
        <span>Monto</span>
        <span>Estado</span>
      </div>
      {items.map((item) => (
        <div key={item.id} style={{ display: "grid", gridTemplateColumns: "0.9fr 0.9fr 0.8fr 1.1fr 0.9fr 0.8fr", padding: "12px 14px", borderTop: "1px solid #F1F5F9", color: "#334155", fontSize: 12.5, alignItems: "center" }}>
          <span>{formatDate(item.occurredAt)}</span>
          <span>{item.provider || item.sources[0] || "Fuente"}</span>
          <strong style={{ color: "#0F2A3D" }}>{extractAsset(item)}</strong>
          <span>{item.title}</span>
          <strong style={{ color: "#0F2A3D" }}>{item.amountLabel}</strong>
          <span style={{ color: "#15803D", fontWeight: 900 }}>Confirmado</span>
        </div>
      ))}
    </div>
  );
}

function AssetsTable({ positions }: { positions: AssetPosition[] }) {
  if (positions.length === 0) return <EmptyTransactionsTable />;

  return (
    <div style={{ border: "1px solid #E2E8F0", borderRadius: 18, background: "#FFFFFF", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "11px 14px", background: "#F8FAFC", color: "#64748B", fontSize: 11, fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: fonts.body }}>
        <span>Activo</span>
        <span>Cantidad detectada</span>
        <span>Movimientos</span>
        <span>Última fecha</span>
      </div>
      {positions.map((position) => (
        <div key={position.symbol} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "12px 14px", borderTop: "1px solid #F1F5F9", color: "#334155", fontSize: 12.5, alignItems: "center" }}>
          <strong style={{ color: "#0F2A3D" }}>{position.symbol}</strong>
          <strong style={{ color: "#0F2A3D" }}>{position.quantity.toLocaleString("es-CL", { maximumFractionDigits: 8 })}</strong>
          <span>{position.count}</span>
          <span>{formatDate(position.lastDate)}</span>
        </div>
      ))}
    </div>
  );
}

export function WealthFlowPage({ activeStep }: { activeStep: WealthStepKey }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<SourceOptionKey | null>(null);
  const [assetView, setAssetView] = useState<AssetViewKey>("transacciones");
  const [stagingData, setStagingData] = useState<StagingData | null>(null);
  const copy = STEP_COPY[activeStep];
  const selectedSourceOption = SOURCE_OPTIONS.find((item) => item.key === selectedSource);

  const confirmedItems = useMemo(
    () => (stagingData?.items ?? []).filter((item) => item.status === "CONFIRMED"),
    [stagingData],
  );
  const pendingItems = useMemo(
    () => (stagingData?.items ?? []).filter((item) => item.status === "PENDING" || item.status === "REVIEW"),
    [stagingData],
  );
  const positions = useMemo(() => buildPositions(confirmedItems), [confirmedItems]);
  const assetViews: AssetView[] = useMemo(() => ASSET_VIEWS.map((view) => ({
    ...view,
    value:
      view.key === "transacciones" ? String(confirmedItems.length) :
      view.key === "activos-detectados" ? String(positions.length) :
      view.key === "pendientes" ? String(pendingItems.length) :
      String(confirmedItems.length),
  })), [confirmedItems.length, pendingItems.length, positions.length]);
  const selectedAssetView = assetViews.find((item) => item.key === assetView) ?? assetViews[0];

  useEffect(() => {
    if (activeStep !== "activos") return;

    let cancelled = false;
    httpClient<ApiResponse<StagingData>>("/api/imports/staging", { auth: true })
      .then((response) => { if (!cancelled) setStagingData(response.data); })
      .catch(() => { if (!cancelled) setStagingData({ items: [], counts: { pending: 0, review: 0, confirmed: 0, rejected: 0 } }); });

    return () => { cancelled = true; };
  }, [activeStep]);

  function openSourceOption(option: SourceOption) {
    setSelectedSource(option.key);
    setQuery(option.label);
    const sourceFundsRoutes: Record<SourceOptionKey, string> = {
      bancos: "/origen-fondos/bancos",
      exchanges: "/origen-fondos/exchanges",
      wallets: "/origen-fondos/wallets",
      documentacion: "/origen-fondos/documentacion",
    };
    router.push(sourceFundsRoutes[option.key]);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    if (activeStep === "origen-fondos") {
      const option = SOURCE_OPTIONS.find((item) => item.key === resolveSourceIntent(clean));
      if (option) { openSourceOption(option); return; }
    }

    if (activeStep === "activos") {
      const view = resolveAssetView(clean);
      if (view) { setAssetView(view); return; }
    }
  }

  function renderAssetContent() {
    if (assetView === "activos-detectados") return <AssetsTable positions={positions} />;
    if (assetView === "pendientes") return <TransactionsTable items={pendingItems} />;
    if (assetView === "eventos-tributarios") return <TransactionsTable items={confirmedItems} />;
    return <TransactionsTable items={confirmedItems} />;
  }

  if (activeStep === "activos") {
    return (
      <main style={{ minHeight: "calc(100vh - 100px)", overflow: "visible", display: "grid", gap: 12, gridTemplateRows: "auto auto auto auto", paddingBottom: 80 }}>
        <section>
          <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.55rem,2.7vw,1.9rem)", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>{copy.title}</h1>
          <p style={{ color: "#334155", fontSize: 13.5, lineHeight: 1.32, margin: 0, fontFamily: fonts.body }}>{copy.subtitle}</p>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
          {assetViews.map((view) => {
            const active = assetView === view.key;
            return (
              <button key={view.key} type="button" onClick={() => setAssetView(view.key)} style={{ minHeight: 82, borderRadius: 18, border: `1px solid ${active ? view.accent : view.border}`, background: view.bg, cursor: "pointer", textAlign: "left", padding: "12px 14px", display: "grid", gap: 3, boxShadow: active ? `0 8px 18px ${view.accent}20` : "0 8px 16px rgba(15,42,61,0.035)", fontFamily: fonts.body }}>
                <span style={{ color: view.accent, fontSize: 21, fontWeight: 950, lineHeight: 1 }}>{view.value}</span>
                <strong style={{ color: "#0F2A3D", fontSize: 13.5, fontWeight: 900 }}>{view.label}</strong>
                <span style={{ color: "#64748B", fontSize: 11.5, lineHeight: 1.2 }}>{view.hint}</span>
              </button>
            );
          })}
        </section>

        <section style={{ overflow: "visible", display: "grid", gap: 10, alignContent: "start", paddingBottom: 8 }}>
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 18, background: "#FFFFFF", padding: "12px 14px", fontFamily: fonts.body }}>
            <strong style={{ color: "#0F2A3D", fontSize: 15, fontWeight: 900 }}>{selectedAssetView.label}</strong>
            <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 12.5, lineHeight: 1.35 }}>{selectedAssetView.hint}</p>
          </div>
          {renderAssetContent()}
        </section>

        <section style={{ alignSelf: "start", border: "1px solid #DDD6FE", borderRadius: 20, background: "#FFFFFF", padding: 12, display: "grid", gap: 10, boxShadow: "0 12px 28px rgba(109,74,255,0.05)", flexShrink: 0 }}>
          <p style={{ margin: 0, color: "#475569", fontSize: 12.5, lineHeight: 1.28, fontFamily: fonts.body }}>{selectedAssetView.hint}</p>
          <form onSubmit={submit}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, minHeight: 46, borderRadius: 15, border: "1px solid #CBD5E1", background: "#FFFFFF", display: "flex", alignItems: "center", padding: "0 14px", gap: 6, minWidth: 0, boxShadow: "0 6px 14px rgba(15,42,61,0.035)" }}>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar transacción, activo o pendiente..." style={{ flex: 1, border: "none", outline: "none", color: "#0F2A3D", fontSize: 14, fontFamily: fonts.body, minWidth: 0, background: "transparent" }} />
              </div>
            </div>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main style={{ height: "calc(100vh - 160px)", overflow: "hidden", display: "grid", gap: 14, gridTemplateRows: "auto 110px 1fr" }}>
      <section>
        <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.65rem,3vw,2.05rem)", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>{copy.title}</h1>
        <p style={{ color: "#334155", fontSize: 14, lineHeight: 1.35, margin: 0, fontFamily: fonts.body }}>{copy.subtitle}</p>
      </section>

      <section style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(4,minmax(0,1fr))" }}>
        {SOURCE_OPTIONS.map((option) => {
          const active = selectedSource === option.key;
          return (
            <button key={option.key} type="button" onClick={() => openSourceOption(option)} style={{ height: 110, borderRadius: 18, border: `1px solid ${active ? option.accent : option.border}`, background: option.bg, color: "#0F2A3D", cursor: "pointer", display: "grid", gap: 6, padding: "12px 10px", justifyItems: "center", alignItems: "center", alignContent: "center", boxShadow: active ? `0 8px 18px ${option.accent}20` : "0 8px 16px rgba(15,42,61,0.04)", fontFamily: fonts.body, textAlign: "center" }}>
              <span style={{ fontSize: 36, lineHeight: 1 }}>{option.icon}</span>
              <strong style={{ fontSize: 14, fontWeight: 900 }}>{option.label}</strong>
            </button>
          );
        })}
      </section>

      <section style={{ alignSelf: "end", border: "1px solid #DDD6FE", borderRadius: 20, background: "#FFFFFF", padding: 12, display: "grid", gap: 10, boxShadow: "0 12px 28px rgba(109,74,255,0.05)" }}>
        <p style={{ margin: 0, color: "#475569", fontSize: 12.5, lineHeight: 1.28, fontFamily: fonts.body }}>{selectedSourceOption ? selectedSourceOption.hint : `Escribe: ${copy.examples.join(", ")}.`}</p>
        <form onSubmit={submit}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, minHeight: 46, borderRadius: 15, border: "1px solid #CBD5E1", background: "#FFFFFF", display: "flex", alignItems: "center", padding: "0 14px", gap: 6, minWidth: 0, boxShadow: "0 6px 14px rgba(15,42,61,0.035)" }}>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Escribe aquí..." style={{ flex: 1, border: "none", outline: "none", color: "#0F2A3D", fontSize: 14, fontFamily: fonts.body, minWidth: 0, background: "transparent" }} />
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
