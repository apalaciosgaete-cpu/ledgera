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

type MatchedEntry = {
  bankMovement: {
    id:          string;
    description: string;
    amountClp:   number;
    occurredAt:  string;
    bankName:    string | null;
  };
  portfolioMovement: {
    id:         string;
    symbol:     string;
    type:       string;
    quantity:   number;
    priceUsd:   number;
    executedAt: string;
    source:     string | null;
  };
  confidence: number | null;
  matchedAt:  string | null;
  reason:     string | null;
};

type IgnoredMovement = {
  id:          string;
  description: string;
  amountClp:   number;
  occurredAt:  string;
  bankName:    string | null;
  status:      string;
};

type RowState = "pending" | "accepted" | "review" | "ignored";
type Tab      = "suggestions" | "matched" | "ignored";

type ApiResponse<T> = { ok: boolean; message: string; data: T };

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatClp(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function truncate(s: string, n = 34): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ── Confidence badge ──────────────────────────────────────────────────────────
function ConfidenceBadge({ confidence }: { confidence: number | null }) {
  if (confidence === null) return null;
  let bg = "#F1F5F9", color = "#475569", border = "#E2E8F0";
  if (confidence > 0.85)       { bg = "#DCFCE7"; color = "#166534"; border = "#BBF7D0"; }
  else if (confidence >= 0.60) { bg = "#FEF3C7"; color = "#92400E"; border = "#FDE68A"; }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: "20px",
      fontSize: "13px", fontWeight: 700,
      background: bg, color, border: `1px solid ${border}`,
    }}>
      {Math.round(confidence * 100)}%
    </span>
  );
}

// ── Row state badge ───────────────────────────────────────────────────────────
function StateBadge({ state }: { state: RowState }) {
  const map: Record<RowState, { label: string; bg: string; color: string; border: string }> = {
    pending:  { label: "Pendiente",   bg: "#F1F5F9", color: "#475569", border: "#E2E8F0" },
    accepted: { label: "Aceptado",    bg: "#DCFCE7", color: "#166534", border: "#BBF7D0" },
    review:   { label: "En revisión", bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
    ignored:  { label: "Ignorado",    bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" },
  };
  const s = map[state];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: "20px",
      fontSize: "12px", fontWeight: 500,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({
  label, onClick, variant, disabled = false,
}: {
  label: string; onClick: () => void;
  variant: "accept" | "ignore" | "review"; disabled?: boolean;
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
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "5px 12px", borderRadius: "7px", fontSize: "12px",
        fontWeight: 500, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        background: hover && !disabled ? s.hoverBg : s.base,
        color:      hover && !disabled ? s.hoverText : s.text,
        transition: "all 0.15s ease", whiteSpace: "nowrap",
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
      background: "#ffffff", borderRadius: "12px",
      border: "1px solid #E2E8F0", padding: "20px 24px",
    }}>
      <div style={{ fontSize: "28px", fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "13px", color: "#64748B", marginTop: "6px" }}>{label}</div>
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar({
  active, onChange, counts,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  counts: { suggestions: number; matched: number; ignored: number };
}) {
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "suggestions", label: "Sugerencias", count: counts.suggestions },
    { id: "matched",     label: "Conciliados", count: counts.matched },
    { id: "ignored",     label: "Ignorados",   count: counts.ignored },
  ];
  return (
    <div style={{
      display: "flex", gap: "4px", marginBottom: "20px",
      borderBottom: "1px solid #E2E8F0", paddingBottom: "0",
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: "10px 18px", border: "none", background: "transparent",
            cursor: "pointer", fontSize: "14px", fontWeight: active === t.id ? 600 : 400,
            color: active === t.id ? "#0F2A3D" : "#64748B",
            borderBottom: active === t.id ? "2px solid #0F2A3D" : "2px solid transparent",
            transition: "all 0.15s ease",
            display: "flex", alignItems: "center", gap: "6px",
            marginBottom: "-1px",
          }}
        >
          {t.label}
          {t.count > 0 && (
            <span style={{
              fontSize: "11px", fontWeight: 600, padding: "1px 6px",
              borderRadius: "10px",
              background: active === t.id ? "#0F2A3D" : "#E2E8F0",
              color:      active === t.id ? "#ffffff" : "#64748B",
            }}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0",
      padding: "64px 24px", textAlign: "center",
    }}>
      <div style={{ fontSize: "13px", color: "#94A3B8" }}>{message}</div>
    </div>
  );
}

// ── Matched view ──────────────────────────────────────────────────────────────
function MatchedView({ matches }: { matches: MatchedEntry[] }) {
  if (matches.length === 0) {
    return <EmptyState message="No hay conciliaciones confirmadas aún." />;
  }
  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
              {["Banco", "Crypto", "Confidence", "Conciliado"].map(col => (
                <th key={col} style={{
                  padding: "12px 16px", textAlign: "left",
                  fontWeight: 600, color: "#475569", fontSize: "12px", whiteSpace: "nowrap",
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matches.map(m => (
              <tr key={m.bankMovement.id} style={{ borderBottom: "1px solid #F1F5F9", background: "#F0FDF4" }}>
                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  {m.bankMovement.bankName && (
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      {m.bankMovement.bankName}
                    </div>
                  )}
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F2A3D", marginBottom: "3px" }}>
                    {truncate(m.bankMovement.description)}
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#DC2626" }}>
                    -{formatClp(m.bankMovement.amountClp)}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                    {formatDate(m.bankMovement.occurredAt)}
                  </div>
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#0F2A3D" }}>{m.portfolioMovement.symbol}</span>
                    <span style={{
                      fontSize: "11px", fontWeight: 600, padding: "1px 6px",
                      borderRadius: "4px", background: "#EFF6FF", color: "#1D4ED8",
                    }}>
                      {m.portfolioMovement.type}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>{m.portfolioMovement.source ?? "—"}</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                    {formatDate(m.portfolioMovement.executedAt)}
                  </div>
                  <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
                    {m.portfolioMovement.quantity.toLocaleString("en-US", { maximumFractionDigits: 6 })}
                    {" × $"}{m.portfolioMovement.priceUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </div>
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  <ConfidenceBadge confidence={m.confidence} />
                  {m.reason && (
                    <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "5px", maxWidth: "180px", lineHeight: 1.5 }}>
                      {m.reason}
                    </div>
                  )}
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  <div style={{ fontSize: "12px", fontWeight: 500, color: "#166534" }}>Conciliado</div>
                  {m.matchedAt && (
                    <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
                      {formatDate(m.matchedAt)}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "12px 16px", borderTop: "1px solid #F1F5F9", fontSize: "12px", color: "#94A3B8" }}>
        {matches.length} conciliación{matches.length !== 1 ? "es" : ""} confirmada{matches.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

// ── Ignored view ──────────────────────────────────────────────────────────────
function IgnoredView({ movements }: { movements: IgnoredMovement[] }) {
  if (movements.length === 0) {
    return <EmptyState message="No hay movimientos ignorados." />;
  }
  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
              {["Descripción", "Monto", "Fecha", "Estado"].map(col => (
                <th key={col} style={{
                  padding: "12px 16px", textAlign: "left",
                  fontWeight: 600, color: "#475569", fontSize: "12px", whiteSpace: "nowrap",
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {movements.map(m => (
              <tr key={m.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  {m.bankName && (
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      {m.bankName}
                    </div>
                  )}
                  <div style={{ fontSize: "13px", color: "#0F2A3D" }}>{truncate(m.description)}</div>
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#DC2626" }}>
                    -{formatClp(m.amountClp)}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", color: "#64748B" }}>
                  {formatDate(m.occurredAt)}
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center",
                    padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 500,
                    background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA",
                  }}>
                    Ignorado
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "12px 16px", borderTop: "1px solid #F1F5F9", fontSize: "12px", color: "#94A3B8" }}>
        {movements.length} movimiento{movements.length !== 1 ? "s" : ""} ignorado{movements.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReconciliationPage() {
  const [activeTab,    setActiveTab]    = useState<Tab>("suggestions");

  // Suggestions tab state
  const [suggestions,  setSuggestions]  = useState<Suggestion[]>([]);
  const [rowStates,    setRowStates]    = useState<Record<string, RowState>>({});
  const [sugLoading,   setSugLoading]   = useState(true);
  const [sugError,     setSugError]     = useState<string | null>(null);
  const [acting,       setActing]       = useState<string | null>(null);

  // Matched tab state
  const [matches,      setMatches]      = useState<MatchedEntry[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchFetched, setMatchFetched] = useState(false);

  // Ignored tab state
  const [ignoredList,  setIgnoredList]  = useState<IgnoredMovement[]>([]);
  const [ignLoading,   setIgnLoading]   = useState(false);
  const [ignFetched,   setIgnFetched]   = useState(false);

  // ── Fetch suggestions on mount ──────────────────────────────────────────────
  const fetchSuggestions = useCallback(async () => {
    setSugLoading(true);
    setSugError(null);
    try {
      const res  = await fetch("/api/bank/match/binance", { method: "POST" });
      const json = await res.json() as ApiResponse<{ suggestions: Suggestion[] }>;
      if (json.ok) {
        setSuggestions(json.data.suggestions ?? []);
        setRowStates({});
      } else {
        setSugError(json.message ?? "Error al cargar sugerencias.");
      }
    } catch {
      setSugError("No se pudo conectar con el servidor.");
    } finally {
      setSugLoading(false);
    }
  }, []);

  useEffect(() => { void fetchSuggestions(); }, [fetchSuggestions]);

  // ── Lazy-fetch on tab switch ────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "matched" && !matchFetched) {
      setMatchLoading(true);
      setMatchFetched(true);
      fetch("/api/bank/reconciliation/matched")
        .then(r => r.json() as Promise<ApiResponse<{ matches: MatchedEntry[] }>>)
        .then(json => { if (json.ok) setMatches(json.data.matches ?? []); })
        .catch(() => {})
        .finally(() => setMatchLoading(false));
    }
    if (activeTab === "ignored" && !ignFetched) {
      setIgnLoading(true);
      setIgnFetched(true);
      fetch("/api/bank/movements?status=IGNORED&limit=200")
        .then(r => r.json() as Promise<ApiResponse<{ movements: IgnoredMovement[] }>>)
        .then(json => { if (json.ok) setIgnoredList(json.data.movements ?? []); })
        .catch(() => {})
        .finally(() => setIgnLoading(false));
    }
  }, [activeTab, matchFetched, ignFetched]);

  // ── Row state helpers ───────────────────────────────────────────────────────
  function setRowState(bankMovementId: string, state: RowState) {
    setRowStates(prev => ({ ...prev, [bankMovementId]: state }));
  }

  async function handleAccept(s: Suggestion) {
    setActing(s.bankMovementId);
    try {
      const res  = await fetch("/api/bank/reconciliation/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankMovementId:      s.bankMovementId,
          portfolioMovementId: s.portfolioMovementId,
          confidence:          s.confidence,
          reason:              s.reason,
        }),
      });
      const json = await res.json() as ApiResponse<unknown>;
      if (json.ok) {
        setRowState(s.bankMovementId, "accepted");
        setMatchFetched(false); // invalidate matched cache
      }
    } finally {
      setActing(null);
    }
  }

  async function handleIgnore(bankMovementId: string) {
    setActing(bankMovementId);
    try {
      const res  = await fetch("/api/bank/reconciliation/reject", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankMovementId }),
      });
      const json = await res.json() as ApiResponse<unknown>;
      if (json.ok) {
        setRowState(bankMovementId, "ignored");
        setIgnFetched(false); // invalidate ignored cache
      }
    } finally {
      setActing(null);
    }
  }

  // ── Summary counts ──────────────────────────────────────────────────────────
  const counts = suggestions.reduce(
    (acc, s) => { acc[rowStates[s.bankMovementId] ?? "pending"]++; return acc; },
    { pending: 0, accepted: 0, review: 0, ignored: 0 } as Record<RowState, number>,
  );
  const pendingCount = counts.pending + counts.review;
  const visible      = suggestions.filter(s => (rowStates[s.bankMovementId] ?? "pending") !== "ignored");

  const tabCounts = {
    suggestions: pendingCount,
    matched:     matches.length,
    ignored:     ignoredList.length,
  };

  // ── Render ──────────────────────────────────────────────────────────────────
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
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px", marginBottom: "28px",
      }}>
        <SummaryCard label="Pendientes"      value={pendingCount}  accent="#0F2A3D" />
        <SummaryCard
          label="Alta confianza"
          value={suggestions.filter(s => s.confidence > 0.85).length}
          accent="#16A34A"
        />
        <SummaryCard label="Conciliados" value={counts.accepted + matches.length} accent="#16A34A" />
        <SummaryCard label="Ignorados"   value={counts.ignored  + ignoredList.length} accent="#DC2626" />
      </div>

      {/* Tabs */}
      <TabBar active={activeTab} onChange={setActiveTab} counts={tabCounts} />

      {/* ── Sugerencias tab ── */}
      {activeTab === "suggestions" && (
        sugLoading ? (
          <div style={{
            background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0",
            padding: "64px 24px", textAlign: "center", color: "#94A3B8", fontSize: "14px",
          }}>
            Analizando movimientos…
          </div>
        ) : sugError ? (
          <div style={{
            background: "#FEF2F2", borderRadius: "12px", border: "1px solid #FECACA",
            padding: "24px", color: "#991B1B", fontSize: "14px",
          }}>
            {sugError}
          </div>
        ) : suggestions.length === 0 ? (
          <EmptyState message="No hay egresos bancarios que coincidan con actividad Binance en ±3 días." />
        ) : (
          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                    {["Banco", "Crypto", "Confidence", "Estado", "Acción"].map((col, i) => (
                      <th key={col} style={{
                        padding: "12px 16px", textAlign: i === 4 ? "right" : "left",
                        fontWeight: 600, color: "#475569", fontSize: "12px", whiteSpace: "nowrap",
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
                          background: state === "accepted" ? "#F0FDF4" : state === "review" ? "#FFFBEB" : "transparent",
                          transition: "background 0.2s ease",
                        }}
                      >
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
                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "#0F2A3D" }}>{s.crypto.symbol}</span>
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
                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          <ConfidenceBadge confidence={s.confidence} />
                          <div style={{
                            fontSize: "11px", color: "#94A3B8", marginTop: "5px",
                            maxWidth: "180px", lineHeight: 1.5,
                          }}>
                            {s.reason}
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          <StateBadge state={state} />
                        </td>
                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                            {state !== "accepted" && (
                              <ActionBtn label="Aceptar" onClick={() => void handleAccept(s)} variant="accept" disabled={acting === s.bankMovementId} />
                            )}
                            {state !== "review" && state !== "accepted" && (
                              <ActionBtn label="Revisar" onClick={() => setRowState(s.bankMovementId, "review")} variant="review" disabled={acting === s.bankMovementId} />
                            )}
                            {state !== "ignored" && state !== "accepted" && (
                              <ActionBtn label="Ignorar" onClick={() => void handleIgnore(s.bankMovementId)} variant="ignore" disabled={acting === s.bankMovementId} />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{
              padding: "12px 16px", borderTop: "1px solid #F1F5F9",
              fontSize: "12px", color: "#94A3B8", display: "flex", gap: "16px",
            }}>
              <span>{suggestions.length} sugerencia{suggestions.length !== 1 ? "s" : ""} encontradas</span>
              {counts.accepted > 0 && <span style={{ color: "#16A34A" }}>· {counts.accepted} conciliadas</span>}
              {counts.review > 0   && <span style={{ color: "#D97706" }}>· {counts.review} en revisión</span>}
            </div>
          </div>
        )
      )}

      {/* ── Conciliados tab ── */}
      {activeTab === "matched" && (
        matchLoading
          ? <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "64px 24px", textAlign: "center", color: "#94A3B8", fontSize: "14px" }}>Cargando conciliaciones…</div>
          : <MatchedView matches={matches} />
      )}

      {/* ── Ignorados tab ── */}
      {activeTab === "ignored" && (
        ignLoading
          ? <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "64px 24px", textAlign: "center", color: "#94A3B8", fontSize: "14px" }}>Cargando movimientos ignorados…</div>
          : <IgnoredView movements={ignoredList} />
      )}
    </div>
  );
}
