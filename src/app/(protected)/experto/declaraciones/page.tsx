"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ui } from "@/styles/design-system";

type Tab = "declaraciones" | "auditoria";

/* ──────────────── Declaraciones types ──────────────── */
type Declaration = {
  id: string;
  taxYear: number;
  declarationType: string;
  status: string;
  source: string;
  contentHash: string;
  generatedAt: string;
  confirmedAt: string | null;
  voidedAt: string | null;
  createdAt: string;
};

type DeclarationsData = { declarations: Declaration[] };

function statusLabel(status: string) {
  switch (status) {
    case "DRAFT": return { text: "Borrador", bg: "#F1F5F9", color: "#475569" };
    case "REVIEWED": return { text: "Revisada", bg: "#E0F2FE", color: "#075985" };
    case "CONFIRMED": return { text: "Confirmada", bg: "#F0FDF4", color: "#166534" };
    case "VOIDED": return { text: "Anulada", bg: "#FEF2F2", color: "#991B1B" };
    case "EXPORTED": return { text: "Exportada", bg: "#FFFBEB", color: "#92400E" };
    default: return { text: status, bg: "#F1F5F9", color: "#475569" };
  }
}

function typeLabel(type: string) {
  switch (type) {
    case "DJ_CRYPTO_SUMMARY": return "Resumen cripto";
    case "DJ_REALIZED_GAINS": return "Ganancias realizadas";
    case "DJ_FOREIGN_EXCHANGE_ACTIVITY": return "Actividad cambiaria";
    case "DJ_TAX_SUPPORTING_LEDGER": return "Libro de apoyo";
    default: return type;
  }
}

function hashShort(hash: string) {
  return hash.slice(0, 8) + "…" + hash.slice(-8);
}

/* ──────────────── Auditoría types ──────────────── */
type AuditAction =
  | "DECLARATION_CREATED"
  | "DECLARATION_REVIEWED"
  | "DECLARATION_CONFIRMED"
  | "DECLARATION_VOIDED"
  | "DECLARATION_EXPORTED"
  | "DECLARATION_INTEGRITY_VERIFIED";

type AuditLog = {
  id: string;
  declarationId: string;
  action: AuditAction;
  actorId: string | null;
  actorEmail: string | null;
  taxYear: number;
  declarationType: string;
  statusFrom: string | null;
  statusTo: string | null;
  contentHash: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: string | null;
  previousHash: string | null;
  currentHash: string | null;
  createdAt: string;
};

type IntegrityStatus = "OK" | "RISK" | "CRITICAL" | "LEGACY_UNVERIFIABLE";

type IntegrityIssue = {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "LEGACY";
  description: string;
  data: Record<string, unknown>;
};

type IntegrityResult = {
  status: IntegrityStatus;
  timestamp: string;
  issues: IntegrityIssue[];
  summary: {
    total_audit_logs: number;
    chain_verified_logs: number;
    broken_chains: number;
    orphaned_records: number;
    legacy_unverifiable_records: number;
  };
};

type AuditResponse = { ok: boolean; message: string; data: { logs: AuditLog[] } };
type IntegrityResponse = { ok: boolean; message: string; data: IntegrityResult };

const ACTIONS: { value: AuditAction; label: string }[] = [
  { value: "DECLARATION_CREATED", label: "Creación" },
  { value: "DECLARATION_REVIEWED", label: "Revisión" },
  { value: "DECLARATION_CONFIRMED", label: "Confirmación" },
  { value: "DECLARATION_VOIDED", label: "Anulación" },
  { value: "DECLARATION_EXPORTED", label: "Exportación" },
  { value: "DECLARATION_INTEGRITY_VERIFIED", label: "Verificación" },
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-CL");
}

function parseMetadata(value: string | null) {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}

function actionLabel(action: AuditAction) {
  return ACTIONS.find((item) => item.value === action)?.label ?? action;
}

function actionBadge(action: AuditAction) {
  if (action === "DECLARATION_CONFIRMED" || action === "DECLARATION_EXPORTED") return ui.badgeOk;
  if (action === "DECLARATION_VOIDED") return ui.badgeRisk;
  if (action === "DECLARATION_REVIEWED" || action === "DECLARATION_INTEGRITY_VERIFIED") return ui.badgeWarning;
  return "border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]";
}

function integrityBadge(status: IntegrityStatus) {
  if (status === "OK") return ui.badgeOk;
  if (status === "LEGACY_UNVERIFIABLE") return ui.badgeWarning;
  return ui.badgeRisk;
}

function integrityLabel(status: IntegrityStatus) {
  switch (status) {
    case "OK": return "Integridad OK";
    case "LEGACY_UNVERIFIABLE": return "Legacy no verificable";
    case "RISK": return "Riesgo";
    case "CRITICAL": return "Crítico";
  }
}

function issueLabel(issue: IntegrityIssue) {
  if (issue.type === "LEGACY_UNVERIFIABLE") return "DDJJ legacy sin cadena criptográfica";
  if (issue.type === "BROKEN_DECLARATION_CHAIN") return "Cadena DDJJ rota";
  if (issue.type === "ORPHANED_DECLARATION") return "DDJJ sin auditoría";
  return issue.type;
}

function declarationTypeLabel(type: string) {
  switch (type) {
    case "DJ_CRYPTO_SUMMARY": return "Resumen cripto";
    case "DJ_REALIZED_GAINS": return "Ganancias realizadas";
    case "DJ_FOREIGN_EXCHANGE_ACTIVITY": return "Actividad exchanges";
    case "DJ_TAX_SUPPORTING_LEDGER": return "Libro auxiliar";
    default: return type;
  }
}

/* ──────────────── Page ──────────────── */
export default function ExpertoDeclaracionesPage() {
  const [tab, setTab] = useState<Tab>("declaraciones");

  /* Declaraciones state */
  const [decData, setDecData] = useState<DeclarationsData | null>(null);
  const [decLoading, setDecLoading] = useState(true);
  const [decError, setDecError] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  /* Auditoría state */
  const currentYear = new Date().getFullYear();
  const [auditYear, setAuditYear] = useState(String(currentYear));
  const [auditAction, setAuditAction] = useState("");
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [integrity, setIntegrity] = useState<IntegrityResult | null>(null);

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [logs]);

  /* Load declaraciones */
  useEffect(() => {
    async function load() {
      try {
        setDecLoading(true);
        const params = new URLSearchParams();
        if (selectedYear) params.set("year", selectedYear);
        const res = await fetch(`/api/tax/declarations?${params.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "No se pudieron cargar las declaraciones.");
        setDecData(json.data);
      } catch (err) {
        setDecError(err instanceof Error ? err.message : "Error cargando declaraciones.");
      } finally {
        setDecLoading(false);
      }
    }
    void load();
  }, [selectedYear]);

  /* Load auditoría */
  async function loadAuditLogs() {
    try {
      setAuditLoading(true);
      setAuditError(null);
      const token = localStorage.getItem("token");
      const searchParams = new URLSearchParams();
      if (auditYear) searchParams.set("year", auditYear);
      if (auditAction) searchParams.set("action", auditAction);

      const [response, integrityResponse] = await Promise.all([
        fetch(`/api/tax/declarations/audit?${searchParams.toString()}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token ?? ""}` },
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/tax/audit/integrity", {
          method: "GET",
          headers: { Authorization: `Bearer ${token ?? ""}` },
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const json = (await response.json()) as AuditResponse;
      const integrityJson = (await integrityResponse.json()) as IntegrityResponse;

      if (!response.ok || !json.ok) throw new Error(json.message || "No fue posible cargar auditoría.");
      if (!integrityResponse.ok || !integrityJson.ok) throw new Error(integrityJson.message || "No fue posible cargar integridad.");

      setLogs(json.data.logs ?? []);
      setIntegrity(integrityJson.data);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : "No fue posible cargar auditoría.");
    } finally {
      setAuditLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadAuditLogs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableYears = decData
    ? Array.from(new Set(decData.declarations.map((d) => d.taxYear))).sort((a, b) => b - a)
    : [];

  const counts = decData
    ? {
        total: decData.declarations.length,
        draft: decData.declarations.filter((d) => d.status === "DRAFT").length,
        reviewed: decData.declarations.filter((d) => d.status === "REVIEWED").length,
        confirmed: decData.declarations.filter((d) => d.status === "CONFIRMED").length,
        voided: decData.declarations.filter((d) => d.status === "VOIDED").length,
        exported: decData.declarations.filter((d) => d.status === "EXPORTED").length,
      }
    : null;

  const tabBtn = (key: Tab, label: string) => {
    const active = tab === key;
    return (
      <button
        key={key}
        onClick={() => setTab(key)}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: "none",
          background: active ? "rgba(22,163,74,0.18)" : "transparent",
          color: active ? "#4ADE80" : "#94A3B8",
          fontSize: 13,
          fontWeight: active ? 700 : 500,
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Modo Experto</p>
          <h1 style={{ color: "#F8FAFC", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Declaraciones</h1>
          <p style={{ color: "#94A3B8", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Historial de declaraciones juradas y cadena de custodia operacional.
          </p>
        </div>
        <Link href="/experto" style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#F8FAFC", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver a Experto
        </Link>
      </section>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
        {tabBtn("declaraciones", "Declaraciones")}
        {tabBtn("auditoria", "Auditoría DDJJ")}
      </div>

      {tab === "declaraciones" && (
        <>
          {decLoading ? (
            <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando declaraciones…</p>
          ) : decError ? (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{decError}</div>
          ) : decData ? (
            <>
              {counts && (
                <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", marginBottom: 20 }}>
                  <article style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 14 }}>
                    <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 6px", textTransform: "uppercase" }}>Total</p>
                    <p style={{ color: "#F8FAFC", fontSize: "1.4rem", fontWeight: 850, margin: 0 }}>{counts.total}</p>
                  </article>
                  <article style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 14 }}>
                    <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 6px", textTransform: "uppercase" }}>Borradores</p>
                    <p style={{ color: "#F8FAFC", fontSize: "1.4rem", fontWeight: 850, margin: 0 }}>{counts.draft}</p>
                  </article>
                  <article style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 14 }}>
                    <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 6px", textTransform: "uppercase" }}>Revisadas</p>
                    <p style={{ color: "#F8FAFC", fontSize: "1.4rem", fontWeight: 850, margin: 0 }}>{counts.reviewed}</p>
                  </article>
                  <article style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 14 }}>
                    <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 6px", textTransform: "uppercase" }}>Confirmadas</p>
                    <p style={{ color: "#4ADE80", fontSize: "1.4rem", fontWeight: 850, margin: 0 }}>{counts.confirmed}</p>
                  </article>
                  <article style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 14 }}>
                    <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 6px", textTransform: "uppercase" }}>Exportadas</p>
                    <p style={{ color: "#FBBF24", fontSize: "1.4rem", fontWeight: 850, margin: 0 }}>{counts.exported}</p>
                  </article>
                  <article style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 14 }}>
                    <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 6px", textTransform: "uppercase" }}>Anuladas</p>
                    <p style={{ color: "#F87171", fontSize: "1.4rem", fontWeight: 850, margin: 0 }}>{counts.voided}</p>
                  </article>
                </section>
              )}

              {availableYears.length > 0 && (
                <section style={{ marginBottom: 16 }}>
                  <label style={{ alignItems: "center", color: "#94A3B8", display: "inline-flex", fontSize: 13, fontWeight: 750, gap: 8 }}>
                    Año
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      style={{ background: "#0B1D2C", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#F8FAFC", fontSize: 13, fontWeight: 750, minHeight: 38, padding: "0 10px" }}
                    >
                      <option value="">Todos</option>
                      {availableYears.map((y) => (<option key={y} value={String(y)}>{y}</option>))}
                    </select>
                  </label>
                </section>
              )}

              {decData.declarations.length === 0 ? (
                <section style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 8, padding: 28, textAlign: "center" }}>
                  <h2 style={{ color: "#F8FAFC", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Sin declaraciones registradas</h2>
                  <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.55, margin: "0 auto", maxWidth: 520 }}>Las declaraciones se generan automáticamente desde el panel de administración o al exportar reportes.</p>
                </section>
              ) : (
                <section style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ borderCollapse: "collapse", minWidth: 900, width: "100%" }}>
                      <thead>
                        <tr style={{ background: "#0F2A3D", color: "#F8FAFC", textAlign: "left" }}>
                          <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Año</th>
                          <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Tipo</th>
                          <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Estado</th>
                          <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Hash</th>
                          <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Generada</th>
                          <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Confirmada</th>
                          <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Anulada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {decData.declarations.map((d) => {
                          const st = statusLabel(d.status);
                          return (
                            <tr key={d.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                              <td style={{ color: "#F8FAFC", fontSize: 14, fontWeight: 750, padding: "14px" }}>{d.taxYear}</td>
                              <td style={{ color: "#CBD5E1", fontSize: 13, padding: "14px" }}>{typeLabel(d.declarationType)}</td>
                              <td style={{ padding: "14px" }}>
                                <span style={{ background: st.bg, borderRadius: 999, color: st.color, fontSize: 12, fontWeight: 800, padding: "2px 10px" }}>{st.text}</span>
                              </td>
                              <td style={{ color: "#94A3B8", fontSize: 12, fontFamily: "monospace", padding: "14px" }}>{hashShort(d.contentHash)}</td>
                              <td style={{ color: "#CBD5E1", fontSize: 13, padding: "14px" }}>{new Date(d.generatedAt).toLocaleDateString("es-CL")}</td>
                              <td style={{ color: "#CBD5E1", fontSize: 13, padding: "14px" }}>{d.confirmedAt ? new Date(d.confirmedAt).toLocaleDateString("es-CL") : "—"}</td>
                              <td style={{ color: "#CBD5E1", fontSize: 13, padding: "14px" }}>{d.voidedAt ? new Date(d.voidedAt).toLocaleDateString("es-CL") : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          ) : null}
        </>
      )}

      {tab === "auditoria" && (
        <section className={ui.page} style={{ padding: 0 }}>
          <div className={`${ui.card} p-4 space-y-4`}>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1">
                <span className={ui.label}>Año tributario</span>
                <input value={auditYear} onChange={(e) => setAuditYear(e.target.value)} className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm" />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className={ui.label}>Acción</span>
                <select value={auditAction} onChange={(e) => setAuditAction(e.target.value)} className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm">
                  <option value="">Todas</option>
                  {ACTIONS.map((item) => (<option key={item.value} value={item.value}>{item.label}</option>))}
                </select>
              </label>
            </div>
            <button type="button" onClick={loadAuditLogs} disabled={auditLoading} className={ui.buttonPrimary}>
              {auditLoading ? "Cargando…" : "Actualizar auditoría"}
            </button>
          </div>

          {integrity ? (
            <div className={`${ui.card} p-5 space-y-4`}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Integridad DDJJ</h2>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${integrityBadge(integrity.status)}`}>{integrityLabel(integrity.status)}</span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {integrity.status === "LEGACY_UNVERIFIABLE"
                      ? "Hay evidencia histórica anterior al protocolo de cadena; se conserva sin marcarla como corrupción."
                      : "Estado calculado desde hash DDJJ, cadena de auditoría y registros relacionados."}
                  </p>
                </div>
                <div className={`${ui.cardSoft} px-3 py-2 md:w-64`}>
                  <p className="text-xs font-medium text-[var(--color-text-muted)]">Última verificación</p>
                  <p className="mt-1 text-sm text-[var(--color-text-primary)]">{formatDate(integrity.timestamp)}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <div className={`${ui.cardSoft} p-3`}>
                  <p className="text-xs font-medium text-[var(--color-text-muted)]">Eventos auditoría</p>
                  <p className="mt-1 text-sm text-[var(--color-text-primary)]">{integrity.summary.total_audit_logs}</p>
                </div>
                <div className={`${ui.cardSoft} p-3`}>
                  <p className="text-xs font-medium text-[var(--color-text-muted)]">Cadenas rotas</p>
                  <p className="mt-1 text-sm text-[var(--color-text-primary)]">{integrity.summary.broken_chains}</p>
                </div>
                <div className={`${ui.cardSoft} p-3`}>
                  <p className="text-xs font-medium text-[var(--color-text-muted)]">Huérfanos</p>
                  <p className="mt-1 text-sm text-[var(--color-text-primary)]">{integrity.summary.orphaned_records}</p>
                </div>
                <div className={`${ui.cardSoft} p-3`}>
                  <p className="text-xs font-medium text-[var(--color-text-muted)]">Legacy no verificable</p>
                  <p className="mt-1 text-sm text-[var(--color-text-primary)]">{integrity.summary.legacy_unverifiable_records}</p>
                </div>
              </div>
              {integrity.issues.length > 0 ? (
                <div className="space-y-2">
                  {integrity.issues.slice(0, 5).map((issue, index) => (
                    <div key={`${issue.type}-${index}`} className={`${ui.cardSoft} flex flex-col gap-1 p-3 text-sm md:flex-row md:items-center md:justify-between`}>
                      <span className="font-medium text-[var(--color-text-primary)]">{issueLabel(issue)}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">{issue.severity}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {auditError ? (<div className={`${ui.alertRisk} rounded-md p-3 text-sm`}>{auditError}</div>) : null}

          <div className="space-y-4">
            {auditLoading ? (<div className={`${ui.card} p-5 text-sm text-[var(--color-text-secondary)]`}>Cargando auditoría DDJJ…</div>) : null}
            {!auditLoading && sortedLogs.length === 0 ? (<div className={`${ui.card} p-5 text-sm text-[var(--color-text-secondary)]`}>No existen registros de auditoría para los filtros seleccionados.</div>) : null}
            {!auditLoading && sortedLogs.map((log) => {
              const metadata = parseMetadata(log.metadata);
              return (
                <article key={log.id} className={`${ui.card} p-5`}>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{declarationTypeLabel(log.declarationType)}</h2>
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${actionBadge(log.action)}`}>{actionLabel(log.action)}</span>
                          {!log.currentHash ? (<span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${ui.badgeWarning}`}>Legacy</span>) : null}
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)]">Declaración: {log.declarationId}</p>
                      </div>
                      <div className={`${ui.cardSoft} px-3 py-2 lg:w-60`}>
                        <p className="text-xs font-medium text-[var(--color-text-muted)]">Fecha</p>
                        <p className="mt-1 text-sm text-[var(--color-text-primary)]">{formatDate(log.createdAt)}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
                      <div className={`${ui.cardSoft} p-3`}><p className="text-xs font-medium text-[var(--color-text-muted)]">Usuario</p><p className="mt-1 text-sm break-all text-[var(--color-text-secondary)]">{log.actorEmail ?? "—"}</p></div>
                      <div className={`${ui.cardSoft} p-3`}><p className="text-xs font-medium text-[var(--color-text-muted)]">IP</p><p className="mt-1 text-sm break-all text-[var(--color-text-secondary)]">{log.ipAddress ?? "—"}</p></div>
                      <div className={`${ui.cardSoft} p-3`}><p className="text-xs font-medium text-[var(--color-text-muted)]">Estado previo</p><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{log.statusFrom ?? "—"}</p></div>
                      <div className={`${ui.cardSoft} p-3`}><p className="text-xs font-medium text-[var(--color-text-muted)]">Estado nuevo</p><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{log.statusTo ?? "—"}</p></div>
                    </div>
                    <div className={`${ui.cardSoft} p-3 space-y-2`}>
                      <div><p className="text-xs font-medium text-[var(--color-text-muted)]">Hash</p><p className="mt-1 font-mono text-xs break-all text-[var(--color-text-secondary)]">{log.contentHash ?? "—"}</p></div>
                      <div><p className="text-xs font-medium text-[var(--color-text-muted)]">User-Agent</p><p className="mt-1 text-xs break-all text-[var(--color-text-secondary)]">{log.userAgent ?? "—"}</p></div>
                    </div>
                    {metadata ? (
                      <div className={`${ui.cardSoft} p-3`}>
                        <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">Metadata operacional</p>
                        <pre className="overflow-x-auto rounded-md bg-black/5 p-3 text-xs text-[var(--color-text-secondary)]">{JSON.stringify(metadata, null, 2)}</pre>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
