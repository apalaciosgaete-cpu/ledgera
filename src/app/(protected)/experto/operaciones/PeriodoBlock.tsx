"use client";

import { useEffect, useState } from "react";
import { clp } from "@/shared/formatting";

type PeriodStatus = "OPEN" | "CLOSED" | "REOPENED";

type PrecheckItem = {
  key: string;
  label: string;
  description: string;
  passed: boolean;
  value: string;
};

type PrecheckSummary = {
  totalMovements: number;
  totalTaxEvents: number;
  pendingEvents: number;
  sellWithoutEvent: number;
  orphanEvents: number;
  healthScore: number;
  totalPnlClp: number;
  totalPnlUsd: number;
  baseImponibleClp: number;
  impuestoEstimadoClp: number;
};

type PrecheckData = {
  year: number;
  status: PeriodStatus;
  isClosed: boolean;
  closedAt: string | null;
  reopenedAt: string | null;
  closedReason: string | null;
  preconditions: PrecheckItem[];
  readyToClose: boolean;
  summary: PrecheckSummary;
};

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

interface AuditoriaData {
  logs: AuditLog[];
  registros: RegistroCierre[];
}

const ACTION_CONFIG: Record<string, { label: string; description: string; color: string; bg: string; icon: string }> = {
  CLOSE: { label: "Período cerrado", description: "Se congeló el estado tributario del período.", color: "var(--text-soft)", bg: "rgba(100,116,139,0.08)", icon: "🔒" },
  REOPEN: { label: "Período reabierto", description: "Se habilitó el período para realizar correcciones.", color: "var(--warn)", bg: "rgba(245,158,11,0.08)", icon: "🔓" },
  SNAPSHOT: { label: "Registro de cierre generado", description: "Se creó un respaldo del estado tributario.", color: "var(--text)", bg: "rgba(15,42,61,0.06)", icon: "📋" },
  REBUILD: { label: "Motor recalculado", description: "Se recalcularon los eventos tributarios desde los movimientos.", color: "var(--accent)", bg: "rgba(124,58,237,0.08)", icon: "⚙️" },
};

function statusConfig(status: PeriodStatus) {
  switch (status) {
    case "OPEN": return { label: "Abierto", color: "var(--accent)", bg: "var(--accent-soft)", border: "var(--accent)", icon: "◌" };
    case "CLOSED": return { label: "Cerrado", color: "var(--text-soft)", bg: "var(--bg-sunken)", border: "var(--border)", icon: "🔒" };
    case "REOPENED": return { label: "Reabierto", color: "var(--warn)", bg: "rgba(232,184,75,0.14)", border: "var(--warn)", icon: "🔓" };
  }
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(value: string) {
  return new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function PeriodoBlock() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<PrecheckData | null>(null);
  const [auditData, setAuditData] = useState<AuditoriaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [closeReason, setCloseReason] = useState("");
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeError, setCloseError] = useState("");
  const [closeSuccess, setCloseSuccess] = useState("");

  const [reopenReason, setReopenReason] = useState("");
  const [reopenLoading, setReopenLoading] = useState(false);
  const [reopenError, setReopenError] = useState("");
  const [reopenSuccess, setReopenSuccess] = useState("");

  async function load(yearToLoad = year) {
    setLoading(true);
    setError("");
    try {
      const [precheckRes, logsRes, snapshotsRes] = await Promise.all([
        fetch(`/api/tax/periods/precheck?year=${yearToLoad}`, { cache: "no-store" }),
        fetch(`/api/tax/periods/audit?year=${yearToLoad}`, { cache: "no-store" }),
        fetch(`/api/tax/periods/snapshots?year=${yearToLoad}`, { cache: "no-store" }),
      ]);
      const precheckJson = await precheckRes.json();
      const logsJson = await logsRes.json();
      const snapshotsJson = await snapshotsRes.json();
      if (!precheckRes.ok || !precheckJson.ok) throw new Error(precheckJson.message || "Error cargando precheck.");
      setData(precheckJson.data);
      setAuditData({
        logs: logsJson.ok ? logsJson.data.logs : [],
        registros: snapshotsJson.ok ? snapshotsJson.data.snapshots : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(currentYear); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleClose() {
    setCloseError(""); setCloseSuccess("");
    if (!closeReason.trim()) { setCloseError("El motivo de cierre es obligatorio."); return; }
    setCloseLoading(true);
    try {
      const res = await fetch("/api/tax/periods/close", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year, closedReason: closeReason.trim() }) });
      const json = await res.json();
      if (!res.ok || !json.ok) { setCloseError(json.message || "Error al cerrar el período."); return; }
      setCloseSuccess(`Período ${year} cerrado correctamente.`); setCloseReason(""); await load(year);
    } catch { setCloseError("Error de conexión."); } finally { setCloseLoading(false); }
  }

  async function handleReopen() {
    setReopenError(""); setReopenSuccess("");
    if (!reopenReason.trim()) { setReopenError("El motivo de reapertura es obligatorio."); return; }
    setReopenLoading(true);
    try {
      const res = await fetch("/api/tax/periods/reopen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year, reopenReason: reopenReason.trim() }) });
      const json = await res.json();
      if (!res.ok || !json.ok) { setReopenError(json.message || "Error al reabrir el período."); return; }
      setReopenSuccess(`Período ${year} reabierto correctamente.`); setReopenReason(""); await load(year);
    } catch { setReopenError("Error de conexión."); } finally { setReopenLoading(false); }
  }

  const cfg = data ? statusConfig(data.status) : statusConfig("OPEN");

  return (
    <div>
      {/* Selector año */}
      <section style={{ alignItems: "end", background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 8, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 20, padding: 16 }}>
        <label style={{ color: "var(--text)", display: "grid", fontSize: 13, fontWeight: 750, gap: 6 }}>
          Año tributario
          <select value={year} onChange={(e) => { const y = Number(e.target.value); setYear(y); void load(y); }} style={{ border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", minHeight: 40, padding: "0 10px" }}>
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear}>{currentYear}</option>
          </select>
        </label>
      </section>

      {loading && <p style={{ color: "var(--text-soft)", fontSize: 14, fontWeight: 750 }}>Cargando estado del período…</p>}
      {error && <div style={{ background: "rgba(196,99,74,0.14)", border: "1px solid rgba(196,99,74,0.14)", borderRadius: 8, color: "var(--loss)", fontWeight: 750, padding: 16 }}>{error}</div>}

      {!loading && data && (
        <>
          {/* Estado */}
          <section style={{ background: cfg.bg, border: `2px solid ${cfg.border}`, borderRadius: 12, marginBottom: 20, padding: 22 }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{cfg.icon}</span>
              <span style={{ background: "var(--bg-elev)", borderRadius: 999, color: cfg.color, display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "6px 12px" }}>Período {data.year} — {cfg.label}</span>
            </div>
            <p style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.55, margin: 0 }}>
              {data.status === "OPEN" && "El período está abierto. Puedes cargar movimientos y modificar datos. Cuando estés listo para declarar, ciérralo para congelar tu estado tributario."}
              {data.status === "CLOSED" && data.closedAt && `El período fue cerrado el ${new Date(data.closedAt).toLocaleDateString("es-CL")}. No puedes modificar movimientos ni eventos hasta reabrirlo.`}
              {data.status === "REOPENED" && data.reopenedAt && `El período fue reabierto el ${new Date(data.reopenedAt).toLocaleDateString("es-CL")}. Realiza las correcciones necesarias y ciérralo nuevamente.`}
            </p>
          </section>

          {/* Precondiciones */}
          {data.status !== "CLOSED" && (
            <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 20, overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ color: "var(--text)", fontSize: "1rem", fontWeight: 850, margin: 0 }}>Checklist antes de cerrar</h3>
                <p style={{ color: "var(--text-soft)", fontSize: 13, margin: "4px 0 0" }}>Verifica que todo esté en orden para congelar tu estado tributario.</p>
              </div>
              <div style={{ display: "grid", gap: 0 }}>
                {data.preconditions.map((item) => (
                  <div key={item.key} style={{ alignItems: "center", borderTop: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: "14px 18px" }}>
                    <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{item.passed ? "✅" : "❌"}</span>
                      <div>
                        <p style={{ color: "var(--text)", fontSize: 14, fontWeight: 750, margin: 0 }}>{item.label}</p>
                        <p style={{ color: "var(--text-soft)", fontSize: 12, margin: "2px 0 0" }}>{item.description}</p>
                      </div>
                    </div>
                    <span style={{ color: item.passed ? "var(--accent)" : "var(--loss)", fontSize: 13, fontWeight: 750 }}>{item.value}</span>
                  </div>
                ))}
              </div>
              {!data.readyToClose && data.status === "OPEN" && (
                <div style={{ background: "rgba(196,99,74,0.14)", borderTop: "1px solid rgba(196,99,74,0.14)", padding: "12px 18px" }}>
                  <p style={{ color: "var(--loss)", fontSize: 13, fontWeight: 750, margin: 0 }}>⚠ No puedes cerrar el período hasta resolver los puntos marcados arriba.</p>
                </div>
              )}
            </section>
          )}

          {/* Resumen */}
          <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 20 }}>
            {[
              { label: "Movimientos", value: data.summary.totalMovements, sub: `Registrados en ${year}` },
              { label: "Eventos tributarios", value: data.summary.totalTaxEvents, sub: "Ventas calculadas" },
              { label: "Ganancia / Pérdida", value: clp(data.summary.totalPnlClp), sub: `Realizado en ${year}`, color: data.summary.totalPnlClp >= 0 ? "var(--accent)" : "var(--warn)" },
              { label: "Base imponible", value: clp(data.summary.baseImponibleClp), sub: "Estimada CLP" },
              { label: "Impuesto estimado", value: clp(data.summary.impuestoEstimadoClp), sub: "~6.5% de la base" },
              { label: "Salud datos", value: `${data.summary.healthScore}/100`, sub: "Score tributario", color: data.summary.healthScore >= 70 ? "#3FA687" : data.summary.healthScore >= 40 ? "#E8B84B" : "#C4634A" },
            ].map((item) => (
              <article key={item.label} style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 8, padding: 18 }}>
                <p style={{ color: "var(--text-soft)", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>{item.label}</p>
                <p style={{ color: item.color ?? "var(--text)", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{item.value}</p>
                <p style={{ color: "var(--text-soft)", fontSize: 13, margin: 0 }}>{item.sub}</p>
              </article>
            ))}
          </section>

          {/* Acciones */}
          {data.status === "OPEN" && data.readyToClose && (
            <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 20, padding: "18px 20px" }}>
              <h3 style={{ color: "var(--text)", fontSize: "1rem", fontWeight: 850, margin: "0 0 8px" }}>Cerrar período {year}</h3>
              <p style={{ color: "var(--text-soft)", fontSize: 13, lineHeight: 1.55, margin: "0 0 14px" }}>Todo está en orden. Al cerrar, se congelarán tus movimientos y eventos tributarios.</p>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <label style={{ color: "var(--text)", display: "block", fontSize: 12, fontWeight: 750, marginBottom: 6 }}>Motivo de cierre</label>
                  <input type="text" value={closeReason} onChange={(e) => { setCloseReason(e.target.value); setCloseError(""); setCloseSuccess(""); }} placeholder="Ej: Cierre período anual para declaración SII" style={{ border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 14, padding: "10px 12px", width: "100%", boxSizing: "border-box" }} />
                </div>
                <button onClick={handleClose} disabled={closeLoading} style={{ background: closeLoading ? "var(--bg-elev)" : "var(--bg-elev)", border: "none", borderRadius: 8, color: "var(--text)", cursor: closeLoading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 850, padding: "10px 18px", whiteSpace: "nowrap" }}>{closeLoading ? "Cerrando…" : "Cerrar período"}</button>
              </div>
              {closeError && <p style={{ color: "var(--loss)", fontSize: 13, fontWeight: 750, margin: "10px 0 0" }}>{closeError}</p>}
              {closeSuccess && <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 750, margin: "10px 0 0" }}>{closeSuccess}</p>}
            </section>
          )}

          {data.status === "CLOSED" && (
            <section style={{ background: "rgba(232,184,75,0.14)", border: "1px solid var(--warn)", borderRadius: 8, marginBottom: 20, padding: "18px 20px" }}>
              <h3 style={{ color: "var(--warn)", fontSize: "1rem", fontWeight: 850, margin: "0 0 8px" }}>Reabrir período {year}</h3>
              <p style={{ color: "var(--warn)", fontSize: 13, lineHeight: 1.55, margin: "0 0 14px" }}>El período está cerrado. Si necesitas corregir movimientos o eventos, reábrelo.</p>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <label style={{ color: "var(--text)", display: "block", fontSize: 12, fontWeight: 750, marginBottom: 6 }}>Motivo de reapertura</label>
                  <input type="text" value={reopenReason} onChange={(e) => { setReopenReason(e.target.value); setReopenError(""); setReopenSuccess(""); }} placeholder="Ej: Corrección de clasificación de eventos" style={{ border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 14, padding: "10px 12px", width: "100%", boxSizing: "border-box" }} />
                </div>
                <button onClick={handleReopen} disabled={reopenLoading} style={{ background: reopenLoading ? "var(--bg-elev)" : "var(--warn)", border: "none", borderRadius: 8, color: "var(--text)", cursor: reopenLoading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 850, padding: "10px 18px", whiteSpace: "nowrap" }}>{reopenLoading ? "Reabriendo…" : "Reabrir período"}</button>
              </div>
              {reopenError && <p style={{ color: "var(--loss)", fontSize: 13, fontWeight: 750, margin: "10px 0 0" }}>{reopenError}</p>}
              {reopenSuccess && <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 750, margin: "10px 0 0" }}>{reopenSuccess}</p>}
            </section>
          )}

          {data.status === "REOPENED" && (
            <section style={{ background: "rgba(232,184,75,0.14)", border: "1px solid var(--warn)", borderRadius: 8, marginBottom: 20, padding: "14px 18px" }}>
              <p style={{ color: "var(--text)", fontSize: 13, fontWeight: 750, margin: 0 }}>⚠ El período está reabierto. Realiza las correcciones necesarias y luego ciérralo nuevamente.</p>
            </section>
          )}

          {/* Auditoría: logs y registros */}
          {auditData && (
            <>
              <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 20, overflow: "hidden" }}>
                <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
                  <h3 style={{ color: "var(--text)", fontSize: "1rem", fontWeight: 850, margin: 0 }}>Historial de acciones</h3>
                  <p style={{ color: "var(--text-soft)", fontSize: 13, margin: "4px 0 0" }}>{auditData.logs.length} eventos registrados para {year}</p>
                </div>
                {auditData.logs.length === 0 ? (
                  <div style={{ padding: "2rem", textAlign: "center" }}>
                    <p style={{ color: "var(--text-soft)", fontWeight: 600, margin: "0 0 4px" }}>Sin actividad registrada</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", padding: "1rem 1.25rem" }}>
                    {auditData.logs.map((log, index) => {
                      const actionCfg = ACTION_CONFIG[log.action] ?? { label: log.action, description: "", color: "var(--text-soft)", bg: "rgba(100,116,139,0.06)", icon: "•" };
                      const isLast = index === auditData.logs.length - 1;
                      return (
                        <div key={log.id} style={{ display: "flex", gap: "1rem", paddingBottom: isLast ? 0 : "1.25rem" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 32 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: actionCfg.bg, border: `1px solid ${actionCfg.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem" }}>{actionCfg.icon}</div>
                            {!isLast && <div style={{ width: 1, flex: 1, background: "var(--bg-elev)", marginTop: "4px" }} />}
                          </div>
                          <div style={{ flex: 1, paddingTop: "4px" }}>
                            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap", marginBottom: "4px" }}>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9375rem", color: actionCfg.color }}>{actionCfg.label}</p>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-soft)" }}>{formatDateTime(log.createdAt)}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text)" }}>{actionCfg.description}{log.reason ? ` Motivo: "${log.reason}".` : ""}</p>
                            {log.actorEmail && <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "var(--text-soft)" }}>Por: {log.actorEmail}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {auditData.registros.length > 0 && (
                <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 20, overflow: "hidden" }}>
                  <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
                    <h3 style={{ color: "var(--text)", fontSize: "1rem", fontWeight: 850, margin: 0 }}>Constancias de estado tributario</h3>
                    <p style={{ color: "var(--text-soft)", fontSize: 13, margin: "4px 0 0" }}>Registro técnico del estado del portafolio al momento de cada cierre</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "1rem 1.25rem" }}>
                    {auditData.registros.map((reg, index) => (
                      <div key={reg.id} style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "200px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-soft)", background: "var(--accent-soft)", padding: "2px 8px", borderRadius: "4px" }}>#{index + 1}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-soft)" }}>{formatDateShort(reg.createdAt)}</span>
                          </div>
                          <p style={{ margin: 0, fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-soft)", wordBreak: "break-all" }}>{reg.contentHash}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Exportaciones */}
          <section style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 18px" }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
              <p style={{ color: "var(--text-soft)", fontSize: 13, margin: 0 }}>¿Necesitas exportar trazabilidad?</p>
              <div style={{ display: "flex", gap: 10 }}>
                <a href={`/api/tax/periods/audit/export/csv?year=${year}`} download={`ledgera-trazabilidad-${year}.csv`} style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none", whiteSpace: "nowrap" }}>Trazabilidad CSV</a>
                <a href={`/api/tax/periods/audit/export/pdf?year=${year}`} download={`ledgera-trazabilidad-${year}.pdf`} style={{ background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text)", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none", whiteSpace: "nowrap" }}>Trazabilidad PDF</a>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
