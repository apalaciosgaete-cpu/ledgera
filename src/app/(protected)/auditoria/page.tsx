"use client";

import React, { useEffect, useState } from "react";

type PeriodStatus = "OPEN" | "CLOSED" | "REOPENED";
type Section = "estado" | "log" | "registros";

interface PeriodData {
  year: number;
  status: PeriodStatus;
  isClosed: boolean;
  closedAt: string | null;
  reopenedAt: string | null;
  closedReason: string | null;
}

interface AuditLog {
  id: string;
  year: number;
  action: string;
  reason: string | null;
  actorId: string | null;
  actorEmail: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface RegistroCierre {
  id: string;
  contentHash: string;
  createdAt: string;
}

interface ReportValidation {
  id: string;
  validationCode: string;
  reportType: string;
  reportTypeLabel: string;
  status: string;
  isValid: boolean;
  issuedAt: string;
  symbol: string | null;
  contentHash: string;
  revokedAt: string | null;
}

interface AuditoriaData {
  period: PeriodData;
  logs: AuditLog[];
  registros: RegistroCierre[];
  validations: ReportValidation[];
}

interface PeriodConfigItem {
  label: string;
  color: string;
  bg: string;
  border: string;
}

interface ActionConfigItem {
  label: string;
  description: string;
  color: string;
  bg: string;
  icon: string;
}

const PERIOD_CONFIG: Record<PeriodStatus, PeriodConfigItem> = {
  OPEN: { label: "Abierto", color: "#16A34A", bg: "rgba(22,163,74,0.07)", border: "rgba(22,163,74,0.22)" },
  CLOSED: { label: "Cerrado", color: "#64748B", bg: "rgba(100,116,139,0.07)", border: "rgba(100,116,139,0.22)" },
  REOPENED: { label: "Reabierto", color: "#D97706", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.22)" },
};

const ACTION_CONFIG: Record<string, ActionConfigItem> = {
  CLOSE: { label: "Periodo cerrado", description: "Se congelo el estado tributario del periodo.", color: "#64748B", bg: "rgba(100,116,139,0.08)", icon: "🔒" },
  REOPEN: { label: "Periodo reabierto", description: "Se habilito el periodo para realizar correcciones.", color: "#D97706", bg: "rgba(245,158,11,0.08)", icon: "🔓" },
  SNAPSHOT: { label: "Registro de cierre generado", description: "Se creo un respaldo del estado tributario.", color: "#0F2A3D", bg: "rgba(15,42,61,0.06)", icon: "📋" },
  REBUILD: { label: "Motor recalculado", description: "Se recalcularon los eventos tributarios desde los movimientos.", color: "#7C3AED", bg: "rgba(124,58,237,0.08)", icon: "⚙️" },
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatDateShort(value: string) {
  return new Date(value).toLocaleDateString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function buildLogDescription(log: AuditLog): string {
  const cfg = ACTION_CONFIG[log.action];
  const base = cfg?.description ?? `Accion: ${log.action}`;
  const reason = log.reason ? ` Motivo: "${log.reason}".` : "";
  return base + reason;
}

const currentYear = new Date().getFullYear();

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.5rem 0.75rem", borderRadius: "8px",
  border: "1px solid rgba(15,42,61,0.15)", fontSize: "0.875rem",
  fontFamily: "var(--font-body)", color: "#0F2A3D", background: "#ffffff",
  boxSizing: "border-box", outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748B",
  marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em",
};

export default function AuditoriaPage() {
  const [year, setYear] = useState(currentYear);
  const [section, setSection] = useState<Section>("estado");
  const [data, setData] = useState<AuditoriaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [closeReason, setCloseReason] = useState("");
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closeSuccess, setCloseSuccess] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState("");
  const [reopenLoading, setReopenLoading] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);
  const [reopenSuccess, setReopenSuccess] = useState<string | null>(null);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [periodRes, logsRes, snapshotsRes, validationsRes] = await Promise.all([
        fetch(`/api/tax/periods/status?year=${year}`),
        fetch(`/api/tax/periods/audit?year=${year}`),
        fetch(`/api/tax/periods/snapshots?year=${year}`),
        fetch(`/api/report-validations?year=${year}`),
      ]);
      if (!periodRes.ok || !logsRes.ok || !snapshotsRes.ok || !validationsRes.ok) throw new Error("Error al conectar con el servidor");
      const periodJson = await periodRes.json();
      const logsJson = await logsRes.json();
      const snapshotsJson = await snapshotsRes.json();
      const validationsJson = await validationsRes.json();
      if (!periodJson.ok || !logsJson.ok || !snapshotsJson.ok || !validationsJson.ok) throw new Error("Respuesta invalida del servidor");
      setData({ period: periodJson.data, logs: logsJson.data.logs, registros: snapshotsJson.data.snapshots, validations: validationsJson.data.validations });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, [year]);

  async function handleClose() {
    setCloseError(null); setCloseSuccess(null);
    if (!closeReason.trim()) { setCloseError("El motivo de cierre es obligatorio"); return; }
    setCloseLoading(true);
    try {
      const res = await fetch("/api/tax/periods/close", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year, closedReason: closeReason.trim() }) });
      const json = await res.json();
      if (!res.ok || !json.ok) { setCloseError(json.message ?? "Error al cerrar el periodo"); return; }
      setCloseSuccess(`Periodo ${year} cerrado correctamente.`);
      setCloseReason("");
      await fetchAll();
    } catch { setCloseError("Error de conexion"); } finally { setCloseLoading(false); }
  }

  async function handleReopen() {
    setReopenError(null); setReopenSuccess(null);
    if (!reopenReason.trim()) { setReopenError("El motivo de reapertura es obligatorio"); return; }
    setReopenLoading(true);
    try {
      const res = await fetch("/api/tax/periods/reopen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year, reopenReason: reopenReason.trim() }) });
      const json = await res.json();
      if (!res.ok || !json.ok) { setReopenError(json.message ?? "Error al reabrir el periodo"); return; }
      setReopenSuccess(`Periodo ${year} reabierto correctamente.`);
      setReopenReason("");
      await fetchAll();
    } catch { setReopenError("Error de conexion"); } finally { setReopenLoading(false); }
  }

  async function handleCopyLink(id: string, text: string) {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); } catch { /* noop */ }
  }

  if (loading) {
    return (
      <>
        <style>{`@keyframes ledgera-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "1rem" }}>
          <div style={{ width: 28, height: 28, border: "2px solid rgba(15,42,61,0.12)", borderTopColor: "#0F2A3D", borderRadius: "50%", animation: "ledgera-spin 0.75s linear infinite" }} />
          <p style={{ color: "#94A3B8", fontSize: "0.875rem", margin: 0 }}>Cargando auditoria...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: "12px", padding: "1.25rem 1.5rem" }}>
          <p style={{ color: "#DC2626", fontWeight: 600, margin: "0 0 4px" }}>Error al cargar Auditoria</p>
          <p style={{ color: "#64748B", margin: 0, fontSize: "0.875rem" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { period, logs, registros, validations } = data;
  const pcfg = PERIOD_CONFIG[period.status];

  return (
    <div style={{ maxWidth: "1100px", fontFamily: "var(--font-body)" }}>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.375rem", fontWeight: 700, color: "#0F2A3D", margin: "0 0 4px" }}>Auditoria</h1>
          <p style={{ color: "#94A3B8", margin: 0, fontSize: "0.875rem" }}>Control de periodos tributarios y trazabilidad de operaciones</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {[currentYear - 1, currentYear].map((y) => (
            <button key={y} onClick={() => setYear(y)} style={{ padding: "6px 16px", borderRadius: "8px", border: "1px solid", borderColor: year === y ? "#0F2A3D" : "rgba(15,42,61,0.15)", background: year === y ? "#0F2A3D" : "transparent", color: year === y ? "#ffffff" : "#64748B", fontSize: "0.875rem", fontWeight: year === y ? 600 : 400, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              {y}
            </button>
          ))}
          <a href="/api/movements/audit/export" download="movimientos_auditoria.csv" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", borderRadius: "8px", border: "1px solid rgba(15,42,61,0.15)", background: "#ffffff", color: "#0F2A3D", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="#0F2A3D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Movimientos CSV
          </a>
          <a href={`/api/tax/periods/audit/export/csv?year=${year}`} download={`ledgera-trazabilidad-auditoria-${year}.csv`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", borderRadius: "8px", border: "1px solid rgba(15,42,61,0.15)", background: "#ffffff", color: "#0F2A3D", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="#0F2A3D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Trazabilidad XLS
          </a>
          <a href={`/api/tax/periods/audit/export/pdf?year=${year}`} download={`ledgera-trazabilidad-auditoria-${year}.pdf`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", borderRadius: "8px", border: "1px solid rgba(15,42,61,0.15)", background: "#0F2A3D", color: "#ffffff", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Trazabilidad PDF
          </a>
        </div>
      </div>

      <div style={{ background: pcfg.bg, border: `1px solid ${pcfg.border}`, borderRadius: "14px", padding: "1.25rem 1.5rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: pcfg.color, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.125rem", color: pcfg.color }}>Periodo {year} — {pcfg.label}</p>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#94A3B8" }}>
            {period.closedAt ? `Cerrado el ${formatDateTime(period.closedAt)}` : "Sin fecha de cierre registrada"}
            {period.reopenedAt ? ` · Reabierto el ${formatDateTime(period.reopenedAt)}` : ""}
          </p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: "8px", padding: "0.5rem 1rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "0.6875rem", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Registros de cierre</p>
          <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", color: "#0F2A3D" }}>{registros.length}</p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: "8px", padding: "0.5rem 1rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "0.6875rem", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Eventos registrados</p>
          <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", color: "#0F2A3D" }}>{logs.length}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "1.5rem", borderBottom: "1px solid #E2E8F0" }}>
        {(["estado", "log", "registros"] as Section[]).map((s) => (
          <button key={s} onClick={() => setSection(s)} style={{ padding: "8px 18px", borderRadius: "8px 8px 0 0", border: "none", borderBottom: section === s ? "2px solid #0F2A3D" : "2px solid transparent", background: "transparent", color: section === s ? "#0F2A3D" : "#94A3B8", fontWeight: section === s ? 600 : 400, fontSize: "0.875rem", cursor: "pointer", fontFamily: "var(--font-body)" }}>
            {s === "estado" ? "Estado y acciones" : s === "log" ? "Historial" : "Registros de cierre"}
          </button>
        ))}
      </div>

      {section === "estado" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {(period.status === "OPEN" || period.status === "REOPENED") && (
            <div style={{ background: "#ffffff", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "1.25rem 1.5rem" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9375rem", color: "#0F2A3D", margin: "0 0 4px" }}>Cerrar periodo {year}</p>
              <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: "0 0 1rem" }}>Congela el estado tributario del periodo.</p>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <label style={labelStyle}>Motivo de cierre</label>
                  <input type="text" placeholder="Ej: Cierre periodo anual 2026..." value={closeReason} onChange={(e) => { setCloseReason(e.target.value); setCloseError(null); setCloseSuccess(null); }} style={inputStyle} />
                </div>
                <button onClick={handleClose} disabled={closeLoading} style={{ background: closeLoading ? "#94A3B8" : "#0F2A3D", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.5rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, cursor: closeLoading ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap", height: "38px" }}>
                  {closeLoading ? "Cerrando..." : "Cerrar periodo"}
                </button>
              </div>
              {closeError && <p style={{ margin: "10px 0 0", fontSize: "0.8125rem", color: "#DC2626", background: "rgba(220,38,38,0.05)", padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(220,38,38,0.15)" }}>{closeError}</p>}
              {closeSuccess && <p style={{ margin: "10px 0 0", fontSize: "0.8125rem", color: "#16A34A", background: "rgba(22,163,74,0.05)", padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(22,163,74,0.15)" }}>{closeSuccess}</p>}
            </div>
          )}
          {period.status === "CLOSED" && (
            <div style={{ background: "#ffffff", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "12px", padding: "1.25rem 1.5rem" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9375rem", color: "#D97706", margin: "0 0 4px" }}>Reabrir periodo {year}</p>
              <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: "0 0 1rem" }}>Permite modificar movimientos o eventos del periodo.</p>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <label style={labelStyle}>Motivo de reapertura</label>
                  <input type="text" placeholder="Ej: Correccion de clasificacion..." value={reopenReason} onChange={(e) => { setReopenReason(e.target.value); setReopenError(null); setReopenSuccess(null); }} style={inputStyle} />
                </div>
                <button onClick={handleReopen} disabled={reopenLoading} style={{ background: reopenLoading ? "#94A3B8" : "#D97706", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.5rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, cursor: reopenLoading ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap", height: "38px" }}>
                  {reopenLoading ? "Reabriendo..." : "Reabrir periodo"}
                </button>
              </div>
              {reopenError && <p style={{ margin: "10px 0 0", fontSize: "0.8125rem", color: "#DC2626", background: "rgba(220,38,38,0.05)", padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(220,38,38,0.15)" }}>{reopenError}</p>}
              {reopenSuccess && <p style={{ margin: "10px 0 0", fontSize: "0.8125rem", color: "#16A34A", background: "rgba(22,163,74,0.05)", padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(22,163,74,0.15)" }}>{reopenSuccess}</p>}
            </div>
          )}
          {period.status === "REOPENED" && (
            <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "12px", padding: "1rem 1.25rem" }}>
              <p style={{ fontSize: "0.8125rem", color: "#92400E", margin: 0 }}>El periodo esta reabierto. Realiza las correcciones necesarias, luego cierralo nuevamente.</p>
            </div>
          )}
          {period.status === "CLOSED" && (
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "1rem 1.25rem" }}>
              <p style={{ fontSize: "0.8125rem", color: "#94A3B8", margin: 0 }}>El periodo {year} esta cerrado. Usa la opcion de reapertura si necesitas realizar correcciones.</p>
            </div>
          )}
        </div>
      )}

      {section === "log" && (
        <div>
          {logs.length === 0 ? (
            <div style={{ background: "#F8FAFC", border: "1px dashed rgba(15,42,61,0.13)", borderRadius: "12px", padding: "3rem", textAlign: "center" }}>
              <p style={{ color: "#94A3B8", margin: "0 0 4px", fontWeight: 600 }}>Sin actividad registrada para {year}</p>
              <p style={{ color: "#CBD5E1", margin: 0, fontSize: "0.875rem" }}>Las acciones sobre el periodo aparecen aqui automaticamente.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {logs.map((log, index) => {
                const actionCfg = ACTION_CONFIG[log.action] ?? { label: log.action, description: "", color: "#64748B", bg: "rgba(100,116,139,0.06)", icon: "•" };
                const isLast = index === logs.length - 1;
                return (
                  <div key={log.id} style={{ display: "flex", gap: "1rem", paddingBottom: isLast ? 0 : "1.25rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 32 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: actionCfg.bg, border: `1px solid ${actionCfg.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem" }}>
                        {actionCfg.icon}
                      </div>
                      {!isLast && <div style={{ width: 1, flex: 1, background: "#E2E8F0", marginTop: "4px" }} />}
                    </div>
                    <div style={{ flex: 1, paddingTop: "4px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap", marginBottom: "4px" }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9375rem", color: actionCfg.color }}>{actionCfg.label}</p>
                        <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>{formatDateTime(log.createdAt)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.8125rem", color: "#475569" }}>{buildLogDescription(log)}</p>
                      {log.reason && <p style={{ margin: "4px 0 0", fontSize: "0.8125rem", color: "#64748B", fontStyle: "italic" }}>&quot;{log.reason}&quot;</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {section === "registros" && (
        <div>
          <div style={{ background: "rgba(15,42,61,0.04)", border: "1px solid rgba(15,42,61,0.1)", borderRadius: "10px", padding: "0.875rem 1rem", marginBottom: "1.25rem", fontSize: "0.8125rem", color: "#475569" }}>
            Cada reporte verificable tiene un codigo unico que permite confirmar su autenticidad.
          </div>
          {validations.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 700, color: "#0F2A3D", margin: "0 0 0.75rem" }}>Reportes verificables del periodo {year}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {validations.map((v) => {
                  const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : "https://ledgera.cl"}/verify/report/${v.validationCode}`;
                  return (
                    <div key={v.id} style={{ background: "#ffffff", border: `1px solid ${v.isValid ? "#E2E8F0" : "rgba(220,38,38,0.15)"}`, borderRadius: "10px", padding: "1rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "200px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 700, background: v.isValid ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)", color: v.isValid ? "#16A34A" : "#DC2626" }}>
                              {v.isValid ? "Valido" : "Revocado"}
                            </span>
                            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0F2A3D" }}>{v.reportTypeLabel}</span>
                          </div>
                          <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "#94A3B8" }}>Emitido: {formatDateTime(v.issuedAt)}{v.symbol ? ` · Activo: ${v.symbol}` : ""}</p>
                          <p style={{ margin: 0, fontFamily: "monospace", fontSize: "0.75rem", color: "#64748B", wordBreak: "break-all" }}>{v.validationCode}</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                          <a href={verifyUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "0.4rem 1rem", borderRadius: "8px", background: "#0F2A3D", color: "#ffffff", fontSize: "0.8125rem", fontWeight: 600, textDecoration: "none", textAlign: "center", whiteSpace: "nowrap" }}>
                            Ver verificacion
                          </a>
                          <button onClick={() => handleCopyLink(v.id, verifyUrl)} style={{ background: copiedId === v.id ? "rgba(22,163,74,0.08)" : "#F1F5F9", border: `1px solid ${copiedId === v.id ? "rgba(22,163,74,0.3)" : "transparent"}`, borderRadius: "8px", padding: "0.4rem 1rem", fontSize: "0.8125rem", fontWeight: 600, color: copiedId === v.id ? "#16A34A" : "#64748B", cursor: "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>
                            {copiedId === v.id ? "Copiado" : "Copiar enlace"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {validations.length === 0 && (
            <div style={{ background: "#F8FAFC", border: "1px dashed rgba(15,42,61,0.13)", borderRadius: "12px", padding: "2rem", textAlign: "center", marginBottom: "1.5rem" }}>
              <p style={{ color: "#94A3B8", margin: "0 0 4px", fontWeight: 600 }}>Sin reportes verificables para {year}</p>
              <p style={{ color: "#CBD5E1", margin: 0, fontSize: "0.875rem" }}>Se generan al descargar el PDF desde Tributario.</p>
            </div>
          )}
          {registros.length > 0 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 700, color: "#0F2A3D", margin: "0 0 4px" }}>Constancias de estado tributario</h2>
              <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: "0 0 0.75rem" }}>Registro tecnico del estado del portafolio al momento de cada cierre.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {registros.map((reg, index) => (
                  <div key={reg.id} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#94A3B8", background: "#EEF2FF", padding: "2px 8px", borderRadius: "4px" }}>#{index + 1}</span>
                        <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>{formatDateShort(reg.createdAt)}</span>
                      </div>
                      <p style={{ margin: 0, fontFamily: "monospace", fontSize: "0.75rem", color: "#94A3B8", wordBreak: "break-all" }}>{reg.contentHash}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
