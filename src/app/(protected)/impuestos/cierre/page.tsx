"use client";

import Link from "next/link";
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

function statusConfig(status: PeriodStatus) {
  switch (status) {
    case "OPEN":
      return { label: "Abierto", color: "#16A34A", bg: "#F0FDF4", border: "#86EFAC", icon: "◌" };
    case "CLOSED":
      return { label: "Cerrado", color: "#64748B", bg: "#F8FAFC", border: "#CBD5E1", icon: "🔒" };
    case "REOPENED":
      return { label: "Reabierto", color: "#D97706", bg: "#FFFBEB", border: "#FCD34D", icon: "🔓" };
  }
}

export default function CierreTributarioPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<PrecheckData | null>(null);
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
      const res = await fetch(`/api/tax/periods/precheck?year=${yearToLoad}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Error cargando precheck.");
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(currentYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleClose() {
    setCloseError("");
    setCloseSuccess("");
    if (!closeReason.trim()) {
      setCloseError("El motivo de cierre es obligatorio.");
      return;
    }
    setCloseLoading(true);
    try {
      const res = await fetch("/api/tax/periods/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, closedReason: closeReason.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setCloseError(json.message || "Error al cerrar el período.");
        return;
      }
      setCloseSuccess(`Período ${year} cerrado correctamente.`);
      setCloseReason("");
      await load(year);
    } catch {
      setCloseError("Error de conexión.");
    } finally {
      setCloseLoading(false);
    }
  }

  async function handleReopen() {
    setReopenError("");
    setReopenSuccess("");
    if (!reopenReason.trim()) {
      setReopenError("El motivo de reapertura es obligatorio.");
      return;
    }
    setReopenLoading(true);
    try {
      const res = await fetch("/api/tax/periods/reopen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, reopenReason: reopenReason.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setReopenError(json.message || "Error al reabrir el período.");
        return;
      }
      setReopenSuccess(`Período ${year} reabierto correctamente.`);
      setReopenReason("");
      await load(year);
    } catch {
      setReopenError("Error de conexión.");
    } finally {
      setReopenLoading(false);
    }
  }

  const cfg = data ? statusConfig(data.status) : statusConfig("OPEN");

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Cierre tributario</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Cerrar o reabrir período</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Congela tu estado tributario cuando estés listo para declarar. Reabre solo si necesitas corregir.
          </p>
        </div>
        <Link href="/mi-situacion" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver al centro tributario
        </Link>
      </section>

      <section style={{ alignItems: "end", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 20, padding: 16 }}>
        <label style={{ color: "#475569", display: "grid", fontSize: 13, fontWeight: 750, gap: 6 }}>
          Año tributario
          <select
            value={year}
            onChange={(e) => { const y = Number(e.target.value); setYear(y); void load(y); }}
            style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", minHeight: 40, padding: "0 10px" }}
          >
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear}>{currentYear}</option>
          </select>
        </label>
      </section>

      {loading && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando estado del período...</p>}
      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{error}</div>}

      {!loading && data && (
        <>
          {/* Estado del período */}
          <section style={{ background: cfg.bg, border: `2px solid ${cfg.border}`, borderRadius: 12, marginBottom: 20, padding: 22 }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{cfg.icon}</span>
              <span style={{ background: "#FFFFFF", borderRadius: 999, color: cfg.color, display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "6px 12px" }}>
                Período {data.year} — {cfg.label}
              </span>
            </div>
            <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.55, margin: 0 }}>
              {data.status === "OPEN" && "El período está abierto. Puedes cargar movimientos y modificar datos. Cuando estés listo para declarar, ciérralo para congelar tu estado tributario."}
              {data.status === "CLOSED" && data.closedAt && `El período fue cerrado el ${new Date(data.closedAt).toLocaleDateString("es-CL")}. No puedes modificar movimientos ni eventos hasta reabrirlo.`}
              {data.status === "REOPENED" && data.reopenedAt && `El período fue reabierto el ${new Date(data.reopenedAt).toLocaleDateString("es-CL")}. Realiza las correcciones necesarias y ciérralo nuevamente.`}
            </p>
          </section>

          {/* Precondiciones */}
          {data.status !== "CLOSED" && (
            <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 20, overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid #E2E8F0" }}>
                <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: 0 }}>Checklist antes de cerrar</h3>
                <p style={{ color: "#64748B", fontSize: 13, margin: "4px 0 0" }}>Verifica que todo esté en orden para congelar tu estado tributario.</p>
              </div>
              <div style={{ display: "grid", gap: 0 }}>
                {data.preconditions.map((item) => (
                  <div key={item.key} style={{ alignItems: "center", borderTop: "1px solid #E2E8F0", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: "14px 18px" }}>
                    <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{item.passed ? "✅" : "❌"}</span>
                      <div>
                        <p style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 750, margin: 0 }}>{item.label}</p>
                        <p style={{ color: "#64748B", fontSize: 12, margin: "2px 0 0" }}>{item.description}</p>
                      </div>
                    </div>
                    <span style={{ color: item.passed ? "#16A34A" : "#DC2626", fontSize: 13, fontWeight: 750 }}>{item.value}</span>
                  </div>
                ))}
              </div>
              {!data.readyToClose && data.status === "OPEN" && (
                <div style={{ background: "#FEF2F2", borderTop: "1px solid #FECACA", padding: "12px 18px" }}>
                  <p style={{ color: "#991B1B", fontSize: 13, fontWeight: 750, margin: 0 }}>
                    ⚠ No puedes cerrar el período hasta resolver los puntos marcados arriba.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Resumen del período */}
          <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 20 }}>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Movimientos</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{data.summary.totalMovements}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Registrados en {year}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Eventos tributarios</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{data.summary.totalTaxEvents}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Ventas calculadas</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Ganancia / Pérdida</p>
              <p style={{ color: data.summary.totalPnlClp >= 0 ? "#15803D" : "#B45309", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>
                {clp(data.summary.totalPnlClp)}
              </p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Realizado en {year}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Base imponible</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{clp(data.summary.baseImponibleClp)}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Estimada CLP</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Impuesto estimado</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{clp(data.summary.impuestoEstimadoClp)}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>~6.5% de la base</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Salud datos</p>
              <p style={{ color: data.summary.healthScore >= 70 ? "#15803D" : data.summary.healthScore >= 40 ? "#B45309" : "#991B1B", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>
                {data.summary.healthScore}/100
              </p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Score tributario</p>
            </article>
          </section>

          {/* Acciones */}
          {data.status === "OPEN" && data.readyToClose && (
            <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 20, padding: "18px 20px" }}>
              <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 8px" }}>Cerrar período {year}</h3>
              <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.55, margin: "0 0 14px" }}>
                Todo está en orden. Al cerrar, se congelarán tus movimientos y eventos tributarios. Generaremos un respaldo con hash de verificación.
              </p>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <label style={{ color: "#475569", display: "block", fontSize: 12, fontWeight: 750, marginBottom: 6 }}>Motivo de cierre</label>
                  <input
                    type="text"
                    value={closeReason}
                    onChange={(e) => { setCloseReason(e.target.value); setCloseError(""); setCloseSuccess(""); }}
                    placeholder="Ej: Cierre período anual para declaración SII"
                    style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 14, padding: "10px 12px", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <button
                  onClick={handleClose}
                  disabled={closeLoading}
                  style={{
                    background: closeLoading ? "#94A3B8" : "#0F2A3D",
                    border: "none",
                    borderRadius: 8,
                    color: "#FFFFFF",
                    cursor: closeLoading ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 850,
                    padding: "10px 18px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {closeLoading ? "Cerrando..." : "Cerrar período"}
                </button>
              </div>
              {closeError && <p style={{ color: "#DC2626", fontSize: 13, fontWeight: 750, margin: "10px 0 0" }}>{closeError}</p>}
              {closeSuccess && <p style={{ color: "#16A34A", fontSize: 13, fontWeight: 750, margin: "10px 0 0" }}>{closeSuccess}</p>}
            </section>
          )}

          {data.status === "CLOSED" && (
            <section style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 8, marginBottom: 20, padding: "18px 20px" }}>
              <h3 style={{ color: "#92400E", fontSize: "1rem", fontWeight: 850, margin: "0 0 8px" }}>Reabrir período {year}</h3>
              <p style={{ color: "#78350F", fontSize: 13, lineHeight: 1.55, margin: "0 0 14px" }}>
                El período está cerrado. Si necesitas corregir movimientos o eventos, reábrelo. Se generará un registro de auditoría.
              </p>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <label style={{ color: "#475569", display: "block", fontSize: 12, fontWeight: 750, marginBottom: 6 }}>Motivo de reapertura</label>
                  <input
                    type="text"
                    value={reopenReason}
                    onChange={(e) => { setReopenReason(e.target.value); setReopenError(""); setReopenSuccess(""); }}
                    placeholder="Ej: Corrección de clasificación de eventos"
                    style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 14, padding: "10px 12px", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <button
                  onClick={handleReopen}
                  disabled={reopenLoading}
                  style={{
                    background: reopenLoading ? "#94A3B8" : "#D97706",
                    border: "none",
                    borderRadius: 8,
                    color: "#FFFFFF",
                    cursor: reopenLoading ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 850,
                    padding: "10px 18px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {reopenLoading ? "Reabriendo..." : "Reabrir período"}
                </button>
              </div>
              {reopenError && <p style={{ color: "#DC2626", fontSize: 13, fontWeight: 750, margin: "10px 0 0" }}>{reopenError}</p>}
              {reopenSuccess && <p style={{ color: "#16A34A", fontSize: 13, fontWeight: 750, margin: "10px 0 0" }}>{reopenSuccess}</p>}
            </section>
          )}

          {data.status === "REOPENED" && (
            <section style={{ background: "#FEF9C3", border: "1px solid #FDE047", borderRadius: 8, marginBottom: 20, padding: "14px 18px" }}>
              <p style={{ color: "#854D0E", fontSize: 13, fontWeight: 750, margin: 0 }}>
                ⚠ El período está reabierto. Realiza las correcciones necesarias y luego ciérralo nuevamente.
              </p>
            </section>
          )}

          {/* Link a auditoría completa */}
          <section style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 18px" }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>
                ¿Necesitas ver el historial completo, registros de cierre o exportar trazabilidad?
              </p>
              <Link href="/panel" style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none", whiteSpace: "nowrap" }}>
                Ir a Auditoría completa →
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
