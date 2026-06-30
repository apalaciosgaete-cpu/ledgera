"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import { fonts } from "@/styles/tokens";
import { httpClient } from "@/shared/http/httpClient";
import type { StagingStatus } from "@/modules/staging/domain/StagingStatus";
import type { StagingSource } from "@/modules/staging/domain/StagingSource";

type CardAction = "CONFIRM" | "REJECT" | "BANK_REVIEW" | "BANK_IGNORE";
type Tab = "ALL" | "EXCHANGE" | "BANK" | "MANUAL";
type StatusFilter = "ALL" | "PENDING" | "REVIEW" | "CONFIRMED" | "REJECTED";

type StagingItem = {
  id: string;
  source: StagingSource;
  sources: string[];
  allIds: string[];
  provider: string;
  status: StagingStatus;
  occurredAt: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  rawType: string;
  linkedMovementId: string | null;
  direction?: "INFLOW" | "OUTFLOW";
  stagingConfidence?: number | null;
};

type StagingCounts = {
  pending: number;
  review: number;
  confirmed: number;
  rejected: number;
};

type StagingData = {
  items: StagingItem[];
  counts: StagingCounts;
};

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

type StagingDetailPm = {
  id: string;
  type: string;
  symbol: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
  executedAt: string;
  source: string;
};

type StagingDetailAuditLog = {
  id: string;
  action: string;
  confidence: number | null;
  reason: string | null;
  createdAt: string;
};

type StagingDetail = {
  itemId: string;
  source: "EXCHANGE" | "BANK";
  exchangeRecords: {
    id: string;
    provider: string;
    status: string;
    occurredAt: string;
    normalizedEventType: string | null;
    externalType: string | null;
    normalizedJson: string | null;
    rawPayloadPreview: string | null;
    taxTreatment: string | null;
    inventoryEffect: string | null;
    economicEffect: string | null;
    movementId: string | null;
  }[];
  bankMovement: null | {
    id: string;
    bankName: string | null;
    occurredAt: string;
    description: string;
    amountClp: number;
    direction: string;
    status: string;
    bankCategory: string | null;
    matchedPortfolioMovementId: string | null;
    matchedConfidence: number | null;
    matchedReason: string | null;
    matchedAt: string | null;
  };
  portfolioMovement: StagingDetailPm | null;
  auditLogs: StagingDetailAuditLog[];
};

const SOURCE_LABEL: Record<string, string> = {
  EXCHANGE: "Exchange",
  BANK: "Banco",
  MANUAL: "Manual",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  REVIEW: "En revisión",
  CONFIRMED: "Confirmado",
  REJECTED: "Rechazado",
  MATCHED: "Conciliado",
  IGNORED: "Ignorado",
  IMPORTED: "Importado",
};

const STATUS_FILTERS: StatusFilter[] = ["ALL", "PENDING", "REVIEW", "CONFIRMED", "REJECTED"];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getProviderLabel(provider: string): string {
  if (provider === "BINANCE_TAX") return "Tax";
  if (provider === "BINANCE") return "Spot";
  return provider || "Fuente";
}

function toneForStatus(status: string): {
  bg: string;
  fg: string;
  border: string;
} {
  if (status === "CONFIRMED" || status === "MATCHED") {
    return { bg: "rgba(22,163,74,0.10)", fg: "#15803D", border: "rgba(22,163,74,0.24)" };
  }

  if (status === "REVIEW") {
    return { bg: "rgba(37,99,235,0.10)", fg: "#1D4ED8", border: "rgba(37,99,235,0.22)" };
  }

  if (status === "REJECTED" || status === "IGNORED") {
    return { bg: "rgba(239,68,68,0.08)", fg: "#DC2626", border: "rgba(239,68,68,0.22)" };
  }

  return { bg: "rgba(245,158,11,0.12)", fg: "#B45309", border: "rgba(245,158,11,0.24)" };
}

function StatusBadge({ status }: { status: string }) {
  const tone = toneForStatus(status);

  return (
    <span style={{
      borderRadius: "999px",
      padding: "2px 8px",
      background: tone.bg,
      color: tone.fg,
      fontSize: "10px",
      fontWeight: 800,
      whiteSpace: "nowrap",
    }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function SourceBadge({ item }: { item: StagingItem }) {
  const isExchange = item.source === "EXCHANGE";

  return (
    <span style={{
      borderRadius: "6px",
      padding: "2px 7px",
      border: `1px solid ${isExchange ? "rgba(245,158,11,0.35)" : "rgba(37,99,235,0.22)"}`,
      background: isExchange ? "rgba(245,158,11,0.10)" : "rgba(37,99,235,0.08)",
      color: isExchange ? "#B45309" : "#1D4ED8",
      fontSize: "10px",
      fontWeight: 800,
      whiteSpace: "nowrap",
    }}>
      {isExchange ? getProviderLabel(item.sources[0] ?? item.provider) : SOURCE_LABEL[item.source] ?? item.source}
    </span>
  );
}

function ActionButton({
  children,
  variant,
  disabled,
  onClick,
}: {
  children: string;
  variant: "green" | "red" | "neutral";
  disabled?: boolean;
  onClick: () => void;
}) {
  const styles =
    variant === "green"
      ? { bg: "#16A34A", fg: "#FFFFFF", border: "1px solid #16A34A" }
      : variant === "red"
        ? { bg: "#FFFFFF", fg: "#DC2626", border: "1px solid rgba(239,68,68,0.35)" }
        : { bg: "#FFFFFF", fg: "#475569", border: "1px solid #CBD5E1" };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        flex: 1,
        minHeight: "31px",
        borderRadius: "8px",
        background: styles.bg,
        color: styles.fg,
        border: styles.border,
        fontSize: "12px",
        fontWeight: 800,
        cursor: disabled ? "wait" : "pointer",
        opacity: disabled ? 0.65 : 1,
      }}
    >
      {children}
    </button>
  );
}

function StagingCard({
  item,
  selected,
  onSelect,
  onAction,
  onViewDetail,
  busy,
}: {
  item: StagingItem;
  selected: boolean;
  onSelect: (id: string) => void;
  onAction: (item: StagingItem, action: CardAction) => Promise<void>;
  onViewDetail: (item: StagingItem) => Promise<void>;
  busy: boolean;
}) {
  const isActive = item.status === "PENDING" || item.status === "REVIEW";
  const amountColor =
    item.direction === "INFLOW"
      ? "#16A34A"
      : item.direction === "OUTFLOW"
        ? "#DC2626"
        : "#334155";

  return (
    <article style={{
      border: `1px solid ${selected ? "#7DD3FC" : "#E2E8F0"}`,
      background: selected ? "rgba(14,165,233,0.05)" : "#FFFFFF",
      borderRadius: "12px",
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: "7px",
      minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          {item.source === "EXCHANGE" && isActive && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(item.id)}
              aria-label={`Seleccionar ${item.title}`}
              style={{ width: "16px", height: "16px", accentColor: "#0EA5E9", cursor: "pointer", flexShrink: 0 }}
            />
          )}
          <SourceBadge item={item} />
          <StatusBadge status={item.status} />
        </div>
        <span style={{ fontSize: "11px", color: "#94A3B8", whiteSpace: "nowrap" }}>{formatDate(item.occurredAt)}</span>
      </div>

      <div>
        <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#0F2A3D", lineHeight: 1.25 }}>{item.title}</p>
        <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748B", lineHeight: 1.35 }}>{item.subtitle}</p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center" }}>
        <span style={{ fontSize: "12px", fontWeight: 800, color: amountColor }}>{item.amountLabel}</span>
        {item.allIds.length > 1 && <span style={{ fontSize: "10px", color: "#94A3B8" }}>{item.allIds.length} fuentes</span>}
      </div>

      {item.source === "EXCHANGE" && isActive && (
        <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
          <ActionButton variant="green" disabled={busy} onClick={() => void onAction(item, "CONFIRM")}>Confirmar</ActionButton>
          <ActionButton variant="red" disabled={busy} onClick={() => void onAction(item, "REJECT")}>Rechazar</ActionButton>
        </div>
      )}

      {item.source === "BANK" && isActive && (
        <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
          <ActionButton variant="neutral" disabled={busy} onClick={() => void onAction(item, "BANK_REVIEW")}>Revisión</ActionButton>
          <ActionButton variant="red" disabled={busy} onClick={() => void onAction(item, "BANK_IGNORE")}>Ignorar</ActionButton>
        </div>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={() => void onViewDetail(item)}
        style={{
          marginTop: "2px",
          padding: 0,
          border: "none",
          background: "none",
          color: "#64748B",
          fontSize: "11px",
          textAlign: "left",
          textDecoration: "underline",
          cursor: busy ? "wait" : "pointer",
        }}
      >
        Ver detalle
      </button>
    </article>
  );
}

function StatusSummary({
  label,
  count,
  status,
  active,
  onClick,
}: {
  label: string;
  count: number;
  status: StatusFilter;
  active: boolean;
  onClick: () => void;
}) {
  const tone = status === "ALL"
    ? { bg: "#0F2A3D", fg: "#FFFFFF", border: "#0F2A3D" }
    : toneForStatus(status);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: "78px",
        textAlign: "left",
        borderRadius: "14px",
        padding: "13px 15px",
        border: `1px solid ${active ? "#0F2A3D" : tone.border}`,
        background: active ? "#0F2A3D" : "#FFFFFF",
        color: active ? "#FFFFFF" : "#0F2A3D",
        cursor: "pointer",
        boxShadow: active ? "0 8px 24px rgba(15,42,61,0.16)" : "none",
      }}
    >
      <span style={{ display: "block", color: active ? "#FFFFFF" : "#64748B", fontSize: "11px", fontWeight: 800, marginBottom: "8px" }}>{label}</span>
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "30px",
        height: "24px",
        borderRadius: "999px",
        background: active ? "rgba(255,255,255,0.16)" : tone.bg,
        color: active ? "#FFFFFF" : tone.fg,
        fontSize: "13px",
        fontWeight: 900,
      }}>
        {count}
      </span>
    </button>
  );
}

function ReviewCompleteBanner({ confirmed, rejected }: { confirmed: number; rejected: number }) {
  return (
    <section style={{
      marginBottom: "14px",
      padding: "14px 16px",
      borderRadius: "14px",
      border: "1px solid rgba(22,163,74,0.24)",
      background: "rgba(22,163,74,0.08)",
      color: "#166534",
    }}>
      <strong style={{ display: "block", fontSize: "14px", marginBottom: "3px" }}>Revisión terminada para esta vista.</strong>
      <span style={{ fontSize: "13px" }}>
        No hay pendientes ni registros en revisión. Se muestran los registros ya resueltos: {confirmed} confirmados{rejected > 0 ? ` y ${rejected} rechazados` : ""}.
      </span>
    </section>
  );
}

function StatusSection({
  title,
  status,
  items,
  empty,
  selectedIds,
  onSelect,
  onAction,
  onViewDetail,
  busyIds,
  wide,
}: {
  title: string;
  status: StatusFilter;
  items: StagingItem[];
  empty: string;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onAction: (item: StagingItem, action: CardAction) => Promise<void>;
  onViewDetail: (item: StagingItem) => Promise<void>;
  busyIds: Set<string>;
  wide: boolean;
}) {
  const tone = toneForStatus(status);

  return (
    <section style={{
      minHeight: items.length === 0 ? "280px" : "auto",
      background: "#F8FAFC",
      border: "1px solid #E2E8F0",
      borderRadius: "16px",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      overflow: "visible",
    }}>
      <header style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 900, color: "#0F2A3D" }}>{title}</h2>
        <span style={{
          minWidth: "24px",
          textAlign: "center",
          borderRadius: "999px",
          padding: "2px 8px",
          background: tone.bg,
          color: tone.fg,
          fontSize: "11px",
          fontWeight: 900,
        }}>
          {items.length}
        </span>
      </header>

      <div style={{
        display: "grid",
        gridTemplateColumns: wide ? "repeat(auto-fill, minmax(280px, 1fr))" : "1fr",
        alignContent: "start",
        gap: "8px",
        overflow: "visible",
      }}>
        {items.length === 0 ? (
          <p style={{ margin: "auto 0", textAlign: "center", color: "#CBD5E1", fontSize: "12px", padding: "96px 0", gridColumn: "1 / -1" }}>{empty}</p>
        ) : (
          items.map((item) => (
            <StagingCard
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              onSelect={onSelect}
              onAction={onAction}
              onViewDetail={onViewDetail}
              busy={busyIds.has(item.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function DetailPanel({
  detail,
  item,
  onClose,
}: {
  detail: StagingDetail;
  item: StagingItem;
  onClose: () => void;
}) {
  const portfolio = detail.portfolioMovement;

  return (
    <aside style={{
      position: "fixed",
      top: "72px",
      right: "24px",
      bottom: "24px",
      width: "min(820px, calc(100vw - 48px))",
      zIndex: 80,
      overflowY: "auto",
      borderRadius: "18px",
      border: "1px solid #CBD5E1",
      background: "#FFFFFF",
      boxShadow: "0 24px 80px rgba(15,42,61,0.25)",
      padding: "20px",
      fontFamily: fonts.body,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "18px" }}>
        <div>
          <p style={{ margin: 0, fontSize: "11px", color: "#64748B", fontWeight: 800, textTransform: "uppercase" }}>Detalle del registro</p>
          <h2 style={{ margin: "4px 0 6px", fontSize: "20px", color: "#0F2A3D" }}>{item.title}</h2>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <SourceBadge item={item} />
            <StatusBadge status={item.status} />
            <span style={{ color: "#64748B", fontSize: "12px" }}>{formatDate(item.occurredAt)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "7px 12px",
            borderRadius: "9px",
            border: "1px solid #CBD5E1",
            background: "#FFFFFF",
            color: "#475569",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 800,
          }}
        >
          Cerrar
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
        <section style={panelStyle}>
          <h3 style={panelTitleStyle}>Resumen</h3>
          <Info label="Origen" value={SOURCE_LABEL[item.source] ?? item.source} />
          <Info label="Proveedor" value={item.provider || item.sources.join(", ")} />
          <Info label="Monto" value={item.amountLabel} strong />
          <Info label="Estado" value={STATUS_LABEL[item.status] ?? item.status} />
          <Info label="IDs agrupados" value={String(item.allIds.length)} />
        </section>

        <section style={panelStyle}>
          <h3 style={panelTitleStyle}>Movimiento de portafolio</h3>
          {portfolio ? (
            <>
              <Info label="Tipo" value={portfolio.type} />
              <Info label="Activo" value={portfolio.symbol} />
              <Info label="Cantidad" value={String(portfolio.quantity)} strong />
              <Info label="Precio USD" value={portfolio.priceUsd.toFixed(2)} />
              <Info label="Fee USD" value={portfolio.feeUsd.toFixed(6)} />
            </>
          ) : (
            <p style={{ margin: 0, color: "#CBD5E1", fontSize: "12px", textAlign: "center", padding: "24px 0" }}>Sin movimiento vinculado aún.</p>
          )}
        </section>

        {detail.exchangeRecords.length > 0 && (
          <section style={panelStyle}>
            <h3 style={panelTitleStyle}>Fuentes Exchange ({detail.exchangeRecords.length})</h3>
            {detail.exchangeRecords.map((record) => (
              <div key={record.id} style={{ borderTop: "1px solid #F1F5F9", paddingTop: "10px", marginTop: "10px" }}>
                <Info label="Proveedor" value={record.provider} />
                <Info label="Evento" value={record.normalizedEventType ?? record.externalType ?? "—"} />
                <Info label="Tratamiento" value={record.taxTreatment ?? "—"} />
                <Info label="Inventario" value={record.inventoryEffect ?? "—"} />
                <JsonBlock label="Normalizado" value={record.normalizedJson} />
                <JsonBlock label="Payload" value={record.rawPayloadPreview} />
              </div>
            ))}
          </section>
        )}

        {detail.bankMovement && (
          <section style={panelStyle}>
            <h3 style={panelTitleStyle}>Banco</h3>
            <Info label="Banco" value={detail.bankMovement.bankName ?? "—"} />
            <Info label="Descripción" value={detail.bankMovement.description} />
            <Info label="Estado" value={detail.bankMovement.status} />
            <Info label="Monto CLP" value={String(detail.bankMovement.amountClp)} strong />
          </section>
        )}

        <section style={panelStyle}>
          <h3 style={panelTitleStyle}>Auditoría ({detail.auditLogs.length})</h3>
          {detail.auditLogs.length === 0 ? (
            <p style={{ margin: 0, color: "#CBD5E1", fontSize: "12px", textAlign: "center", padding: "24px 0" }}>Sin registros de auditoría.</p>
          ) : (
            detail.auditLogs.map((log) => (
              <div key={log.id} style={{ borderTop: "1px solid #F1F5F9", paddingTop: "8px", marginTop: "8px" }}>
                <Info label="Acción" value={log.action} />
                <Info label="Fecha" value={formatDate(log.createdAt)} />
                {log.reason && <Info label="Razón" value={log.reason} />}
              </div>
            ))
          )}
        </section>
      </div>
    </aside>
  );
}

const panelStyle: CSSProperties = {
  border: "1px solid #E2E8F0",
  borderRadius: "14px",
  background: "#F8FAFC",
  padding: "14px",
};

const panelTitleStyle: CSSProperties = {
  margin: "0 0 12px",
  color: "#0F2A3D",
  fontSize: "13px",
  fontWeight: 900,
};

function Info({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "7px", alignItems: "baseline" }}>
      <span style={{ width: "112px", flexShrink: 0, color: "#94A3B8", fontSize: "11px" }}>{label}</span>
      <span style={{ color: "#334155", fontSize: "12px", fontWeight: strong ? 900 : 600, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

function JsonBlock({ label, value }: { label: string; value: string | null }) {
  const [open, setOpen] = useState(false);
  if (!value) return null;

  let pretty = value;
  try {
    pretty = JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    // leave raw value
  }

  return (
    <div style={{ marginTop: "8px" }}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={{ background: "none", border: "none", padding: 0, color: "#64748B", fontSize: "11px", textDecoration: "underline", cursor: "pointer" }}
      >
        {open ? `Ocultar ${label}` : `Ver ${label}`}
      </button>
      {open && (
        <pre style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          maxHeight: "220px",
          overflow: "auto",
          margin: "8px 0 0",
          border: "1px solid #E2E8F0",
          borderRadius: "10px",
          padding: "10px",
          background: "#FFFFFF",
          color: "#475569",
          fontSize: "10px",
        }}>
          {pretty}
        </pre>
      )}
    </div>
  );
}

function countByStatus(items: StagingItem[], status: StatusFilter): number {
  if (status === "ALL") return items.length;
  return items.filter((item) => item.status === status).length;
}

function bulkButtonStyle(variant: "green" | "red", busy: boolean): CSSProperties {
  return {
    border: variant === "green" ? "1px solid #16A34A" : "1px solid rgba(239,68,68,0.35)",
    background: variant === "green" ? "#16A34A" : "#FFFFFF",
    color: variant === "green" ? "#FFFFFF" : "#DC2626",
    borderRadius: "8px",
    padding: "7px 14px",
    fontSize: "12px",
    fontWeight: 900,
    cursor: busy ? "wait" : "pointer",
    opacity: busy ? 0.65 : 1,
  };
}

export default function ImportacionesPage() {
  const [data, setData] = useState<StagingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<"confirm" | "reject" | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<StagingDetail | null>(null);
  const [selectedItem, setSelectedItem] = useState<StagingItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient<ApiResponse<StagingData>>("/api/imports/staging", { auth: true });
      setData(response.data);
      setSelectedIds((current) => {
        const validIds = new Set(response.data.items.map((item) => item.id));
        return new Set([...current].filter((id) => validIds.has(id)));
      });
    } catch {
      setError("No se pudo cargar la bandeja de importaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const allItems = data?.items ?? [];

  const sourceItems = useMemo(() => {
    if (tab === "ALL") return allItems;
    return allItems.filter((item) => item.source === tab);
  }, [allItems, tab]);

  const pending = sourceItems.filter((item) => item.status === "PENDING");
  const review = sourceItems
    .filter((item) => item.status === "REVIEW")
    .sort((a, b) => (b.stagingConfidence ?? -1) - (a.stagingConfidence ?? -1));
  const confirmed = sourceItems.filter((item) => item.status === "CONFIRMED");
  const rejected = sourceItems.filter((item) => item.status === "REJECTED");

  const sections = useMemo(() => {
    const allSections = [
      { status: "PENDING" as const, title: "Pendientes", items: pending, empty: "Sin registros pendientes" },
      { status: "REVIEW" as const, title: "En revisión", items: review, empty: "Sin registros en revisión" },
      { status: "CONFIRMED" as const, title: "Confirmados", items: confirmed, empty: "Sin registros confirmados" },
      { status: "REJECTED" as const, title: "Rechazados", items: rejected, empty: "Sin registros rechazados" },
    ];

    if (statusFilter === "ALL") {
      const nonEmpty = allSections.filter((section) => section.items.length > 0);
      return nonEmpty.length > 0 ? nonEmpty : allSections.slice(0, 1);
    }

    return allSections.filter((section) => section.status === statusFilter);
  }, [confirmed, pending, rejected, review, statusFilter]);

  const selectablePendingIds = useMemo(
    () => pending.filter((item) => item.source === "EXCHANGE").map((item) => item.id),
    [pending],
  );

  const selectedVisiblePending = selectablePendingIds.filter((id) => selectedIds.has(id)).length;
  const allVisiblePendingSelected = selectablePendingIds.length > 0 && selectedVisiblePending === selectablePendingIds.length;
  const selectedExchangeCount = sourceItems.filter((item) => selectedIds.has(item.id) && item.source === "EXCHANGE").length;
  const workflowComplete = pending.length === 0 && review.length === 0 && (confirmed.length > 0 || rejected.length > 0);

  const tabs: { key: Tab; label: string }[] = [
    { key: "ALL", label: "Todos" },
    { key: "EXCHANGE", label: "Exchange" },
    { key: "BANK", label: "Banco" },
    { key: "MANUAL", label: "Manual" },
  ];

  function toggleSelect(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisiblePending() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisiblePendingSelected) {
        for (const id of selectablePendingIds) next.delete(id);
      } else {
        for (const id of selectablePendingIds) next.add(id);
      }
      return next;
    });
  }

  async function runAction(item: StagingItem, action: CardAction) {
    setBusyIds((current) => new Set(current).add(item.id));
    try {
      if (action === "CONFIRM") {
        await httpClient("/api/imports/staging/confirm", {
          auth: true,
          method: "POST",
          body: { recordIds: item.allIds },
        });
      } else if (action === "REJECT") {
        await httpClient("/api/imports/staging/reject", {
          auth: true,
          method: "POST",
          body: { recordIds: item.allIds },
        });
      } else if (action === "BANK_IGNORE") {
        await httpClient("/api/imports/staging/bank/reject", {
          auth: true,
          method: "POST",
          body: { bankMovementIds: [item.id] },
        });
      } else if (action === "BANK_REVIEW") {
        await httpClient("/api/imports/staging/bank/review", {
          auth: true,
          method: "POST",
          body: { bankMovementId: item.id },
        });
      }

      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
      await load();
    } finally {
      setBusyIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  }

  async function runBulk(action: "confirm" | "reject") {
    const items = sourceItems.filter((item) => selectedIds.has(item.id) && item.source === "EXCHANGE");
    if (items.length === 0) return;

    setBulkBusy(action);
    try {
      for (const item of items) {
        await httpClient(action === "confirm" ? "/api/imports/staging/confirm" : "/api/imports/staging/reject", {
          auth: true,
          method: "POST",
          body: { recordIds: item.allIds },
        });
      }
      setSelectedIds(new Set());
      await load();
    } finally {
      setBulkBusy(null);
    }
  }

  async function openDetail(item: StagingItem) {
    setBusyIds((current) => new Set(current).add(item.id));
    try {
      const response = await httpClient<ApiResponse<StagingDetail>>(
        `/api/imports/staging/detail?id=${encodeURIComponent(item.id)}`,
        { auth: true },
      );
      setSelectedDetail(response.data);
      setSelectedItem(item);
    } catch {
      setError("No se pudo abrir el detalle del registro.");
    } finally {
      setBusyIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  }

  return (
    <main style={{ fontFamily: fonts.body }}>
      <header style={{ marginBottom: "22px" }}>
        <h1 style={{ margin: 0, fontSize: "24px", color: "#0F2A3D", fontWeight: 900 }}>Importaciones</h1>
        <p style={{ margin: "6px 0 0", color: "#64748B", fontSize: "14px" }}>
          Revisa pendientes, confirma lo válido y consulta el historial resuelto.
        </p>
      </header>

      <nav style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "14px", flexWrap: "wrap" }}>
        {tabs.map(({ key, label }) => {
          const active = tab === key;
          const count = key === "ALL" ? allItems.length : allItems.filter((item) => item.source === key).length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                minHeight: "38px",
                padding: "7px 16px",
                borderRadius: "10px",
                background: active ? "#0F2A3D" : "#FFFFFF",
                color: active ? "#FFFFFF" : "#64748B",
                border: `1px solid ${active ? "#0F2A3D" : "#E2E8F0"}`,
                fontWeight: active ? 900 : 700,
                cursor: "pointer",
              }}
            >
              {label}
              {count > 0 && <span style={{ marginLeft: "7px", fontSize: "11px", opacity: 0.9 }}>{count}</span>}
            </button>
          );
        })}
      </nav>

      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "10px",
        marginBottom: "14px",
      }}>
        <StatusSummary label="Todos los estados" status="ALL" count={sourceItems.length} active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")} />
        <StatusSummary label="Pendientes" status="PENDING" count={countByStatus(sourceItems, "PENDING")} active={statusFilter === "PENDING"} onClick={() => setStatusFilter("PENDING")} />
        <StatusSummary label="En revisión" status="REVIEW" count={countByStatus(sourceItems, "REVIEW")} active={statusFilter === "REVIEW"} onClick={() => setStatusFilter("REVIEW")} />
        <StatusSummary label="Confirmados" status="CONFIRMED" count={countByStatus(sourceItems, "CONFIRMED")} active={statusFilter === "CONFIRMED"} onClick={() => setStatusFilter("CONFIRMED")} />
        <StatusSummary label="Rechazados" status="REJECTED" count={countByStatus(sourceItems, "REJECTED")} active={statusFilter === "REJECTED"} onClick={() => setStatusFilter("REJECTED")} />
      </section>

      {selectablePendingIds.length > 0 && (
        <section style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "14px",
          padding: "11px 14px",
          borderRadius: "12px",
          border: "1px solid #BAE6FD",
          background: "rgba(14,165,233,0.07)",
        }}>
          <label style={{ display: "flex", alignItems: "center", gap: "9px", color: "#0369A1", fontSize: "13px", fontWeight: 900, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={allVisiblePendingSelected}
              onChange={toggleSelectAllVisiblePending}
              style={{ width: "17px", height: "17px", accentColor: "#0EA5E9" }}
            />
            Seleccionar todos los pendientes visibles
          </label>

          <span style={{ color: "#64748B", fontSize: "12px" }}>
            {selectedVisiblePending} de {selectablePendingIds.length} pendientes visibles seleccionados.
          </span>
        </section>
      )}

      {selectedExchangeCount > 0 && (
        <section style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "14px",
          padding: "11px 14px",
          borderRadius: "12px",
          border: "1px solid #7DD3FC",
          background: "rgba(14,165,233,0.10)",
        }}>
          <strong style={{ color: "#0369A1", fontSize: "13px" }}>{selectedExchangeCount} seleccionado{selectedExchangeCount !== 1 ? "s" : ""}</strong>
          <button type="button" disabled={bulkBusy !== null} onClick={() => void runBulk("confirm")} style={bulkButtonStyle("green", bulkBusy !== null)}>
            {bulkBusy === "confirm" ? "Confirmando…" : "Confirmar seleccionados"}
          </button>
          <button type="button" disabled={bulkBusy !== null} onClick={() => void runBulk("reject")} style={bulkButtonStyle("red", bulkBusy !== null)}>
            {bulkBusy === "reject" ? "Rechazando…" : "Rechazar seleccionados"}
          </button>
          <button type="button" onClick={() => setSelectedIds(new Set())} style={{ marginLeft: "auto", border: "1px solid #CBD5E1", background: "#FFFFFF", borderRadius: "8px", padding: "6px 10px", color: "#64748B", fontSize: "12px", fontWeight: 800, cursor: "pointer" }}>
            Limpiar selección
          </button>
        </section>
      )}

      {workflowComplete && statusFilter === "ALL" && (
        <ReviewCompleteBanner confirmed={confirmed.length} rejected={rejected.length} />
      )}

      {error && (
        <div style={{ marginBottom: "14px", padding: "11px 14px", borderRadius: "12px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)", color: "#B91C1C", fontSize: "13px", fontWeight: 700 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#94A3B8", fontSize: "13px" }}>Cargando bandeja…</p>
      ) : (
        <section style={{
          display: "grid",
          gridTemplateColumns: sections.length === 1 ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "16px",
          alignItems: "start",
        }}>
          {sections.map((section) => (
            <StatusSection
              key={section.status}
              title={section.title}
              status={section.status}
              items={section.items}
              empty={section.empty}
              selectedIds={selectedIds}
              onSelect={toggleSelect}
              onAction={runAction}
              onViewDetail={openDetail}
              busyIds={busyIds}
              wide={sections.length === 1}
            />
          ))}
        </section>
      )}

      {selectedDetail && selectedItem && (
        <DetailPanel
          detail={selectedDetail}
          item={selectedItem}
          onClose={() => { setSelectedDetail(null); setSelectedItem(null); }}
        />
      )}
    </main>
  );
}
