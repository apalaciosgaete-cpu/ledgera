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

type Tab = "ALL" | "EXCHANGE" | "BANK" | "MANUAL";
type StatusFilter = "ALL" | "PENDING" | "REVIEW" | "CONFIRMED" | "REJECTED";
type CardAction = "CONFIRM" | "REJECT" | "BANK_REVIEW" | "BANK_IGNORE";

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

type StagingDetail = Record<string, unknown>;

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

function tone(status: string) {
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

function statusTitle(status: StatusFilter): string {
  if (status === "ALL") return "Todos los estados";
  return STATUS_LABEL[status] ?? status;
}

function statusCount(items: StagingItem[], status: StatusFilter): number {
  if (status === "ALL") return items.length;
  return items.filter((item) => item.status === status).length;
}

function StatusBadge({ status }: { status: string }) {
  const t = tone(status);
  return (
    <span style={{
      borderRadius: "999px",
      padding: "2px 8px",
      background: t.bg,
      color: t.fg,
      fontSize: 10,
      fontWeight: 850,
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
      borderRadius: 6,
      padding: "2px 7px",
      border: `1px solid ${isExchange ? "rgba(245,158,11,0.35)" : "rgba(37,99,235,0.22)"}`,
      background: isExchange ? "rgba(245,158,11,0.10)" : "rgba(37,99,235,0.08)",
      color: isExchange ? "#B45309" : "#1D4ED8",
      fontSize: 10,
      fontWeight: 850,
      whiteSpace: "nowrap",
    }}>
      {isExchange ? getProviderLabel(item.sources[0] ?? item.provider) : SOURCE_LABEL[item.source] ?? item.source}
    </span>
  );
}

function ActionButton({
  label,
  variant,
  busy,
  onClick,
}: {
  label: string;
  variant: "green" | "red" | "neutral";
  busy: boolean;
  onClick: () => void;
}) {
  const style =
    variant === "green"
      ? { bg: "#16A34A", fg: "#FFFFFF", border: "#16A34A" }
      : variant === "red"
        ? { bg: "#FFFFFF", fg: "#DC2626", border: "rgba(239,68,68,0.38)" }
        : { bg: "#FFFFFF", fg: "#475569", border: "#CBD5E1" };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      style={{
        flex: 1,
        minHeight: 32,
        borderRadius: 8,
        background: style.bg,
        color: style.fg,
        border: `1px solid ${style.border}`,
        fontSize: 12,
        fontWeight: 850,
        cursor: busy ? "wait" : "pointer",
        opacity: busy ? 0.65 : 1,
      }}
    >
      {label}
    </button>
  );
}

function StagingCard({
  item,
  selected,
  busy,
  onSelect,
  onAction,
  onDetail,
}: {
  item: StagingItem;
  selected: boolean;
  busy: boolean;
  onSelect: (id: string) => void;
  onAction: (item: StagingItem, action: CardAction) => Promise<void>;
  onDetail: (item: StagingItem) => Promise<void>;
}) {
  const active = item.status === "PENDING" || item.status === "REVIEW";
  const amountColor = item.direction === "INFLOW" ? "#16A34A" : item.direction === "OUTFLOW" ? "#DC2626" : "#334155";

  return (
    <article style={{
      border: `1px solid ${selected ? "#7DD3FC" : "#E2E8F0"}`,
      background: selected ? "rgba(14,165,233,0.05)" : "#FFFFFF",
      borderRadius: 12,
      padding: "12px 14px",
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: 7,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {item.source === "EXCHANGE" && active && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(item.id)}
              aria-label={`Seleccionar ${item.title}`}
              style={{ width: 16, height: 16, accentColor: "#0EA5E9", cursor: "pointer", flexShrink: 0 }}
            />
          )}
          <SourceBadge item={item} />
          <StatusBadge status={item.status} />
        </div>
        <span style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>{formatDate(item.occurredAt)}</span>
      </div>

      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 850, color: "#0F2A3D", lineHeight: 1.25 }}>{item.title}</p>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748B", lineHeight: 1.35 }}>{item.subtitle}</p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 850, color: amountColor }}>{item.amountLabel}</span>
        {item.allIds.length > 1 && <span style={{ fontSize: 10, color: "#94A3B8" }}>{item.allIds.length} fuentes</span>}
      </div>

      {item.source === "EXCHANGE" && active && (
        <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
          <ActionButton label="Confirmar" variant="green" busy={busy} onClick={() => void onAction(item, "CONFIRM")} />
          <ActionButton label="Rechazar" variant="red" busy={busy} onClick={() => void onAction(item, "REJECT")} />
        </div>
      )}

      {item.source === "BANK" && active && (
        <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
          <ActionButton label="Revisión" variant="neutral" busy={busy} onClick={() => void onAction(item, "BANK_REVIEW")} />
          <ActionButton label="Ignorar" variant="red" busy={busy} onClick={() => void onAction(item, "BANK_IGNORE")} />
        </div>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={() => void onDetail(item)}
        style={{
          marginTop: 2,
          padding: 0,
          border: "none",
          background: "none",
          color: "#64748B",
          fontSize: 11,
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

function StatusButton({
  status,
  count,
  active,
  onClick,
}: {
  status: StatusFilter;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const t = status === "ALL" ? { bg: "#0F2A3D", fg: "#FFFFFF", border: "#0F2A3D" } : tone(status);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 64,
        textAlign: "left",
        borderRadius: 14,
        padding: "12px 14px",
        border: `1px solid ${active ? "#0F2A3D" : t.border}`,
        background: active ? "#0F2A3D" : "#FFFFFF",
        color: active ? "#FFFFFF" : "#0F2A3D",
        cursor: "pointer",
      }}
    >
      <span style={{ display: "block", color: active ? "#FFFFFF" : "#64748B", fontSize: 11, fontWeight: 850, marginBottom: 8 }}>
        {statusTitle(status)}
      </span>
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 30,
        height: 24,
        borderRadius: "999px",
        background: active ? "rgba(255,255,255,0.16)" : t.bg,
        color: active ? "#FFFFFF" : t.fg,
        fontSize: 13,
        fontWeight: 900,
      }}>
        {count}
      </span>
    </button>
  );
}

function Section({
  title,
  status,
  items,
  selectedIds,
  busyIds,
  onSelect,
  onAction,
  onDetail,
}: {
  title: string;
  status: StatusFilter;
  items: StagingItem[];
  selectedIds: Set<string>;
  busyIds: Set<string>;
  onSelect: (id: string) => void;
  onAction: (item: StagingItem, action: CardAction) => Promise<void>;
  onDetail: (item: StagingItem) => Promise<void>;
}) {
  const t = tone(status);

  return (
    <section style={{
      border: "1px solid #E2E8F0",
      borderRadius: 16,
      background: "#F8FAFC",
      padding: 16,
      overflow: "visible",
    }}>
      <header style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#0F2A3D" }}>{title}</h2>
        <span style={{
          minWidth: 24,
          textAlign: "center",
          borderRadius: "999px",
          padding: "2px 8px",
          background: t.bg,
          color: t.fg,
          fontSize: 11,
          fontWeight: 900,
        }}>
          {items.length}
        </span>
      </header>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 10,
        overflow: "visible",
      }}>
        {items.map((item) => (
          <StagingCard
            key={item.id}
            item={item}
            selected={selectedIds.has(item.id)}
            busy={busyIds.has(item.id)}
            onSelect={onSelect}
            onAction={onAction}
            onDetail={onDetail}
          />
        ))}
      </div>
    </section>
  );
}

function DetailDrawer({
  item,
  detail,
  onClose,
}: {
  item: StagingItem;
  detail: StagingDetail;
  onClose: () => void;
}) {
  return (
    <aside style={{
      position: "fixed",
      top: 72,
      right: 24,
      bottom: 24,
      width: "min(820px, calc(100vw - 48px))",
      zIndex: 80,
      overflowY: "auto",
      borderRadius: 18,
      border: "1px solid #CBD5E1",
      background: "#FFFFFF",
      boxShadow: "0 24px 80px rgba(15,42,61,0.25)",
      padding: 20,
      fontFamily: fonts.body,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: "#64748B", fontWeight: 850, textTransform: "uppercase" }}>Detalle del registro</p>
          <h2 style={{ margin: "4px 0 6px", fontSize: 20, color: "#0F2A3D" }}>{item.title}</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <SourceBadge item={item} />
            <StatusBadge status={item.status} />
            <span style={{ color: "#64748B", fontSize: 12 }}>{formatDate(item.occurredAt)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "7px 12px",
            borderRadius: 9,
            border: "1px solid #CBD5E1",
            background: "#FFFFFF",
            color: "#475569",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 850,
          }}
        >
          Cerrar
        </button>
      </div>

      <pre style={{
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        margin: 0,
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding: 14,
        background: "#F8FAFC",
        color: "#334155",
        fontSize: 11,
        lineHeight: 1.5,
      }}>
        {JSON.stringify(detail, null, 2)}
      </pre>
    </aside>
  );
}

function bulkButtonStyle(variant: "green" | "red", busy: boolean): CSSProperties {
  return {
    border: variant === "green" ? "1px solid #16A34A" : "1px solid rgba(239,68,68,0.35)",
    background: variant === "green" ? "#16A34A" : "#FFFFFF",
    color: variant === "green" ? "#FFFFFF" : "#DC2626",
    borderRadius: 8,
    padding: "7px 14px",
    fontSize: 12,
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
  const [detail, setDetail] = useState<StagingDetail | null>(null);
  const [detailItem, setDetailItem] = useState<StagingItem | null>(null);

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
  const review = sourceItems.filter((item) => item.status === "REVIEW").sort((a, b) => (b.stagingConfidence ?? -1) - (a.stagingConfidence ?? -1));
  const confirmed = sourceItems.filter((item) => item.status === "CONFIRMED");
  const rejected = sourceItems.filter((item) => item.status === "REJECTED");

  const visibleSections = useMemo(() => {
    const base = [
      { status: "PENDING" as const, title: "Pendientes", items: pending },
      { status: "REVIEW" as const, title: "En revisión", items: review },
      { status: "CONFIRMED" as const, title: "Confirmados", items: confirmed },
      { status: "REJECTED" as const, title: "Rechazados", items: rejected },
    ];

    if (statusFilter !== "ALL") {
      return base.filter((section) => section.status === statusFilter);
    }

    return base.filter((section) => section.items.length > 0);
  }, [confirmed, pending, rejected, review, statusFilter]);

  const selectablePendingIds = pending.filter((item) => item.source === "EXCHANGE").map((item) => item.id);
  const selectedVisiblePending = selectablePendingIds.filter((id) => selectedIds.has(id)).length;
  const allVisiblePendingSelected = selectablePendingIds.length > 0 && selectedVisiblePending === selectablePendingIds.length;
  const selectedExchangeItems = sourceItems.filter((item) => selectedIds.has(item.id) && item.source === "EXCHANGE");
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
        selectablePendingIds.forEach((id) => next.delete(id));
      } else {
        selectablePendingIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  async function runAction(item: StagingItem, action: CardAction) {
    setBusyIds((current) => new Set(current).add(item.id));

    try {
      if (action === "CONFIRM") {
        await httpClient("/api/imports/staging/confirm", { auth: true, method: "POST", body: { recordIds: item.allIds } });
      } else if (action === "REJECT") {
        await httpClient("/api/imports/staging/reject", { auth: true, method: "POST", body: { recordIds: item.allIds } });
      } else if (action === "BANK_IGNORE") {
        await httpClient("/api/imports/staging/bank/reject", { auth: true, method: "POST", body: { bankMovementIds: [item.id] } });
      } else if (action === "BANK_REVIEW") {
        await httpClient("/api/imports/staging/bank/review", { auth: true, method: "POST", body: { bankMovementId: item.id } });
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
    if (selectedExchangeItems.length === 0) return;

    setBulkBusy(action);
    try {
      for (const item of selectedExchangeItems) {
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
      const response = await httpClient<ApiResponse<StagingDetail>>(`/api/imports/staging/detail?id=${encodeURIComponent(item.id)}`, { auth: true });
      setDetail(response.data);
      setDetailItem(item);
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
    <main style={{
      fontFamily: fonts.body,
      minHeight: "calc(100vh - 100px)",
      paddingBottom: 80,
      overflow: "visible",
    }}>
      <header style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 24, color: "#0F2A3D", fontWeight: 900 }}>Importaciones</h1>
        <p style={{ margin: "6px 0 0", color: "#64748B", fontSize: 14 }}>
          Revisa pendientes, confirma lo válido y consulta el historial resuelto.
        </p>
      </header>

      <nav style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        {tabs.map(({ key, label }) => {
          const active = tab === key;
          const count = key === "ALL" ? allItems.length : allItems.filter((item) => item.source === key).length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                minHeight: 38,
                padding: "7px 16px",
                borderRadius: 10,
                background: active ? "#0F2A3D" : "#FFFFFF",
                color: active ? "#FFFFFF" : "#64748B",
                border: `1px solid ${active ? "#0F2A3D" : "#E2E8F0"}`,
                fontWeight: active ? 900 : 700,
                cursor: "pointer",
              }}
            >
              {label}{count > 0 && <span style={{ marginLeft: 7, fontSize: 11 }}>{count}</span>}
            </button>
          );
        })}
      </nav>

      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 10,
        marginBottom: 14,
      }}>
        {STATUS_FILTERS.map((status) => (
          <StatusButton
            key={status}
            status={status}
            count={statusCount(sourceItems, status)}
            active={statusFilter === status}
            onClick={() => setStatusFilter(status)}
          />
        ))}
      </section>

      {selectablePendingIds.length > 0 && (
        <section style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 14,
          padding: "11px 14px",
          borderRadius: 12,
          border: "1px solid #BAE6FD",
          background: "rgba(14,165,233,0.07)",
        }}>
          <label style={{ display: "flex", alignItems: "center", gap: 9, color: "#0369A1", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={allVisiblePendingSelected}
              onChange={toggleSelectAllVisiblePending}
              style={{ width: 17, height: 17, accentColor: "#0EA5E9" }}
            />
            Seleccionar todos los pendientes visibles
          </label>
          <span style={{ color: "#64748B", fontSize: 12 }}>
            {selectedVisiblePending} de {selectablePendingIds.length} pendientes visibles seleccionados.
          </span>
        </section>
      )}

      {selectedExchangeItems.length > 0 && (
        <section style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 14,
          padding: "11px 14px",
          borderRadius: 12,
          border: "1px solid #7DD3FC",
          background: "rgba(14,165,233,0.10)",
        }}>
          <strong style={{ color: "#0369A1", fontSize: 13 }}>{selectedExchangeItems.length} seleccionado{selectedExchangeItems.length !== 1 ? "s" : ""}</strong>
          <button type="button" disabled={bulkBusy !== null} onClick={() => void runBulk("confirm")} style={bulkButtonStyle("green", bulkBusy !== null)}>
            {bulkBusy === "confirm" ? "Confirmando…" : "Confirmar seleccionados"}
          </button>
          <button type="button" disabled={bulkBusy !== null} onClick={() => void runBulk("reject")} style={bulkButtonStyle("red", bulkBusy !== null)}>
            {bulkBusy === "reject" ? "Rechazando…" : "Rechazar seleccionados"}
          </button>
          <button type="button" onClick={() => setSelectedIds(new Set())} style={{ marginLeft: "auto", border: "1px solid #CBD5E1", background: "#FFFFFF", borderRadius: 8, padding: "6px 10px", color: "#64748B", fontSize: 12, fontWeight: 850, cursor: "pointer" }}>
            Limpiar selección
          </button>
        </section>
      )}

      {error && (
        <div style={{ marginBottom: 14, padding: "11px 14px", borderRadius: 12, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)", color: "#B91C1C", fontSize: 13, fontWeight: 750 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#94A3B8", fontSize: 13 }}>Cargando bandeja…</p>
      ) : visibleSections.length === 0 ? (
        <section style={{ border: "1px solid #E2E8F0", background: "#FFFFFF", borderRadius: 16, padding: 24, color: "#64748B" }}>
          No hay registros para esta vista.
        </section>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, overflow: "visible" }}>
          {visibleSections.map((section) => (
            <Section
              key={section.status}
              title={section.title}
              status={section.status}
              items={section.items}
              selectedIds={selectedIds}
              busyIds={busyIds}
              onSelect={toggleSelect}
              onAction={runAction}
              onDetail={openDetail}
            />
          ))}
        </div>
      )}

      {detail && detailItem && (
        <DetailDrawer
          item={detailItem}
          detail={detail}
          onClose={() => {
            setDetail(null);
            setDetailItem(null);
          }}
        />
      )}
    </main>
  );
}
