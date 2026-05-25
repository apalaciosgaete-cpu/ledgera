"use client";

import { useState, useEffect, useCallback } from "react";
import { getSessionToken } from "@/modules/identity/client/authStorage";
import { BankTabs } from "@/components/bank/BankTabs";

// ── Types ─────────────────────────────────────────────────────────────────────
type Suggestion = {
  bankMovementId:      string;
  portfolioMovementId: string;
  confidence:          number;
  reason:              string;
  eventType:           string;
  eventLabel:          string;
  certainty:           "HIGH" | "MEDIUM" | "LOW";
  evidence:            string[];
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

type MatchedRecord = {
  bankMovement: {
    id:          string;
    bankName:    string | null;
    occurredAt:  string;
    description: string;
    amountClp:   number;
    direction:   string;
    status:      string;
  };
  portfolioMovement: {
    id:         string;
    type:       string;
    symbol:     string;
    quantity:   number;
    priceUsd:   number;
    executedAt: string;
    source:     string | null;
  } | null;
  confidence: number | null;
  matchedAt:  string | null;
  reason:     string | null;
};

type BankMovement = {
  id:          string;
  bankName:    string | null;
  occurredAt:  string;
  description: string;
  amountClp:   number;
  direction:   string;
  status:      string;
  updatedAt:   string;
};

type AuditLog = {
  id:         string;
  action:     string;
  confidence: number | null;
  reason:     string | null;
  metadata:   string | null;
  createdAt:  string;
  bankMovement: {
    id:          string;
    bankName:    string | null;
    occurredAt:  string;
    description: string;
    amountClp:   number;
    direction:   string;
    status:      string;
  } | null;
  portfolioMovement: {
    id:         string;
    type:       string;
    symbol:     string;
    quantity:   number;
    priceUsd:   number;
    executedAt: string;
    source:     string | null;
  } | null;
};

type ReconciliationStats = {
  totalBankMovements: number;
  pending:            number;
  matched:            number;
  ignored:            number;
  review:             number;
  suggestions:        number;
};

type RowState = "pending" | "accepted" | "review" | "ignored";
type Tab      = "suggestions" | "matched" | "ignored" | "audit";

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

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 2,
  }).format(n);
}

function movementTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    BUY: "Compra", SELL: "Venta", DEPOSIT: "Depósito",
    WITHDRAWAL: "Retiro", TRANSFER: "Transferencia",
  };
  return labels[type] ?? type;
}

function downloadExport(type: "matched" | "pending" | "ignored" | "audit") {
  window.location.href = `/api/bank/reconciliation/export?type=${type}`;
}

function readCsrfCookie(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.split("; ").find(c => c.startsWith("ledgera_csrf="));
  return m ? decodeURIComponent(m.split("=")[1] ?? "") : "";
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

// ── Certainty badge ───────────────────────────────────────────────────────────
function CertaintyBadge({ certainty }: { certainty: "HIGH" | "MEDIUM" | "LOW" }) {
  const map = {
    HIGH:   { label: "Alta",  bg: "#DCFCE7", color: "#166534", border: "#BBF7D0" },
    MEDIUM: { label: "Media", bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
    LOW:    { label: "Baja",  bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" },
  };

  const s = map[certainty];

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: 700,
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
    }}>
      Certeza {s.label}
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

// ── Matched view ──────────────────────────────────────────────────────────────
function MatchedView({
  matches, onUnmatch, actionLoadingId,
}: {
  matches:         MatchedRecord[];
  onUnmatch:       (record: MatchedRecord) => void;
  actionLoadingId: string | null;
}) {
  if (matches.length === 0) {
    return (
      <div style={{
        background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0",
        padding: "64px 24px", textAlign: "center", color: "#94A3B8", fontSize: "13px",
      }}>
        No hay conciliaciones confirmadas aún.
      </div>
    );
  }
  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
              {["Banco", "Crypto", "Confidence", "Conciliado", "Acción"].map((col, i) => (
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
                  {m.portfolioMovement ? (
                    <>
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
                    </>
                  ) : (
                    <span style={{ fontSize: "12px", color: "#94A3B8" }}>Movimiento eliminado</span>
                  )}
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
                <td style={{ padding: "14px 16px", verticalAlign: "top", textAlign: "right" }}>
                  <button
                    type="button"
                    disabled={actionLoadingId === m.bankMovement.id}
                    onClick={() => onUnmatch(m)}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 disabled:opacity-40"
                  >
                    {actionLoadingId === m.bankMovement.id ? "..." : "Deshacer"}
                  </button>
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReconciliationPage() {
  const [activeTab,  setActiveTab]  = useState<Tab>("suggestions");

  // Suggestions tab
  const [suggestions,    setSuggestions]    = useState<Suggestion[]>([]);
  const [rowStates,      setRowStates]      = useState<Record<string, RowState>>({});
  const [sugLoading,     setSugLoading]     = useState(true);
  const [sugError,       setSugError]       = useState<string | null>(null);
  const [acting,         setActing]         = useState<string | null>(null);

  // Suggestion filters
  const [minConfidence, setMinConfidence] = useState(0.6);
  const [sourceFilter,  setSourceFilter]  = useState<"ALL" | "BINANCE" | "BINANCE_TAX">("ALL");
  const [typeFilter,    setTypeFilter]    = useState<"ALL" | "BUY" | "DEPOSIT">("ALL");

  // Matched tab
  const [matched,          setMatched]          = useState<MatchedRecord[]>([]);
  const [matchLoading,     setMatchLoading]     = useState(false);
  const [actionLoadingId,  setActionLoadingId]  = useState<string | null>(null);
  const [error,            setError]            = useState<string | null>(null);

  // Ignored tab
  const [ignored,      setIgnored]      = useState<BankMovement[]>([]);
  const [ignLoading,   setIgnLoading]   = useState(false);

  // Audit tab
  const [auditLogs,    setAuditLogs]    = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState<ReconciliationStats | null>(null);

  // ── Loaders ─────────────────────────────────────────────────────────────────
  const loadSuggestions = useCallback(async () => {
    setSugLoading(true);
    setSugError(null);

    const token = getSessionToken();

    try {
      const res = await fetch("/api/bank/match/binance", {
        method:      "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          minConfidence,
          source: sourceFilter,
          type:   typeFilter,
        }),
      });

      const text = await res.text();

      let json: ApiResponse<{ suggestions: Suggestion[] }>;

      try {
        json = JSON.parse(text) as ApiResponse<{ suggestions: Suggestion[] }>;
      } catch {
        setSugError(`Respuesta inválida del servidor: ${text.slice(0, 300)}`);
        return;
      }

      if (!res.ok || !json.ok) {
        setSugError(json.message ?? `Error HTTP ${res.status}`);
        return;
      }

      setSuggestions(json.data.suggestions ?? []);
      setRowStates({});
      await loadStats();
    } catch (error) {
      setSugError(
        error instanceof Error
          ? error.message
          : "No se pudo conectar con el servidor.",
      );
    } finally {
      setSugLoading(false);
    }
  }, [minConfidence, sourceFilter, typeFilter]);

  async function loadMatched() {
    setMatchLoading(true);
    const token = getSessionToken();
    const response = await fetch("/api/bank/reconciliation/matched", {
      credentials: "include",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const payload = await response.json() as ApiResponse<{ matches: MatchedRecord[]; total: number }>;
    if (response.ok && payload.ok) {
      setMatched(payload.data.matches);
      void loadStats();
    }
    setMatchLoading(false);
  }

  async function unmatchRecord(record: MatchedRecord) {
    setActionLoadingId(record.bankMovement.id);
    setError(null);

    try {
      await fetch("/api/csrf", { credentials: "include", cache: "no-store" });

      const token = getSessionToken();

      const response = await fetch("/api/bank/reconciliation/unmatch", {
        method:      "POST",
        credentials: "include",
        headers: {
          "Content-Type":    "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "x-ledgera-csrf": readCsrfCookie(),
        },
        body: JSON.stringify({ bankMovementId: record.bankMovement.id }),
      });

      let payload: ApiResponse<unknown>;
      try {
        payload = (await response.json()) as ApiResponse<unknown>;
      } catch {
        setError("Respuesta inválida del servidor al deshacer.");
        return;
      }

      if (!response.ok || !payload.ok) {
        setError(payload.message || "No fue posible deshacer la conciliación.");
        return;
      }

      setMatched(current =>
        current.filter(item => item.bankMovement.id !== record.bankMovement.id),
      );
      await loadStats();
      await loadSuggestions();
    } catch {
      setError("Error de red al deshacer conciliación.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function loadIgnored() {
    setIgnLoading(true);
    const token = getSessionToken();
    const response = await fetch("/api/bank/reconciliation/ignored", {
      credentials: "include",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const payload = await response.json() as ApiResponse<{ ignored: BankMovement[]; total: number }>;
    if (response.ok && payload.ok) {
      setIgnored(payload.data.ignored);
      void loadStats();
    }
    setIgnLoading(false);
  }

  async function loadStats() {
    const token = getSessionToken();
    const response = await fetch("/api/bank/reconciliation/stats", {
      credentials: "include",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const payload = await response.json() as ApiResponse<ReconciliationStats>;
    if (response.ok && payload.ok) {
      setStats(payload.data);
    }
  }

  async function loadAuditLogs() {
    setAuditLoading(true);
    const token = getSessionToken();
    const response = await fetch("/api/bank/reconciliation/audit", {
      credentials: "include",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const payload = await response.json() as ApiResponse<{ logs: AuditLog[]; total: number }>;
    if (response.ok && payload.ok) {
      setAuditLogs(payload.data.logs);
    }
    setAuditLoading(false);
  }

  useEffect(() => {
    void loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "suggestions") void loadSuggestions();
    if (activeTab === "matched")     void loadMatched();
    if (activeTab === "ignored")     void loadIgnored();
    if (activeTab === "audit")       void loadAuditLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, loadSuggestions]);

  // ── Row actions ──────────────────────────────────────────────────────────────
  function setRowState(bankMovementId: string, state: RowState) {
    setRowStates(prev => ({ ...prev, [bankMovementId]: state }));
  }

  async function handleAccept(s: Suggestion) {
    setActing(s.bankMovementId);

    try {
      await fetch("/api/csrf", { credentials: "include", cache: "no-store" });

      const token = getSessionToken();

      const res = await fetch("/api/bank/reconciliation/confirm", {
        method:      "POST",
        credentials: "include",
        headers: {
          "Content-Type":    "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "x-ledgera-csrf": readCsrfCookie(),
        },
        body: JSON.stringify({
          bankMovementId:      s.bankMovementId,
          portfolioMovementId: s.portfolioMovementId,
          confidence:          s.confidence,
          reason:              s.reason,
        }),
      });

      let json: ApiResponse<unknown>;
      try {
        json = await res.json() as ApiResponse<unknown>;
      } catch {
        setSugError("Respuesta inválida del servidor al aceptar.");
        return;
      }

      if (!res.ok || !json.ok) {
        setSugError(json.message ?? "No se pudo aceptar la conciliación.");
        return;
      }

      setSuggestions(current =>
        current.filter(item => item.bankMovementId !== s.bankMovementId),
      );

      setRowState(s.bankMovementId, "accepted");

      await loadStats();

      if (activeTab === "matched") {
        await loadMatched();
      }
    } catch {
      setSugError("Error de red al aceptar la conciliación.");
    } finally {
      setActing(null);
    }
  }

  async function handleIgnore(bankMovementId: string) {
    setActing(bankMovementId);

    try {
      await fetch("/api/csrf", { credentials: "include", cache: "no-store" });

      const token = getSessionToken();

      const res = await fetch("/api/bank/reconciliation/reject", {
        method:      "POST",
        credentials: "include",
        headers: {
          "Content-Type":    "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "x-ledgera-csrf": readCsrfCookie(),
        },
        body: JSON.stringify({ bankMovementId }),
      });

      let json: ApiResponse<unknown>;
      try {
        json = await res.json() as ApiResponse<unknown>;
      } catch {
        setSugError("Respuesta inválida del servidor al ignorar.");
        return;
      }

      if (json.ok) {
        setSuggestions(current =>
          current.filter(item => item.bankMovementId !== bankMovementId),
        );

        setRowState(bankMovementId, "ignored");

        await loadStats();

        if (activeTab === "ignored") {
          await loadIgnored();
        }

        return;
      }

      setSugError(json.message ?? "No se pudo ignorar la sugerencia.");
    } catch {
      setSugError("Error de red al ignorar la sugerencia.");
    } finally {
      setActing(null);
    }
  }

  // ── Summary counts ───────────────────────────────────────────────────────────
  const counts = suggestions.reduce(
    (acc, s) => { acc[rowStates[s.bankMovementId] ?? "pending"]++; return acc; },
    { pending: 0, accepted: 0, review: 0, ignored: 0 } as Record<RowState, number>,
  );
  const pendingCount = counts.pending + counts.review;
  const visible      = suggestions.filter(s => (rowStates[s.bankMovementId] ?? "pending") !== "ignored");

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div>
      <BankTabs />

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
      <div className="grid gap-4 md:grid-cols-5" style={{ marginBottom: "28px" }}>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Banco total</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {stats?.totalBankMovements ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs text-amber-600">Pendientes</p>
          <p className="mt-1 text-2xl font-semibold text-amber-800">
            {stats?.pending ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <p className="text-xs text-green-600">Conciliados</p>
          <p className="mt-1 text-2xl font-semibold text-green-800">
            {stats?.matched ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Ignorados</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {stats?.ignored ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs text-blue-600">Sugerencias</p>
          <p className="mt-1 text-2xl font-semibold text-blue-800">
            {stats?.suggestions ?? 0}
          </p>
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4" style={{ marginBottom: "20px" }}>
        <button
          type="button"
          onClick={() => downloadExport("matched")}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Exportar conciliados
        </button>
        <button
          type="button"
          onClick={() => downloadExport("pending")}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Exportar pendientes
        </button>
        <button
          type="button"
          onClick={() => downloadExport("ignored")}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Exportar ignorados
        </button>
        <button
          type="button"
          onClick={() => downloadExport("audit")}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Exportar auditoría
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-2" style={{ marginBottom: "20px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("suggestions")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            activeTab === "suggestions"
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          Sugerencias
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("matched")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            activeTab === "matched"
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          Conciliados
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ignored")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            activeTab === "ignored"
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          Ignorados
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            activeTab === "audit"
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          Auditoría
        </button>
      </div>

      {/* ── Sugerencias ── */}
      {activeTab === "suggestions" && (
        <>
        {/* Filter bar */}
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4" style={{ marginBottom: "16px" }}>
          <select
            value={String(minConfidence)}
            onChange={(event) => setMinConfidence(Number(event.target.value))}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="0.4">Certeza flexible</option>
            <option value="0.6">Certeza operativa</option>
            <option value="0.85">Certeza alta</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(event) =>
              setSourceFilter(event.target.value as "ALL" | "BINANCE" | "BINANCE_TAX")
            }
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">Todos los orígenes</option>
            <option value="BINANCE">Binance Spot</option>
            <option value="BINANCE_TAX">Binance Tax</option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as "ALL" | "BUY" | "DEPOSIT")
            }
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">Todos los tipos</option>
            <option value="BUY">Compras</option>
            <option value="DEPOSIT">Depósitos</option>
          </select>

          <button
            type="button"
            onClick={() => void loadSuggestions()}
            disabled={sugLoading}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Aplicar filtros
          </button>
        </div>

        {sugLoading ? (
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
          <div style={{
            background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0",
            padding: "64px 24px", textAlign: "center",
          }}>
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
                    {["Banco", "Crypto", "Evento", "Estado", "Acción"].map((col, i) => (
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
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "240px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F2A3D" }}>
                              {s.eventLabel}
                            </div>
                            <CertaintyBadge certainty={s.certainty} />
                            {s.evidence.length > 0 && (
                              <div style={{ fontSize: "11px", color: "#94A3B8", lineHeight: 1.5 }}>
                                {s.evidence.slice(0, 3).join(" · ")}
                              </div>
                            )}
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
        }</>
      )}

      {/* ── Conciliados ── */}
      {activeTab === "matched" && (
        matchLoading
          ? <div style={{
              background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0",
              padding: "64px 24px", textAlign: "center", color: "#94A3B8", fontSize: "14px",
            }}>
              Cargando conciliaciones…
            </div>
          : <>
              {error && (
                <div style={{
                  background: "#FEF2F2", borderRadius: "10px", border: "1px solid #FECACA",
                  padding: "12px 16px", marginBottom: "12px", fontSize: "13px", color: "#991B1B",
                }}>
                  {error}
                </div>
              )}
              <MatchedView matches={matched} onUnmatch={unmatchRecord} actionLoadingId={actionLoadingId} />
            </>
      )}

      {/* ── Auditoría ── */}
      {activeTab === "audit" && (
        auditLoading ? (
          <div style={{
            background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0",
            padding: "64px 24px", textAlign: "center", color: "#94A3B8", fontSize: "14px",
          }}>
            Cargando auditoría…
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="w-full overflow-x-auto">
            <table className="w-full min-w-225 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Acción</th>
                  <th className="px-4 py-3 text-left">Banco</th>
                  <th className="px-4 py-3 text-left">Crypto</th>
                  <th className="px-4 py-3 text-left">Confianza</th>
                  <th className="px-4 py-3 text-left">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No hay eventos de auditoría.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id}>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(log.createdAt).toLocaleString("es-CL")}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {log.action}
                      </td>
                      <td className="px-4 py-3">
                        {log.bankMovement ? (
                          <div>
                            <p className="font-semibold text-slate-900">
                              {log.bankMovement.direction === "OUTFLOW" ? "-" : "+"}
                              {formatClp(log.bankMovement.amountClp)}
                            </p>
                            <p className="text-xs text-slate-400">
                              {log.bankMovement.bankName ?? "Banco"} ·{" "}
                              {formatDate(log.bankMovement.occurredAt)}
                            </p>
                            <p className="mt-1 max-w-xs text-xs text-slate-500">
                              {log.bankMovement.description}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {log.portfolioMovement ? (
                          <div>
                            <p className="font-semibold text-slate-900">
                              {movementTypeLabel(log.portfolioMovement.type)}{" "}
                              {log.portfolioMovement.symbol}
                            </p>
                            <p className="text-xs text-slate-400">
                              {formatDate(log.portfolioMovement.executedAt)} ·{" "}
                              {log.portfolioMovement.source ?? "Sin origen"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {log.portfolioMovement.quantity} {log.portfolioMovement.symbol} ·{" "}
                              {formatUsd(log.portfolioMovement.priceUsd)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {log.confidence !== null ? `${Math.round(log.confidence * 100)}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {log.reason ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        )
      )}

      {/* ── Ignorados ── */}
      {activeTab === "ignored" && (
        ignLoading ? (
          <div style={{
            background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0",
            padding: "64px 24px", textAlign: "center", color: "#94A3B8", fontSize: "14px",
          }}>
            Cargando movimientos ignorados…
          </div>
        ) : ignored.length === 0 ? (
          <div style={{
            background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0",
            padding: "64px 24px", textAlign: "center", color: "#94A3B8", fontSize: "13px",
          }}>
            No hay movimientos ignorados.
          </div>
        ) : (
          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                    {["Banco", "Descripción", "Monto", "Fecha", "Estado"].map(col => (
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
                  {ignored.map(m => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                        <span style={{ fontSize: "12px", color: "#64748B" }}>{m.bankName ?? "—"}</span>
                      </td>
                      <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                        <span style={{ fontSize: "13px", color: "#0F2A3D" }}>{truncate(m.description)}</span>
                      </td>
                      <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#DC2626" }}>
                          -{formatClp(m.amountClp)}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", verticalAlign: "top", color: "#64748B", fontSize: "12px" }}>
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
              {ignored.length} movimiento{ignored.length !== 1 ? "s" : ""} ignorado{ignored.length !== 1 ? "s" : ""}
            </div>
          </div>
        )
      )}
    </div>
  );
}
