"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { fonts } from "@/styles/tokens";
import { httpClient } from "@/shared/http/httpClient";
import type { StagingStatus } from "@/modules/staging/domain/StagingStatus";
import type { StagingSource } from "@/modules/staging/domain/StagingSource";

// ── Types ──────────────────────────────────────────────────────────────────────
type CardAction    = "CONFIRM" | "REJECT" | "BANK_REVIEW" | "BANK_IGNORE";

type MatchCandidate = {
  portfolioMovementId: string;
  confidence:          number;
  reason:              string;
  movement: {
    type:       string;
    symbol:     string;
    quantity:   number;
    priceUsd:   number;
    executedAt: string;
    source:     string;
  };
};

type StagingItem = {
  id:               string;
  source:           StagingSource;
  sources:          string[];
  allIds:           string[];
  provider:         string;
  status:           StagingStatus;
  occurredAt:       string;
  title:            string;
  subtitle:         string;
  amountLabel:      string;
  rawType:          string;
  linkedMovementId: string | null;
  direction?:        "INFLOW" | "OUTFLOW";
  stagingConfidence?: number | null;
};

type StagingCounts = {
  pending:   number;
  review:    number;
  confirmed: number;
  rejected:  number;
};

type StagingData = {
  items:  StagingItem[];
  counts: StagingCounts;
};

type ApiResponse<T> = { ok: boolean; message: string; data: T };

type Tab = "ALL" | "EXCHANGE" | "BANK" | "MANUAL";

type StagingDetailPm = {
  id:         string;
  type:       string;
  symbol:     string;
  quantity:   number;
  priceUsd:   number;
  feeUsd:     number;
  executedAt: string;
  source:     string;
};

type StagingDetailAuditLog = {
  id:         string;
  action:     string;
  confidence: number | null;
  reason:     string | null;
  createdAt:  string;
};

type TimelineEvent = {
  at:              string;
  type:            string;
  label:           string;
  actor:           string | null;
  metadata?:       Record<string, unknown>;
  validationCode?: string | null;
};

type TimelineData = {
  entityId:   string;
  entityType: string;
  events:     TimelineEvent[];
};

type StagingDetail = {
  itemId:  string;
  source:  "EXCHANGE" | "BANK";
  exchangeRecords: {
    id:                  string;
    provider:            string;
    status:              string;
    occurredAt:          string;
    normalizedEventType: string | null;
    externalType:        string | null;
    normalizedJson:      string | null;
    rawPayloadPreview:   string | null;
    taxTreatment:        string | null;
    inventoryEffect:     string | null;
    economicEffect:      string | null;
    movementId:          string | null;
  }[];
  bankMovement: null | {
    id:                         string;
    bankName:                   string | null;
    occurredAt:                 string;
    description:                string;
    amountClp:                  number;
    direction:                  string;
    status:                     string;
    bankCategory:               string | null;
    matchedPortfolioMovementId: string | null;
    matchedConfidence:          number | null;
    matchedReason:              string | null;
    matchedAt:                  string | null;
  };
  portfolioMovement: StagingDetailPm | null;
  auditLogs:         StagingDetailAuditLog[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const PM_TYPE_LABEL: Record<string, string> = {
  BUY:      "Compra",
  SELL:     "Venta",
  DEPOSIT:  "Depósito",
  WITHDRAW: "Retiro",
};

const SOURCE_LABEL: Record<string, string> = {
  EXCHANGE: "Exchange",
  BANK:     "Banco",
  MANUAL:   "Manual",
};

const SOURCE_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  EXCHANGE: { bg: "rgba(240,185,11,0.1)",  color: "#B45309", border: "rgba(240,185,11,0.3)"  },
  BANK:     { bg: "rgba(37,99,235,0.08)",  color: "#1D4ED8", border: "rgba(37,99,235,0.2)"   },
  MANUAL:   { bg: "rgba(168,85,247,0.08)", color: "#7C3AED", border: "rgba(168,85,247,0.2)"  },
};

const PROVIDER_BADGE: Record<string, { label: string; bg: string; color: string; border: string }> = {
  BINANCE:     { label: "Spot", bg: "rgba(240,185,11,0.1)",  color: "#B45309", border: "rgba(240,185,11,0.3)"  },
  BINANCE_TAX: { label: "Tax",  bg: "rgba(59,130,246,0.1)",  color: "#1D4ED8", border: "rgba(59,130,246,0.3)"  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── SourceBadges ──────────────────────────────────────────────────────────────

function SourceBadges({ source, sources }: { source: StagingSource; sources: string[] }) {
  if (source !== "EXCHANGE") {
    const t = SOURCE_COLOR[source] ?? SOURCE_COLOR.MANUAL;
    return (
      <span style={{
        fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "5px",
        background: t.bg, color: t.color, border: `1px solid ${t.border}`,
      }}>
        {SOURCE_LABEL[source] ?? source}
      </span>
    );
  }

  return (
    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
      {sources.map(provider => {
        const b = PROVIDER_BADGE[provider] ?? PROVIDER_BADGE.BINANCE;
        return (
          <span key={provider} style={{
            fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "5px",
            background: b.bg, color: b.color, border: `1px solid ${b.border}`,
          }}>
            {b.label}
          </span>
        );
      })}
    </div>
  );
}

// ── ConfidenceBadge ───────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const isHigh   = confidence >= 0.90;
  const isMedium = confidence >= 0.60;

  const label  = isHigh ? "Alta certeza"   : isMedium ? "Media certeza" : "Baja certeza";
  const bg     = isHigh ? "rgba(22,163,74,0.1)"  : isMedium ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.08)";
  const color  = isHigh ? "#15803D"               : isMedium ? "#B45309"               : "#DC2626";
  const border = isHigh ? "rgba(22,163,74,0.3)"   : isMedium ? "rgba(245,158,11,0.3)"  : "rgba(239,68,68,0.2)";

  return (
    <span style={{
      fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "5px",
      background: bg, color, border: `1px solid ${border}`,
    }}>
      {label}
    </span>
  );
}

// ── StagingCard ───────────────────────────────────────────────────────────────

function ActionBtn({
  label, active, color, onClick, disabled,
}: {
  label:    string;
  active:   boolean;
  color:    "green" | "red" | "blue";
  onClick:  () => void;
  disabled: boolean;
}) {
  const bg    = color === "green" ? "#16A34A" : color === "red" ? "transparent" : "transparent";
  const fg    = color === "green" ? "#FFFFFF"  : color === "red" ? "#EF4444"    : "#3B82F6";
  const bdr   = color === "green" ? "none"     : `1px solid currentColor`;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        flex: 1, padding: "5px 0", borderRadius: "7px", fontSize: "11px", fontWeight: 700,
        background: bg, color: fg, border: bdr, cursor: disabled ? "wait" : "pointer",
        opacity: disabled ? 0.65 : 1,
      }}
    >
      {active ? "..." : label}
    </button>
  );
}

function StagingCard({
  item,
  onAction,
  onReload,
  onItemUpdate,
  onViewDetail,
  selected,
  onSelect,
}: {
  item:          StagingItem;
  onAction:      (item: StagingItem, action: CardAction) => Promise<void>;
  onReload:      () => void;
  onItemUpdate:  (itemId: string, patch: Partial<StagingItem> | null) => void;
  onViewDetail:  (detail: StagingDetail, item: StagingItem) => void;
  selected?:     boolean;
  onSelect?:     (id: string) => void;
}) {
  const [acting,           setActing]          = useState<CardAction | null>(null);
  const [showCandidates,   setShowCandidates]  = useState(false);
  const [candidates,       setCandidates]      = useState<MatchCandidate[]>([]);
  const [loadingCands,     setLoadingCands]    = useState(false);
  const [confirmingId,     setConfirmingId]    = useState<string | null>(null);
  const [matchError,       setMatchError]      = useState<string | null>(null);
  const [loadingDetail,    setLoadingDetail]   = useState(false);

  async function handle(action: CardAction) {
    setActing(action);
    try { await onAction(item, action); } finally { setActing(null); }
  }

  async function fetchCandidates() {
    if (showCandidates) { setShowCandidates(false); setCandidates([]); return; }
    setLoadingCands(true);
    setMatchError(null);
    try {
      const res = await httpClient<{ ok: boolean; data: { candidates: MatchCandidate[] } }>(
        `/api/imports/staging/bank/match?bankMovementId=${encodeURIComponent(item.id)}`,
        { auth: true },
      );
      setCandidates(res.data.candidates);
      setShowCandidates(true);
    } catch {
      setMatchError("No se pudo cargar candidatos.");
    } finally {
      setLoadingCands(false);
    }
  }

  async function confirmMatch(candidate: MatchCandidate) {
    setConfirmingId(candidate.portfolioMovementId);
    setMatchError(null);
    try {
      await httpClient("/api/imports/staging/bank/match/confirm", {
        auth: true, method: "POST",
        body: {
          bankMovementId:      item.id,
          portfolioMovementId: candidate.portfolioMovementId,
          confidence:          candidate.confidence,
          reason:              candidate.reason,
        },
      });
      setShowCandidates(false);
      setCandidates([]);
      // Optimistic: move card to Confirmados immediately
      onItemUpdate(item.id, {
        status:          "CONFIRMED",
        linkedMovementId: candidate.portfolioMovementId,
      });
      onReload();
    } catch {
      setMatchError("No se pudo confirmar el match.");
    } finally {
      setConfirmingId(null);
    }
  }

  async function handleViewDetail() {
    setLoadingDetail(true);
    try {
      const res = await httpClient<ApiResponse<StagingDetail>>(
        `/api/imports/staging/detail?id=${encodeURIComponent(item.id)}`,
        { auth: true },
      );
      onViewDetail(res.data, item);
    } catch {
      // silently ignore — user can retry
    } finally {
      setLoadingDetail(false);
    }
  }

  const busy     = acting !== null;
  const isActive = item.status === "PENDING" || item.status === "REVIEW";

  const amountColor = item.direction === "INFLOW"
    ? "#16A34A"
    : item.direction === "OUTFLOW"
    ? "#DC2626"
    : "#334155";

  return (
    <div style={{
      background: selected ? "rgba(14,165,233,0.04)" : "#FFFFFF",
      border: `1px solid ${selected ? "#7DD3FC" : "#E2E8F0"}`,
      borderRadius: "10px",
      padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {onSelect && (
            <input
              type="checkbox"
              checked={selected ?? false}
              onChange={() => onSelect(item.id)}
              style={{ width: "14px", height: "14px", cursor: "pointer", marginRight: "2px", accentColor: "#0EA5E9" }}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <SourceBadges source={item.source} sources={item.sources} />
          {item.source === "BANK" && item.status === "REVIEW" && item.stagingConfidence !== null && item.stagingConfidence !== undefined && (
            <ConfidenceBadge confidence={item.stagingConfidence} />
          )}
        </div>
        <span style={{ fontSize: "11px", color: "#94A3B8" }}>{formatDate(item.occurredAt)}</span>
      </div>

      <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#0F2A3D", lineHeight: 1.3 }}>
        {item.title}
      </p>

      <p style={{ margin: 0, fontSize: "11px", color: "#64748B" }}>
        {item.subtitle}
      </p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: amountColor }}>
          {item.amountLabel}
        </span>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {item.allIds.length > 1 && (
            <span style={{ fontSize: "10px", color: "#94A3B8" }}>{item.allIds.length} fuentes</span>
          )}
          {item.linkedMovementId && (
            <span style={{ fontSize: "10px", color: "#22C55E", fontWeight: 600 }}>Conciliado</span>
          )}
        </div>
      </div>

      {/* Exchange actions */}
      {item.source === "EXCHANGE" && isActive && (
        <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
          <ActionBtn label="Confirmar" active={acting === "CONFIRM"} color="green"
            onClick={() => void handle("CONFIRM")} disabled={busy} />
          <ActionBtn label="Rechazar" active={acting === "REJECT"} color="red"
            onClick={() => void handle("REJECT")} disabled={busy} />
        </div>
      )}

      {/* Bank actions */}
      {item.source === "BANK" && isActive && (
        <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
          <ActionBtn label="Ignorar" active={acting === "BANK_IGNORE"} color="red"
            onClick={() => void handle("BANK_IGNORE")} disabled={busy || loadingCands} />
          <button
            type="button"
            onClick={() => void fetchCandidates()}
            disabled={busy || loadingCands || confirmingId !== null}
            style={{
              flex: 1, padding: "5px 0", borderRadius: "7px", fontSize: "11px", fontWeight: 700,
              background: showCandidates ? "#EFF6FF" : "transparent",
              color:  showCandidates ? "#1D4ED8" : "#3B82F6",
              border: `1px solid ${showCandidates ? "#BFDBFE" : "currentColor"}`,
              cursor: (busy || loadingCands || confirmingId !== null) ? "wait" : "pointer",
              opacity: (busy || loadingCands || confirmingId !== null) ? 0.65 : 1,
            }}
          >
            {loadingCands ? "Buscando..." : showCandidates ? "Cerrar" : "Buscar match"}
          </button>
        </div>
      )}

      {/* Match candidates */}
      {showCandidates && (
        <div style={{
          marginTop: "4px", borderRadius: "8px", border: "1px solid #BFDBFE",
          background: "#EFF6FF", overflow: "hidden",
        }}>
          {candidates.length === 0 ? (
            <p style={{ margin: 0, padding: "10px 12px", fontSize: "11px", color: "#64748B" }}>
              Sin candidatos en ±3 días con monto compatible.
            </p>
          ) : (
            candidates.map((c) => (
              <div key={c.portfolioMovementId} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "8px 10px", borderBottom: "1px solid #DBEAFE",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#1E3A5F" }}>
                    {PM_TYPE_LABEL[c.movement.type] ?? c.movement.type}
                    {" · "}
                    {c.movement.symbol}
                    {" · "}
                    <span style={{ color: c.confidence >= 0.7 ? "#16A34A" : c.confidence >= 0.5 ? "#B45309" : "#DC2626" }}>
                      {Math.round(c.confidence * 100)}%
                    </span>
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748B", marginTop: "2px" }}>
                    {c.movement.quantity % 1 === 0
                      ? c.movement.quantity
                      : c.movement.quantity.toFixed(6)}
                    {" · "}{formatDate(c.movement.executedAt)}
                  </div>
                  <div style={{ fontSize: "10px", color: "#94A3B8", marginTop: "1px" }}>
                    {c.reason}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={confirmingId !== null}
                  onClick={() => void confirmMatch(c)}
                  style={{
                    flexShrink: 0, padding: "4px 10px", borderRadius: "6px",
                    fontSize: "10px", fontWeight: 700,
                    background: "#1D4ED8", color: "#FFFFFF", border: "none",
                    cursor: confirmingId !== null ? "wait" : "pointer",
                    opacity: confirmingId !== null ? 0.65 : 1,
                  }}
                >
                  {confirmingId === c.portfolioMovementId ? "..." : "Confirmar match"}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {matchError && (
        <p style={{ margin: 0, fontSize: "11px", color: "#DC2626" }}>{matchError}</p>
      )}

      <button
        type="button"
        onClick={() => void handleViewDetail()}
        disabled={loadingDetail}
        style={{
          marginTop: "2px", background: "none", border: "none", padding: 0,
          fontSize: "11px", color: "#94A3B8", cursor: loadingDetail ? "wait" : "pointer",
          textDecoration: "underline", textAlign: "left",
        }}
      >
        {loadingDetail ? "Cargando..." : "Ver detalle"}
      </button>
    </div>
  );
}

// ── DetailPanel ───────────────────────────────────────────────────────────────

const AUDIT_ACTION_LABEL: Record<string, string> = {
  BINANCE_IMPORT_CONFIRMED:   "Confirmado",
  BINANCE_IMPORT_REJECTED:    "Rechazado",
  BANK_MATCH_CONFIRMED:       "Match confirmado",
  BANK_MATCH_REJECTED:        "Match rechazado",
  BANK_MOVEMENT_IGNORED:      "Ignorado",
  BANK_MOVEMENT_REVIEWED:     "Marcado en revisión",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Pendiente",
  REVIEW:    "En revisión",
  CONFIRMED: "Confirmado",
  REJECTED:  "Rechazado",
  MATCHED:   "Conciliado",
  IGNORED:   "Ignorado",
  IMPORTED:  "Importado",
};

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: "rgba(245,158,11,0.12)", color: "#B45309" },
  REVIEW:    { bg: "rgba(37,99,235,0.10)",  color: "#1D4ED8" },
  CONFIRMED: { bg: "rgba(22,163,74,0.10)",  color: "#15803D" },
  REJECTED:  { bg: "rgba(239,68,68,0.08)",  color: "#DC2626" },
  MATCHED:   { bg: "rgba(22,163,74,0.10)",  color: "#15803D" },
  IGNORED:   { bg: "rgba(100,116,139,0.1)", color: "#64748B" },
  IMPORTED:  { bg: "rgba(245,158,11,0.12)", color: "#B45309" },
};

// ── TimelinePanel ─────────────────────────────────────────────────────────────

const TIMELINE_EVENT_COLOR: Record<string, { dot: string; bg: string; color: string }> = {
  IMPORT_SYNCED:              { dot: "#F59E0B", bg: "rgba(245,158,11,0.10)", color: "#B45309" },
  STAGING_NORMALIZED:         { dot: "#F59E0B", bg: "rgba(245,158,11,0.10)", color: "#B45309" },
  STAGING_CONFIRMED:          { dot: "#16A34A", bg: "rgba(22,163,74,0.10)",  color: "#15803D" },
  STAGING_REJECTED:           { dot: "#EF4444", bg: "rgba(239,68,68,0.08)",  color: "#DC2626" },
  BANK_IMPORTED:              { dot: "#3B82F6", bg: "rgba(59,130,246,0.10)", color: "#1D4ED8" },
  BANK_REVIEWED:              { dot: "#3B82F6", bg: "rgba(59,130,246,0.10)", color: "#1D4ED8" },
  BANK_MATCH_CONFIRMED:       { dot: "#16A34A", bg: "rgba(22,163,74,0.10)",  color: "#15803D" },
  BANK_MATCH_REJECTED:        { dot: "#EF4444", bg: "rgba(239,68,68,0.08)",  color: "#DC2626" },
  BANK_IMPORT_REJECTED:       { dot: "#94A3B8", bg: "rgba(100,116,139,0.1)", color: "#64748B" },
  PORTFOLIO_MOVEMENT_CREATED: { dot: "#16A34A", bg: "rgba(22,163,74,0.10)",  color: "#15803D" },
  TAX_EVENT_GENERATED:        { dot: "#7C3AED", bg: "rgba(124,58,237,0.08)", color: "#6D28D9" },
  TAX_PERIOD_CLOSED:          { dot: "#7C3AED", bg: "rgba(124,58,237,0.08)", color: "#6D28D9" },
  REPORT_ISSUED:              { dot: "#0EA5E9", bg: "rgba(14,165,233,0.10)", color: "#0369A1" },
};

function TimelinePanel({
  data,
  onClose,
}: {
  data:    TimelineData;
  onClose: () => void;
}) {
  return (
    <div style={{
      marginTop: "16px", padding: "16px 20px", borderRadius: "14px",
      background: "#FFFFFF", border: "1px solid #E2E8F0",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <span style={{ fontSize: "14px", fontWeight: 700, color: "#0F2A3D" }}>
          Timeline operacional
        </span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>
            {data.events.length} evento{data.events.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none", border: "1px solid #E2E8F0", borderRadius: "7px",
              cursor: "pointer", fontSize: "11px", color: "#64748B", padding: "4px 10px",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Vertical timeline */}
      <div style={{ position: "relative", paddingLeft: "24px" }}>
        {/* Connector line */}
        <div style={{
          position: "absolute", left: "7px", top: "8px",
          width: "2px",
          height: `calc(100% - 16px)`,
          background: "#E2E8F0",
        }} />

        {data.events.map((ev, idx) => {
          const style        = TIMELINE_EVENT_COLOR[ev.type] ?? TIMELINE_EVENT_COLOR.BANK_IMPORTED;
          const meta         = ev.metadata ?? {};
          const mSymbol      = meta.symbol       != null ? String(meta.symbol)       : null;
          const mMovType     = meta.movementType != null ? String(meta.movementType) : null;
          const mEventType   = meta.eventType    != null ? String(meta.eventType)    : null;
          const mPnl         = meta.realizedPnlUsd !== undefined ? Number(meta.realizedPnlUsd) : null;
          const mConfidence  = meta.confidence !== undefined && meta.confidence !== null
            ? Math.round(Number(meta.confidence) * 100) : null;
          const mReason      = meta.reason  != null ? String(meta.reason)  : null;
          const mHash        = meta.decisionHash != null ? String(meta.decisionHash) : null;
          const hasInfoMeta  = !!(mSymbol || mMovType || mEventType || mPnl !== null || mConfidence !== null || mReason);
          return (
            <div key={idx} style={{ position: "relative", marginBottom: "16px" }}>
              {/* Dot */}
              <div style={{
                position: "absolute", left: "-20px", top: "4px",
                width: "10px", height: "10px", borderRadius: "50%",
                background: style.dot, border: "2px solid #FFFFFF",
                boxShadow: `0 0 0 2px ${style.dot}33`,
              }} />

              {/* Event card */}
              <div style={{
                padding: "10px 12px", borderRadius: "9px",
                background: style.bg, border: `1px solid ${style.dot}33`,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: "10px", fontWeight: 700, padding: "1px 6px",
                        borderRadius: "4px", background: "rgba(255,255,255,0.7)",
                        color: style.color, border: `1px solid ${style.dot}44`,
                        fontFamily: "monospace",
                      }}>
                        {ev.type}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#0F2A3D" }}>
                        {ev.label}
                      </span>
                    </div>

                    {ev.actor && (
                      <div style={{ marginTop: "3px", fontSize: "10px", color: "#64748B" }}>
                        Actor: {ev.actor}
                      </div>
                    )}

                    {/* Key metadata fields */}
                    {hasInfoMeta ? (
                      <div style={{ marginTop: "4px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {mSymbol   ? <span style={{ fontSize: "10px", color: "#475569" }}>{mSymbol}</span>   : null}
                        {mMovType  ? <span style={{ fontSize: "10px", color: "#475569" }}>{mMovType}</span>  : null}
                        {mEventType? <span style={{ fontSize: "10px", color: "#475569" }}>{mEventType}</span>: null}
                        {mPnl !== null ? (
                          <span style={{ fontSize: "10px", color: mPnl >= 0 ? "#16A34A" : "#DC2626" }}>
                            PnL: USD {mPnl.toFixed(2)}
                          </span>
                        ) : null}
                        {mConfidence !== null ? (
                          <span style={{ fontSize: "10px", color: "#475569" }}>{mConfidence}% confianza</span>
                        ) : null}
                        {mReason ? <span style={{ fontSize: "10px", color: "#64748B" }}>{mReason}</span> : null}
                      </div>
                    ) : null}

                    {/* Decision hash */}
                    {mHash ? (
                      <div style={{ marginTop: "4px", fontSize: "9px", color: "#CBD5E1", fontFamily: "monospace" }}>
                        {mHash.slice(0, 16)}…
                      </div>
                    ) : null}

                    {/* Validation code */}
                    {ev.validationCode && (
                      <div style={{ marginTop: "4px", fontSize: "9px", color: "#0369A1", fontFamily: "monospace" }}>
                        código: {ev.validationCode.slice(0, 16)}…
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "11px", color: "#64748B" }}>
                      {new Date(ev.at).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                    <div style={{ fontSize: "10px", color: "#94A3B8" }}>
                      {new Date(ev.at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px",
      padding: "14px 16px",
    }}>
      <p style={{
        margin: "0 0 10px", fontSize: "10px", fontWeight: 700,
        color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em",
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "5px", alignItems: "flex-start" }}>
      <span style={{ fontSize: "11px", color: "#94A3B8", minWidth: "120px", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "12px", color: "#334155", fontWeight: 500, flex: 1 }}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLOR[status] ?? STATUS_COLOR.PENDING;
  return (
    <span style={{
      fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "5px",
      background: s.bg, color: s.color,
    }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function CollapsibleJson({ label, json }: { label: string; json: string | null }) {
  const [open, setOpen] = useState(false);
  if (!json) return null;

  let pretty = json;
  try { pretty = JSON.stringify(JSON.parse(json), null, 2); } catch { /* leave as-is */ }

  return (
    <div style={{ marginTop: "8px" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "none", border: "none", padding: 0, cursor: "pointer",
          fontSize: "10px", color: "#64748B", textDecoration: "underline", textAlign: "left",
        }}
      >
        {open ? `▾ Ocultar ${label}` : `▸ Ver ${label}`}
      </button>
      {open && (
        <pre style={{
          margin: "6px 0 0", padding: "10px 12px", borderRadius: "7px",
          background: "#F8FAFC", border: "1px solid #E2E8F0",
          fontSize: "10px", color: "#475569", overflowX: "auto",
          maxHeight: "200px", overflowY: "auto",
          whiteSpace: "pre-wrap", wordBreak: "break-all",
        }}>
          {pretty}
        </pre>
      )}
    </div>
  );
}

function DetailPanel({
  detail,
  item,
  onClose,
}: {
  detail:   StagingDetail;
  item:     StagingItem;
  onClose:  () => void;
}) {
  const [timelineData,    setTimelineData]    = useState<TimelineData | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  async function fetchTimeline() {
    if (timelineData) { setTimelineData(null); return; }
    setTimelineLoading(true);
    try {
      const entityType = item.source === "EXCHANGE" ? "STAGING" : "BANK";
      const res = await httpClient<ApiResponse<TimelineData>>(
        `/api/timeline/entity?id=${encodeURIComponent(item.id)}&type=${entityType}`,
        { auth: true },
      );
      setTimelineData(res.data);
    } catch {
      // silently ignore
    } finally {
      setTimelineLoading(false);
    }
  }

  const bm  = detail.bankMovement;
  const pm  = detail.portfolioMovement;
  const recs = detail.exchangeRecords;

  const clpFmt = (n: number) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);

  return (
    <div style={{
      marginTop: "24px", padding: "16px 20px", borderRadius: "14px",
      background: "#F8FAFC", border: "1px solid #E2E8F0",
    }}>
      {/* Panel header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "15px", fontWeight: 700, color: "#0F2A3D" }}>
            Detalle del registro
          </span>
          <SourceBadges source={item.source} sources={item.sources} />
          <StatusBadge status={item.status} />
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "none", border: "1px solid #E2E8F0", borderRadius: "7px",
            cursor: "pointer", fontSize: "11px", color: "#64748B", padding: "4px 10px",
          }}
        >
          Cerrar
        </button>
      </div>

      {/* 2-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Resumen */}
          <DetailSection title="Resumen">
            <InfoRow label="Origen"  value={<SourceBadges source={item.source} sources={item.sources} />} />
            <InfoRow label="Estado"  value={<StatusBadge status={item.status} />} />
            <InfoRow label="Fecha"   value={formatDate(item.occurredAt)} />
            <InfoRow label="Tipo"    value={item.title} />
            <InfoRow label="Monto"   value={<span style={{ fontWeight: 700 }}>{item.amountLabel}</span>} />
          </DetailSection>

          {/* Fuentes — exchange records */}
          {recs.length > 0 && (
            <DetailSection title={`Fuentes (${recs.length})`}>
              {recs.map((r, idx) => {
                const b = PROVIDER_BADGE[r.provider] ?? PROVIDER_BADGE.BINANCE;
                return (
                  <div key={r.id} style={{
                    padding: idx > 0 ? "10px 0 0" : "0",
                    borderTop: idx > 0 ? "1px solid #F1F5F9" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <span style={{
                        fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "5px",
                        background: b.bg, color: b.color, border: `1px solid ${b.border}`,
                      }}>
                        {b.label}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                    <InfoRow label="Evento"    value={r.normalizedEventType ?? r.externalType ?? "—"} />
                    <InfoRow label="Fecha"     value={formatDate(r.occurredAt)} />
                    {r.taxTreatment    && <InfoRow label="Tratamiento" value={r.taxTreatment} />}
                    {r.inventoryEffect && <InfoRow label="Inventario"  value={r.inventoryEffect} />}
                    {r.economicEffect  && <InfoRow label="Económico"   value={r.economicEffect} />}
                    <CollapsibleJson label="datos normalizados" json={r.normalizedJson} />
                    <CollapsibleJson label="payload original"   json={r.rawPayloadPreview} />
                  </div>
                );
              })}
            </DetailSection>
          )}

          {/* Banco */}
          {bm && (
            <DetailSection title="Conciliación bancaria">
              <InfoRow label="Banco"     value={bm.bankName ?? "—"} />
              <InfoRow label="Fecha"     value={formatDate(bm.occurredAt)} />
              <InfoRow label="Estado"    value={<StatusBadge status={bm.status} />} />
              <InfoRow label="Dirección" value={bm.direction === "INFLOW" ? "Ingreso" : "Egreso"} />
              <InfoRow label="Monto"     value={clpFmt(bm.amountClp)} />
              {bm.bankCategory && <InfoRow label="Categoría" value={bm.bankCategory} />}
              <InfoRow label="Descripción" value={bm.description} />
              {bm.matchedConfidence !== null && (
                <InfoRow
                  label="Confianza match"
                  value={
                    <span>
                      {Math.round((bm.matchedConfidence ?? 0) * 100)}%
                      {bm.matchedReason && <span style={{ color: "#64748B", fontWeight: 400 }}> · {bm.matchedReason}</span>}
                    </span>
                  }
                />
              )}
              {bm.matchedAt && <InfoRow label="Conciliado el" value={formatDate(bm.matchedAt)} />}
            </DetailSection>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Portafolio */}
          {pm ? (
            <DetailSection title="Movimiento de portafolio">
              <InfoRow label="Tipo"      value={PM_TYPE_LABEL[pm.type] ?? pm.type} />
              <InfoRow label="Activo"    value={pm.symbol} />
              <InfoRow label="Cantidad"  value={pm.quantity % 1 === 0 ? pm.quantity : pm.quantity.toFixed(8)} />
              <InfoRow label="Precio"    value={`USD ${pm.priceUsd.toFixed(2)}`} />
              {pm.feeUsd > 0 && <InfoRow label="Fee"    value={`USD ${pm.feeUsd.toFixed(6)}`} />}
              <InfoRow label="Fecha"     value={formatDate(pm.executedAt)} />
              <InfoRow label="Fuente"    value={pm.source} />
            </DetailSection>
          ) : (
            <DetailSection title="Movimiento de portafolio">
              <p style={{ margin: 0, fontSize: "12px", color: "#CBD5E1", textAlign: "center", padding: "16px 0" }}>
                Sin movimiento vinculado aún.
              </p>
            </DetailSection>
          )}

          {/* Auditoría */}
          <DetailSection title={`Auditoría (${detail.auditLogs.length})`}>
            {detail.auditLogs.length === 0 ? (
              <p style={{ margin: 0, fontSize: "12px", color: "#CBD5E1", textAlign: "center", padding: "16px 0" }}>
                Sin registros de auditoría.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {detail.auditLogs.map((log) => (
                  <div key={log.id} style={{
                    padding: "8px 10px", borderRadius: "7px",
                    background: "#F8FAFC", border: "1px solid #F1F5F9",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#0F2A3D" }}>
                        {AUDIT_ACTION_LABEL[log.action] ?? log.action}
                      </span>
                      <span style={{ fontSize: "10px", color: "#94A3B8" }}>
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    {log.confidence !== null && (
                      <span style={{ fontSize: "10px", color: "#64748B" }}>
                        Confianza: {Math.round((log.confidence ?? 0) * 100)}%
                      </span>
                    )}
                    {log.reason && (
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748B" }}>
                        {log.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </DetailSection>
        </div>
      </div>

      {/* Timeline toggle */}
      <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #F1F5F9", textAlign: "center" }}>
        <button
          type="button"
          onClick={() => void fetchTimeline()}
          disabled={timelineLoading}
          style={{
            background: "none", border: "1px solid #E2E8F0", borderRadius: "8px",
            padding: "6px 18px", fontSize: "12px", fontWeight: 600,
            color: timelineData ? "#0F2A3D" : "#64748B",
            cursor: timelineLoading ? "wait" : "pointer",
            opacity: timelineLoading ? 0.6 : 1,
          }}
        >
          {timelineLoading ? "Cargando timeline..." : timelineData ? "Ocultar timeline" : "Ver timeline completo"}
        </button>
      </div>

      {timelineData && (
        <TimelinePanel data={timelineData} onClose={() => setTimelineData(null)} />
      )}
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────

function Column({ title, count, color, items, empty, onAction, onReload, onItemUpdate, onViewDetail, selectedIds, onSelect }: {
  title:         string;
  count:         number;
  color:         string;
  items:         StagingItem[];
  empty:         string;
  onAction:      (item: StagingItem, action: CardAction) => Promise<void>;
  onReload:      () => void;
  onItemUpdate:  (itemId: string, patch: Partial<StagingItem> | null) => void;
  onViewDetail:  (detail: StagingDetail, item: StagingItem) => void;
  selectedIds?:  Set<string>;
  onSelect?:     (id: string) => void;
}) {
  return (
    <div style={{
      background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "14px",
      padding: "16px", display: "flex", flexDirection: "column", gap: "10px",
      minHeight: "400px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "14px", fontWeight: 700, color: "#0F2A3D" }}>{title}</span>
        <span style={{
          fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px",
          background: color === "amber"  ? "rgba(245,158,11,0.12)" :
                      color === "blue"   ? "rgba(37,99,235,0.1)"   :
                                           "rgba(22,163,74,0.1)",
          color:      color === "amber"  ? "#B45309" :
                      color === "blue"   ? "#1D4ED8"  :
                                           "#16A34A",
        }}>
          {count}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        {items.length === 0 ? (
          <p style={{ fontSize: "12px", color: "#CBD5E1", margin: "auto 0", textAlign: "center", padding: "24px 0" }}>
            {empty}
          </p>
        ) : (
          items.map((item) => (
            <StagingCard
              key={item.id}
              item={item}
              onAction={onAction}
              onReload={onReload}
              onItemUpdate={onItemUpdate}
              onViewDetail={onViewDetail}
              selected={selectedIds?.has(item.id)}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ImportacionesPage() {
  const [data,        setData]       = useState<StagingData | null>(null);
  const [loading,     setLoading]    = useState(true);
  const [error,       setError]      = useState<string | null>(null);
  const [tab,         setTab]        = useState<Tab>("ALL");
  const [bulkLoading,     setBulkLoading]     = useState<"match" | "ignore" | "auto" | null>(null);
  const [bulkResult,      setBulkResult]      = useState<string | null>(null);
  const [selectedDetail,  setSelectedDetail]  = useState<StagingDetail | null>(null);
  const [selectedItem,    setSelectedItem]    = useState<StagingItem | null>(null);
  const [search,          setSearch]          = useState("");
  const [statusFilter,    setStatusFilter]    = useState<"ALL" | StagingStatus>("ALL");
  const [selectedIds,     setSelectedIds]     = useState<Set<string>>(new Set());
  const [selBulkLoading,  setSelBulkLoading]  = useState<"confirm" | "reject" | null>(null);

  const openDetail = useCallback((detail: StagingDetail, item: StagingItem) => {
    setSelectedDetail(detail);
    setSelectedItem(item);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await httpClient<ApiResponse<StagingData>>("/api/imports/staging", { auth: true });
      setData(res.data);
    } catch {
      setError("No se pudo cargar la bandeja de importaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleItemUpdate = useCallback((itemId: string, patch: Partial<StagingItem> | null) => {
    setData((current) => {
      if (!current) return current;
      if (patch === null) {
        return { ...current, items: current.items.filter((i) => i.id !== itemId) };
      }
      return {
        ...current,
        items: current.items.map((i) => i.id === itemId ? { ...i, ...patch } : i),
      };
    });
  }, []);

  const handleAction = useCallback(async (item: StagingItem, action: CardAction) => {
    if (action === "CONFIRM") {
      await httpClient("/api/imports/staging/confirm", {
        auth: true, method: "POST", body: { recordIds: item.allIds },
      });
      handleItemUpdate(item.id, { status: "CONFIRMED" });
    } else if (action === "REJECT") {
      await httpClient("/api/imports/staging/reject", {
        auth: true, method: "POST", body: { recordIds: item.allIds },
      });
      handleItemUpdate(item.id, { status: "REJECTED" });
    } else if (action === "BANK_IGNORE") {
      await httpClient("/api/imports/staging/bank/reject", {
        auth: true, method: "POST", body: { bankMovementIds: [item.id] },
      });
      handleItemUpdate(item.id, null);
    } else if (action === "BANK_REVIEW") {
      await httpClient("/api/imports/staging/bank/review", {
        auth: true, method: "POST", body: { bankMovementId: item.id },
      });
      handleItemUpdate(item.id, { status: "REVIEW" });
    }
    void load();
  }, [load, handleItemUpdate]);

  const handleBulkMatch = useCallback(async () => {
    setBulkLoading("match");
    setBulkResult(null);
    try {
      const res = await httpClient<ApiResponse<{
        scanned: number; withCandidates: number; withoutCandidates: number;
        promoted: number; promotedHigh: number; promotedMedium: number;
      }>>("/api/imports/staging/bank/match/bulk", { auth: true, method: "POST", body: {} });
      const { scanned, withCandidates, withoutCandidates, promotedHigh, promotedMedium } = res.data;
      const parts: string[] = [`${scanned} escaneados`];
      if (promotedHigh > 0)   parts.push(`${promotedHigh} alta certeza`);
      if (promotedMedium > 0) parts.push(`${promotedMedium} media certeza`);
      if (withCandidates > 0 && promotedHigh === 0 && promotedMedium === 0)
        parts.push(`${withCandidates} con candidatos`);
      if (withoutCandidates > 0) parts.push(`${withoutCandidates} sin match`);
      setBulkResult(parts.join(" · "));
      await load();
    } catch {
      setBulkResult("Error al procesar bulk match.");
    } finally {
      setBulkLoading(null);
    }
  }, [load]);

  const handleIgnoreUnmatched = useCallback(async () => {
    setBulkLoading("ignore");
    setBulkResult(null);
    try {
      const res = await httpClient<ApiResponse<{ ignored: number }>>(
        "/api/imports/staging/bank/ignore-unmatched",
        { auth: true, method: "POST", body: {} },
      );
      const { ignored } = res.data;
      setBulkResult(
        ignored > 0
          ? `${ignored} movimiento${ignored !== 1 ? "s" : ""} sin match ignorado${ignored !== 1 ? "s" : ""}.`
          : "Todos los movimientos tienen candidatos. Nada que ignorar.",
      );
      await load();
    } catch {
      setBulkResult("Error al ignorar.");
    } finally {
      setBulkLoading(null);
    }
  }, [load]);

  const handleAutoConfirm = useCallback(async () => {
    setBulkLoading("auto");
    setBulkResult(null);
    try {
      const res = await httpClient<ApiResponse<{ scanned: number; confirmed: number; skipped: number }>>(
        "/api/imports/staging/auto-confirm",
        { auth: true, method: "POST", body: {} },
      );
      const { scanned, confirmed: c } = res.data;
      setBulkResult(`Auto-confirmación: ${c} confirmados de ${scanned} en revisión.`);
      await load();
    } catch {
      setBulkResult("Error en auto-confirmación.");
    } finally {
      setBulkLoading(null);
    }
  }, [load]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleBulkConfirmSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setSelBulkLoading("confirm");
    try {
      const items = (data?.items ?? []).filter((i) => selectedIds.has(i.id) && i.source === "EXCHANGE");
      for (const item of items) {
        await httpClient("/api/imports/staging/confirm", {
          auth: true, method: "POST", body: { recordIds: item.allIds },
        });
        handleItemUpdate(item.id, { status: "CONFIRMED" });
      }
      setSelectedIds(new Set());
      await load();
    } catch {
      // partial success is fine — items already updated optimistically
    } finally {
      setSelBulkLoading(null);
    }
  }, [selectedIds, data, handleItemUpdate, load]);

  const handleBulkRejectSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setSelBulkLoading("reject");
    try {
      const items = (data?.items ?? []).filter((i) => selectedIds.has(i.id) && i.source === "EXCHANGE");
      for (const item of items) {
        await httpClient("/api/imports/staging/reject", {
          auth: true, method: "POST", body: { recordIds: item.allIds },
        });
        handleItemUpdate(item.id, { status: "REJECTED" });
      }
      setSelectedIds(new Set());
      await load();
    } catch {
      // partial success is fine
    } finally {
      setSelBulkLoading(null);
    }
  }, [selectedIds, data, handleItemUpdate, load]);

  useEffect(() => { void load(); }, [load]);

  const allItems = data?.items ?? [];

  const filtered = useMemo(() => {
    let items = tab === "ALL" ? allItems : allItems.filter((i) => i.source === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.subtitle.toLowerCase().includes(q) ||
        i.provider.toLowerCase().includes(q) ||
        i.amountLabel.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "ALL") {
      items = items.filter((i) => i.status === statusFilter);
    }
    return items;
  }, [allItems, tab, search, statusFilter]);

  const pending   = filtered.filter((i) => i.status === "PENDING");
  const confirmed = filtered.filter((i) => i.status === "CONFIRMED");

  // REVIEW: bank items with high confidence first, then medium, then exchange by date
  const review = filtered
    .filter((i) => i.status === "REVIEW")
    .sort((a, b) => {
      const confA = a.stagingConfidence ?? -1;
      const confB = b.stagingConfidence ?? -1;
      if (confA !== confB) return confB - confA;
      return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
    });

  const tabs: { key: Tab; label: string }[] = [
    { key: "ALL",      label: "Todos"    },
    { key: "EXCHANGE", label: "Exchange" },
    { key: "BANK",     label: "Banco"    },
    { key: "MANUAL",   label: "Manual"   },
  ];

  return (
    <div style={{ fontFamily: fonts.body }}>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#0F2A3D" }}>
          Importaciones
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: "14px", color: "#64748B" }}>
          Bandeja de revisión unificada · todo pasa por aquí antes de llegar al portafolio.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
        {tabs.map(({ key, label }) => {
          const active = tab === key;
          const cnt =
            key === "ALL"      ? allItems.length :
            key === "EXCHANGE" ? allItems.filter((i) => i.source === "EXCHANGE").length :
            key === "BANK"     ? allItems.filter((i) => i.source === "BANK").length     :
                                 allItems.filter((i) => i.source === "MANUAL").length;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                padding: "7px 16px", borderRadius: "9px", fontSize: "13px",
                fontWeight: active ? 700 : 500, fontFamily: fonts.body,
                background: active ? "#0F2A3D" : "#FFFFFF",
                color:      active ? "#FFFFFF"  : "#64748B",
                border:    `1px solid ${active ? "#0F2A3D" : "#E2E8F0"}`,
                cursor: "pointer",
              }}
            >
              {label}
              {cnt > 0 && (
                <span style={{
                  marginLeft: "6px", fontSize: "10px", fontWeight: 700,
                  padding: "1px 6px", borderRadius: "10px",
                  background: active ? "rgba(255,255,255,0.2)" : "#F1F5F9",
                  color:      active ? "#FFFFFF" : "#64748B",
                }}>
                  {cnt}
                </span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => void load()}
          style={{
            marginLeft: "auto", padding: "7px 14px", borderRadius: "9px",
            fontSize: "12px", fontWeight: 600, fontFamily: fonts.body,
            background: "#FFFFFF", color: "#475569",
            border: "1px solid #E2E8F0", cursor: "pointer",
          }}
        >
          Actualizar
        </button>
      </div>

      {/* Search + status filter */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "14px", flexWrap: "wrap" }}>
        <input
          type="search"
          placeholder="Buscar por título, descripción, proveedor o monto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 220px", padding: "7px 12px", borderRadius: "9px",
            fontSize: "13px", fontFamily: fonts.body,
            border: "1px solid #E2E8F0", outline: "none", background: "#FFFFFF",
            color: "#334155",
          }}
        />
        {(["ALL", "PENDING", "REVIEW", "CONFIRMED", "REJECTED"] as const).map((s) => {
          const active = statusFilter === s;
          const label  = s === "ALL" ? "Todos los estados" : s === "PENDING" ? "Pendiente" : s === "REVIEW" ? "En revisión" : s === "CONFIRMED" ? "Confirmado" : "Rechazado";
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "5px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: active ? 700 : 500,
                fontFamily: fonts.body,
                background: active ? "#0F2A3D" : "#FFFFFF",
                color:      active ? "#FFFFFF"  : "#64748B",
                border:    `1px solid ${active ? "#0F2A3D" : "#E2E8F0"}`,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          );
        })}
        {(search || statusFilter !== "ALL") && (
          <button
            type="button"
            onClick={() => { setSearch(""); setStatusFilter("ALL"); }}
            style={{
              padding: "5px 10px", borderRadius: "8px", fontSize: "11px",
              background: "transparent", color: "#94A3B8",
              border: "1px solid #E2E8F0", cursor: "pointer", fontFamily: fonts.body,
            }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Selection bulk actions — shown when items are selected */}
      {selectedIds.size > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap",
          marginBottom: "12px", padding: "10px 14px", borderRadius: "10px",
          background: "rgba(14,165,233,0.06)", border: "1px solid #7DD3FC",
        }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#0369A1" }}>
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            disabled={selBulkLoading !== null}
            onClick={() => void handleBulkConfirmSelected()}
            style={{
              padding: "5px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
              background: selBulkLoading === "confirm" ? "#BBF7D0" : "#16A34A",
              color: "#FFFFFF", border: "none",
              cursor: selBulkLoading !== null ? "wait" : "pointer",
              opacity: selBulkLoading !== null ? 0.7 : 1,
            }}
          >
            {selBulkLoading === "confirm" ? "Confirmando..." : "Confirmar seleccionados"}
          </button>
          <button
            type="button"
            disabled={selBulkLoading !== null}
            onClick={() => void handleBulkRejectSelected()}
            style={{
              padding: "5px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
              background: "transparent", color: "#DC2626",
              border: "1px solid rgba(239,68,68,0.3)",
              cursor: selBulkLoading !== null ? "wait" : "pointer",
              opacity: selBulkLoading !== null ? 0.7 : 1,
            }}
          >
            {selBulkLoading === "reject" ? "Rechazando..." : "Rechazar seleccionados"}
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            style={{
              padding: "5px 10px", borderRadius: "8px", fontSize: "11px",
              background: "transparent", color: "#64748B",
              border: "1px solid #E2E8F0", cursor: "pointer", fontFamily: fonts.body,
              marginLeft: "auto",
            }}
          >
            Limpiar selección
          </button>
        </div>
      )}

      {/* Bank bulk actions — shown when there are BANK items */}
      {allItems.some((i) => i.source === "BANK") && (
        <div style={{
          display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap",
          marginBottom: "16px", padding: "10px 14px", borderRadius: "10px",
          background: "#F0F9FF", border: "1px solid #BAE6FD",
        }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#0369A1", marginRight: "4px" }}>
            Banco
          </span>
          <button
            type="button"
            disabled={bulkLoading !== null}
            onClick={() => void handleBulkMatch()}
            style={{
              padding: "5px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
              background: bulkLoading === "match" ? "#BAE6FD" : "#0EA5E9",
              color: "#FFFFFF", border: "none",
              cursor: bulkLoading !== null ? "wait" : "pointer",
              opacity: bulkLoading !== null ? 0.7 : 1,
            }}
          >
            {bulkLoading === "match" ? "Buscando..." : "Buscar match todos"}
          </button>
          <button
            type="button"
            disabled={bulkLoading !== null}
            onClick={() => void handleAutoConfirm()}
            style={{
              padding: "5px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
              background: bulkLoading === "auto" ? "#D1FAE5" : "#16A34A",
              color: "#FFFFFF", border: "none",
              cursor: bulkLoading !== null ? "wait" : "pointer",
              opacity: bulkLoading !== null ? 0.7 : 1,
            }}
          >
            {bulkLoading === "auto" ? "Auto-confirmando..." : "Auto-confirmar"}
          </button>
          <button
            type="button"
            disabled={bulkLoading !== null}
            onClick={() => void handleIgnoreUnmatched()}
            style={{
              padding: "5px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
              background: "transparent", color: "#64748B",
              border: "1px solid #CBD5E1",
              cursor: bulkLoading !== null ? "wait" : "pointer",
              opacity: bulkLoading !== null ? 0.7 : 1,
            }}
          >
            {bulkLoading === "ignore" ? "Ignorando..." : "Ignorar sin match"}
          </button>
          {bulkResult && (
            <span style={{ fontSize: "11px", color: "#0369A1", marginLeft: "4px" }}>
              {bulkResult}
            </span>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: "16px", padding: "12px 14px", borderRadius: "10px",
          background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
          color: "#B91C1C", fontSize: "13px",
        }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <p style={{ color: "#94A3B8", fontSize: "13px" }}>Cargando bandeja...</p>
      )}

      {/* Kanban */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", alignItems: "start" }}>
          <Column
            title="Pendientes"
            count={pending.length}
            color="amber"
            items={pending}
            empty="Sin registros pendientes"
            onAction={handleAction}
            onReload={load}
            onItemUpdate={handleItemUpdate}
            onViewDetail={openDetail}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
          />
          <Column
            title="En revisión"
            count={review.length}
            color="blue"
            items={review}
            empty="Sin registros en revisión"
            onAction={handleAction}
            onReload={load}
            onItemUpdate={handleItemUpdate}
            onViewDetail={openDetail}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
          />
          <Column
            title="Confirmados"
            count={confirmed.length}
            color="green"
            items={confirmed}
            empty="Sin registros confirmados"
            onAction={handleAction}
            onReload={load}
            onItemUpdate={handleItemUpdate}
            onViewDetail={openDetail}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
          />
        </div>
      )}

      {/* Detail panel */}
      {selectedDetail && selectedItem && (
        <DetailPanel
          detail={selectedDetail}
          item={selectedItem}
          onClose={() => { setSelectedDetail(null); setSelectedItem(null); }}
        />
      )}
    </div>
  );
}
