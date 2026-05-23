"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Suggestion = {
  bankMovementId:      string;
  portfolioMovementId: string;
  confidence:          number;
  reason:              string;
  bank: {
    occurredAt:  string;
    description: string;
    amountClp:   number;
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

type RowState = "pending" | "accepted" | "review" | "ignored";

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

function truncate(s: string, n = 34): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ── Confidence badge ──────────────────────────────────────────────────────────
function ConfidenceBadge({ confidence }: { confidence: number }) {
  let bg = "#F1F5F9", color = "#475569", border = "#E2E8F0";
  if (confidence > 0.85) { bg = "#DCFCE7"; color = "#166534"; border = "#BBF7D0"; }
  else if (confidence >= 0.60) { bg = "#FEF3C7"; color = "#92400E"; border = "#FDE68A"; }

  return (
    <span style={{
      display:      "inline-flex",
      alignItems:   "center",
      padding:      "3px 10px",
      borderRadius: "20px",
      fontSize:     "13px",
      fontWeight:   700,
      background:   bg,
      color,
      border:       `1px solid ${border}`,
    }}>
      {Math.round(confidence * 100)}%
    </span>
  );
}

// ── Row state badge ───────────────────────────────────────────────────────────
function StateBadge({ state }: { state: RowState }) {
  const map: Record<RowState, { label: string; bg: string; color: string; border: string }> = {
    pending:  { label: "Pendiente",    bg: "#F1F5F9", color: "#475569", border: "#E2E8F0" },
    accepted: { label: "Aceptado",     bg: "#DCFCE7", color: "#166534", border: "#BBF7D0" },
    review:   { label: "En revisión",  bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
    ignored:  { label: "Ignorado",     bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" },
  };
  const s = map[state];
  return (
    <span style={{
      display:      "inline-flex",
      alignItems:   "center",
      padding:      "3px 10px",
      borderRadius: "20px",
      fontSize:     "12px",
      fontWeight:   500,
      background:   s.bg,
      color:        s.color,
      border:       `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({
  label, onClick, variant,
}: {
  label:   string;
  onClick: () => void;
  variant: "accept" | "ignore" | "review";
}) {
  const [hover, setHover] = useState(false);
  const styles = {
    accept: { base: "#DCFCE7", text: "#166534", hoverBg: "#16A34A", hoverText: "#fff" },
    ignore: { base: "#FEE2E2", text: "#991B1B", hoverBg: "#DC2626", hoverText: "#fff" },
    review: { base: "#F1F5F9", text: "#475569", hoverBg: "#E2E8F0", hoverText: "#0F2A3D" },
  };
  const s = styles[variant];
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding:      "5px 12px",
        borderRadius: "7px",
        fontSize:     "12px",
        fontWeight:   500,
        border:       "none",
        cursor:       "pointer",
        background:   hover ? s.hoverBg : s.base,
        color:        hover ? s.hoverText : s.text,
        transition:   "all 0.15s ease",
        whiteSpace:   "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────
function SummaryCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div style={{
      background:   "#ffffff",
      borderRadius: "12px",
      border:       "1px solid #E2E8F0",
      padding:      "20px 24px",
    }}>
      <div style={{ fontSize: "28px", fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "13px", color: "#64748B", marginTop: "6px" }}>{label}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReconciliationPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [rowStates,   setRowStates]   = useState<Record<string, RowState>>({});
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/bank/match/binance", { method: "POST" });
      const json = await res.json() as ApiResponse<{ suggestions: Suggestion[]; total: number }>;
      if (json.ok) {
        setSuggestions(json.data.suggestions ?? []);
        setRowStates({});
      } else {
        setError(json.message ?? "Error al cargar sugerencias.");
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchSuggestions(); }, [fetchSuggestions]);

  function setState(bankMovementId: string, state: RowState) {
    setRowStates(prev => ({ ...prev, [bankMovementId]: state }));
  }

  // Summary counts (computed from local state)
  const counts = suggestions.reduce(
    (acc, s) => {
      const st = rowStates[s.bankMovementId] ?? "pending";
      acc[st]++;
      return acc;
    },
    { pending: 0, accepted: 0, review: 0, ignored: 0 } as Record<RowState, number>,
  );

  // Visible rows: hide ignored ones
  const visible = suggestions.filter(s => (rowStates[s.bankMovementId] ?? "pending") !== "ignored");

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
        <SummaryCard label="Pendientes"      value={counts.pending}  accent="#0F2A3D" />
        <SummaryCard
          label="Alta confianza"
          value={suggestions.filter(s => s.confidence > 0.85).length}
          accent="#16A34A"
        />
        <SummaryCard
          label="Revisión manual"
          value={suggestions.filter(s => s.confidence >= 0.60 && s.confidence <= 0.85).length}
          accent="#D97706"
        />
        <SummaryCard label="Conciliados"     value={counts.accepted} accent="#64748B" />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{
          background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0",
          padding: "64px 24px", textAlign: "center", color: "#94A3B8", fontSize: "14px",
        }}>
          Analizando movimientos…
        </div>
      ) : error ? (
        <div style={{
          background: "#FEF2F2", borderRadius: "12px", border: "1px solid #FECACA",
          padding: "24px", color: "#991B1B", fontSize: "14px",
        }}>
          {error}
        </div>
      ) : suggestions.length === 0 ? (
        <div style={{
          background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0",
          padding: "64px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>✓</div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#0F2A3D", marginBottom: "4px" }}>
            Sin sugerencias pendientes
          </div>
          <div style={{ fontSize: "13px", color: "#94A3B8" }}>
            No hay egresos bancarios que coincidan con actividad Binance en ±3 días.
          </div>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                  {["Banco", "Crypto", "Confidence", "Estado", "Acción"].map((col, i) => (
                    <th key={col} style={{
                      padding:    "12px 16px",
                      textAlign:  i === 4 ? "right" : "left",
                      fontWeight: 600,
                      color:      "#475569",
                      fontSize:   "12px",
                      whiteSpace: "nowrap",
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map(s => {
                  const state = rowStates[s.bankMovementId] ?? "pending";
                  return (
                    <tr
                      key={`${s.bankMovementId}-${s.portfolioMovementId}`}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        background:   state === "accepted" ? "#F0FDF4" : state === "review" ? "#FFFBEB" : "transparent",
                        transition:   "background 0.2s ease",
                      }}
                    >
                      {/* Banco */}
                      <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F2A3D", marginBottom: "3px" }}>
                          {truncate(s.bank.description)}
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "#DC2626" }}>
                          -{formatClp(s.bank.amountClp)}
                        </div>
                        <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "3px" }}>
                          {formatDate(s.bank.occurredAt)}
                        </div>
                      </td>

                      {/* Crypto */}
                      <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "#0F2A3D" }}>
                            {s.crypto.symbol}
                          </span>
                          <span style={{
                            fontSize: "11px", fontWeight: 600, padding: "1px 6px",
                            borderRadius: "4px", background: "#EFF6FF", color: "#1D4ED8",
                          }}>
                            {s.crypto.type}
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748B" }}>{s.crypto.source ?? "—"}</div>
                        <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "3px" }}>
                          {formatDate(s.crypto.occurredAt)}
                        </div>
                        <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
                          {s.crypto.quantity.toLocaleString("en-US", { maximumFractionDigits: 6 })}
                          {" × $"}{s.crypto.priceUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                        </div>
                      </td>

                      {/* Confidence */}
                      <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                        <ConfidenceBadge confidence={s.confidence} />
                        <div style={{
                          fontSize: "11px", color: "#94A3B8", marginTop: "5px",
                          maxWidth: "180px", lineHeight: 1.5,
                        }}>
                          {s.reason}
                        </div>
                      </td>

                      {/* Estado */}
                      <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                        <StateBadge state={state} />
                      </td>

                      {/* Acción */}
                      <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                          {state !== "accepted" && (
                            <ActionBtn label="Aceptar" onClick={() => setState(s.bankMovementId, "accepted")} variant="accept" />
                          )}
                          {state !== "review" && state !== "accepted" && (
                            <ActionBtn label="Revisar" onClick={() => setState(s.bankMovementId, "review")} variant="review" />
                          )}
                          <ActionBtn label="Ignorar" onClick={() => setState(s.bankMovementId, "ignored")} variant="ignore" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{
            padding:   "12px 16px",
            borderTop: "1px solid #F1F5F9",
            fontSize:  "12px",
            color:     "#94A3B8",
            display:   "flex",
            gap:       "16px",
          }}>
            <span>{suggestions.length} sugerencia{suggestions.length !== 1 ? "s" : ""} encontradas</span>
            {counts.accepted > 0 && <span style={{ color: "#16A34A" }}>· {counts.accepted} aceptadas (sin guardar)</span>}
            {counts.review > 0   && <span style={{ color: "#D97706" }}>· {counts.review} en revisión</span>}
          </div>
        </div>
      )}
    </div>
  );
}
