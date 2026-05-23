"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Suggestion = {
  bankMovementId:      string;
  portfolioMovementId: string;
  confidence:          number;
  reason:              string;
  bank: {
    occurredAt:   string;
    description:  string;
    amountClp:    number;
  };
  crypto: {
    occurredAt: string;
    type:       string;
    symbol:     string;
    quantity:   number;
    priceUsd:   number;
    source:     string | null;
  };
};

type ApiResponse<T> = { ok: boolean; message: string; data: T };

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatClp(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    style:                 "currency",
    currency:              "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day:   "2-digit",
    month: "2-digit",
    year:  "numeric",
  });
}

function confidenceBadge(conf: number): { bg: string; color: string; border: string } {
  if (conf > 0.85)  return { bg: "#DCFCE7", color: "#166534", border: "#BBF7D0" };
  if (conf >= 0.60) return { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" };
  return               { bg: "#F1F5F9", color: "#475569", border: "#E2E8F0" };
}

function truncate(s: string, n = 32): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SummaryCard({
  label, value, accent,
}: { label: string; value: number; accent: string }) {
  return (
    <div style={{
      background:   "#ffffff",
      borderRadius: "12px",
      border:       "1px solid #E2E8F0",
      padding:      "20px 24px",
    }}>
      <div style={{ fontSize: "26px", fontWeight: 700, color: accent, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: "13px", color: "#64748B", marginTop: "6px" }}>{label}</div>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const s = confidenceBadge(confidence);
  return (
    <span style={{
      display:      "inline-flex",
      alignItems:   "center",
      padding:      "3px 10px",
      borderRadius: "20px",
      fontSize:     "13px",
      fontWeight:   600,
      background:   s.bg,
      color:        s.color,
      border:       `1px solid ${s.border}`,
    }}>
      {Math.round(confidence * 100)}%
    </span>
  );
}

function ActionButton({
  label, onClick, disabled, variant,
}: {
  label:    string;
  onClick:  () => void;
  disabled: boolean;
  variant:  "confirm" | "reject" | "review";
}) {
  const [hover, setHover] = useState(false);

  const styles: Record<string, { base: string; baseText: string; hover: string; hoverText: string }> = {
    confirm: { base: "#DCFCE7", baseText: "#166534", hover: "#16A34A", hoverText: "#ffffff" },
    reject:  { base: "#FEE2E2", baseText: "#991B1B", hover: "#DC2626", hoverText: "#ffffff" },
    review:  { base: "#F1F5F9", baseText: "#475569", hover: "#E2E8F0", hoverText: "#0F2A3D" },
  };

  const s = styles[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding:      "5px 12px",
        borderRadius: "7px",
        fontSize:     "12px",
        fontWeight:   500,
        border:       "none",
        cursor:       disabled ? "not-allowed" : "pointer",
        opacity:      disabled ? 0.5 : 1,
        background:   hover && !disabled ? s.hover : s.base,
        color:        hover && !disabled ? s.hoverText : s.baseText,
        transition:   "all 0.15s ease",
        whiteSpace:   "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function SuggestionRow({
  suggestion, isActing, isReviewed, onConfirm, onReject, onReview,
}: {
  suggestion:  Suggestion;
  isActing:    boolean;
  isReviewed:  boolean;
  onConfirm:   () => void;
  onReject:    () => void;
  onReview:    () => void;
}) {
  const { bank, crypto, confidence, reason } = suggestion;

  return (
    <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
      {/* Banco */}
      <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F2A3D", marginBottom: "2px" }}>
          {truncate(bank.description)}
        </div>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#DC2626" }}>
          -{formatClp(bank.amountClp)}
        </div>
        <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
          {formatDate(bank.occurredAt)}
        </div>
      </td>

      {/* Crypto */}
      <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F2A3D" }}>{crypto.symbol}</span>
          <span style={{
            fontSize:     "11px",
            fontWeight:   600,
            padding:      "1px 6px",
            borderRadius: "4px",
            background:   "#EFF6FF",
            color:        "#1D4ED8",
          }}>
            {crypto.type}
          </span>
        </div>
        <div style={{ fontSize: "12px", color: "#64748B" }}>{crypto.source ?? "—"}</div>
        <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
          {formatDate(crypto.occurredAt)}
        </div>
        <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
          {crypto.quantity} × ${crypto.priceUsd.toLocaleString("en-US", { maximumFractionDigits: 4 })}
        </div>
      </td>

      {/* Confidence */}
      <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
        <ConfidenceBadge confidence={confidence} />
        <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px", maxWidth: "160px", lineHeight: 1.4 }}>
          {reason}
        </div>
      </td>

      {/* Estado */}
      <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
        {isReviewed ? (
          <span style={{
            display:      "inline-flex",
            alignItems:   "center",
            padding:      "3px 10px",
            borderRadius: "20px",
            fontSize:     "12px",
            fontWeight:   500,
            background:   "#FEF3C7",
            color:        "#92400E",
            border:       "1px solid #FDE68A",
          }}>
            En revisión
          </span>
        ) : (
          <span style={{
            display:      "inline-flex",
            alignItems:   "center",
            padding:      "3px 10px",
            borderRadius: "20px",
            fontSize:     "12px",
            fontWeight:   500,
            background:   "#F1F5F9",
            color:        "#475569",
            border:       "1px solid #E2E8F0",
          }}>
            Pendiente
          </span>
        )}
      </td>

      {/* Acción */}
      <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <ActionButton label="Aceptar"  onClick={onConfirm} disabled={isActing} variant="confirm" />
          <ActionButton label="Rechazar" onClick={onReject}  disabled={isActing} variant="reject" />
          {!isReviewed && (
            <ActionButton label="Revisar"  onClick={onReview}  disabled={isActing} variant="review" />
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReconciliationPage() {
  const [suggestions,  setSuggestions]  = useState<Suggestion[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [acting,       setActing]       = useState<string | null>(null);
  const [reviewedIds,  setReviewedIds]  = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sugRes, matchRes] = await Promise.all([
        fetch("/api/bank/match/binance", { method: "POST" }),
        fetch("/api/bank/movements?status=MATCHED&limit=1"),
      ]);

      const sugData  = await sugRes.json()  as ApiResponse<{ suggestions: Suggestion[]; total: number }>;
      const matchData = await matchRes.json() as ApiResponse<{ total: number }>;

      if (sugData.ok)   setSuggestions(sugData.data.suggestions ?? []);
      if (matchData.ok) setMatchedCount(matchData.data.total ?? 0);
    } catch {
      setError("No se pudieron cargar las sugerencias.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  async function handleConfirm(s: Suggestion) {
    setActing(s.bankMovementId);
    try {
      const res = await fetch("/api/bank/reconciliation/confirm", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          bankMovementId:      s.bankMovementId,
          portfolioMovementId: s.portfolioMovementId,
          confidence:          s.confidence,
          reason:              s.reason,
        }),
      });
      if (res.ok) {
        setSuggestions(prev => prev.filter(x => x.bankMovementId !== s.bankMovementId));
        setMatchedCount(prev => prev + 1);
      }
    } finally {
      setActing(null);
    }
  }

  async function handleReject(s: Suggestion) {
    setActing(s.bankMovementId);
    try {
      const res = await fetch("/api/bank/reconciliation/reject", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ bankMovementId: s.bankMovementId }),
      });
      if (res.ok) {
        setSuggestions(prev => prev.filter(x => x.bankMovementId !== s.bankMovementId));
      }
    } finally {
      setActing(null);
    }
  }

  function handleReview(bankMovementId: string) {
    setReviewedIds(prev => new Set([...prev, bankMovementId]));
  }

  const highConf = suggestions.filter(s => s.confidence > 0.85).length;
  const midConf  = suggestions.filter(s => s.confidence >= 0.60 && s.confidence <= 0.85).length;
  const pending  = suggestions.length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0F2A3D", margin: 0 }}>
          Conciliación financiera
        </h1>
        <p style={{ fontSize: "14px", color: "#64748B", marginTop: "6px", marginBottom: 0 }}>
          Relaciona movimientos bancarios con actividad crypto.
        </p>
      </div>

      {/* Summary cards */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap:                 "16px",
        marginBottom:        "28px",
      }}>
        <SummaryCard label="Pendientes"      value={pending}      accent="#0F2A3D" />
        <SummaryCard label="Alta confianza"  value={highConf}     accent="#16A34A" />
        <SummaryCard label="Revisión manual" value={midConf}      accent="#D97706" />
        <SummaryCard label="Conciliados"     value={matchedCount} accent="#64748B" />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{
          background:   "#ffffff",
          borderRadius: "12px",
          border:       "1px solid #E2E8F0",
          padding:      "64px 24px",
          textAlign:    "center",
          color:        "#94A3B8",
          fontSize:     "14px",
        }}>
          Analizando movimientos…
        </div>
      ) : error ? (
        <div style={{
          background:   "#FEF2F2",
          borderRadius: "12px",
          border:       "1px solid #FECACA",
          padding:      "24px",
          color:        "#991B1B",
          fontSize:     "14px",
        }}>
          {error}
        </div>
      ) : suggestions.length === 0 ? (
        <div style={{
          background:   "#ffffff",
          borderRadius: "12px",
          border:       "1px solid #E2E8F0",
          padding:      "64px 24px",
          textAlign:    "center",
        }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>✓</div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#0F2A3D", marginBottom: "4px" }}>
            Sin sugerencias pendientes
          </div>
          <div style={{ fontSize: "13px", color: "#94A3B8" }}>
            No hay egresos bancarios que coincidan con movimientos Binance en el rango de ±3 días.
          </div>
        </div>
      ) : (
        <div style={{
          background:   "#ffffff",
          borderRadius: "12px",
          border:       "1px solid #E2E8F0",
          overflow:     "hidden",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                  {["Banco", "Crypto", "Confidence", "Estado", "Acción"].map(col => (
                    <th
                      key={col}
                      style={{
                        padding:    "12px 16px",
                        textAlign:  col === "Acción" ? "right" : "left",
                        fontWeight: 600,
                        color:      "#475569",
                        fontSize:   "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suggestions.map(s => (
                  <SuggestionRow
                    key={`${s.bankMovementId}-${s.portfolioMovementId}`}
                    suggestion={s}
                    isActing={acting === s.bankMovementId}
                    isReviewed={reviewedIds.has(s.bankMovementId)}
                    onConfirm={() => void handleConfirm(s)}
                    onReject={() => void handleReject(s)}
                    onReview={() => handleReview(s.bankMovementId)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            padding:      "12px 16px",
            borderTop:    "1px solid #F1F5F9",
            fontSize:     "12px",
            color:        "#94A3B8",
          }}>
            {suggestions.length} sugerencia{suggestions.length !== 1 ? "s" : ""} · confianza mínima 40%
          </div>
        </div>
      )}
    </div>
  );
}
