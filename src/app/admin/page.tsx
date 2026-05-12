// src/app/admin/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { colors, fonts, shadows } from "@/styles/tokens";

type SubscriptionPlan = "BASICO" | "PROFESIONAL" | "EMPRESA";
type UserStatus       = "active" | "inactive" | "suspended";
type UserRole         = "personal" | "contador" | "empresa" | "admin";

interface AdminUser {
  id:                     string;
  email:                  string;
  fullName:               string;
  role:                   UserRole;
  status:                 UserStatus;
  subscriptionPlan:       SubscriptionPlan;
  subscriptionExpiresAt:  string | null;
  createdAt:              string;
}

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  BASICO:      "Básico",
  PROFESIONAL: "Profesional",
  EMPRESA:     "Empresa",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active:    "Activo",
  inactive:  "Inactivo",
  suspended: "Suspendido",
};

const STATUS_COLORS: Record<UserStatus, string> = {
  active:    "#16A34A",
  inactive:  "#94A3B8",
  suspended: "#EF4444",
};

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function daysLeft(expiresAt: string | null): string {
  if (!expiresAt) return "Sin configurar";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff < 0) return "Vencida";
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `${days} días`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default function AdminPage() {
  const router = useRouter();
  const [users,             setUsers]             = useState<AdminUser[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState<string | null>(null);
  const [actionLoading,     setActionLoading]     = useState<string | null>(null);
  const [confirmDelete,     setConfirmDelete]     = useState<AdminUser | null>(null);
  const [editSubscription,  setEditSubscription]  = useState<AdminUser | null>(null);
  const [selectedPlan,      setSelectedPlan]      = useState<SubscriptionPlan>("BASICO");
  const [daysToAdd,         setDaysToAdd]         = useState(30);
  const [toast,             setToast]             = useState<{ message: string; ok: boolean } | null>(null);

  function showToast(message: string, ok: boolean) {
    setToast({ message, ok });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await fetch("/api/admin/users");
      if (res.status === 403 || res.status === 401) { router.push("/portafolio"); return; }
      const data = await res.json();
      if (data.ok) setUsers(data.data);
      else setError(data.message);
    } catch {
      setError("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleDelete(user: AdminUser) {
    setActionLoading(user.id);
    try {
      const res  = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) { showToast(data.message, true); setUsers((prev) => prev.filter((u) => u.id !== user.id)); }
      else showToast(data.message, false);
    } catch { showToast("Error al eliminar usuario", false); }
    finally { setActionLoading(null); setConfirmDelete(null); }
  }

  async function handleStatusToggle(user: AdminUser) {
    const newStatus: UserStatus = user.status === "active" ? "suspended" : "active";
    setActionLoading(user.id + "_status");
    try {
      const res  = await fetch(`/api/admin/users/${user.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      const data = await res.json();
      if (data.ok) { showToast(data.message, true); setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))); }
      else showToast(data.message, false);
    } catch { showToast("Error al cambiar estado", false); }
    finally { setActionLoading(null); }
  }

  async function handleUpdateSubscription() {
    if (!editSubscription) return;
    setActionLoading(editSubscription.id + "_sub");
    try {
      const res  = await fetch(`/api/admin/users/${editSubscription.id}/subscription`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: selectedPlan, daysToAdd }) });
      const data = await res.json();
      if (data.ok) { showToast(data.message, true); await fetchUsers(); }
      else showToast(data.message, false);
    } catch { showToast("Error al actualizar suscripción", false); }
    finally { setActionLoading(null); setEditSubscription(null); }
  }

  const totalUsers   = users.length;
  const activeUsers  = users.filter((u) => u.status === "active").length;
  const expiredUsers = users.filter((u) => isExpired(u.subscriptionExpiresAt)).length;

  return (
    <div style={{ minHeight: "100vh", background: colors.bgApp, fontFamily: fonts.body }}>

      {/* Header */}
      <header style={{ background: colors.primary, borderBottom: `1px solid ${colors.borderDark}`, padding: "0 32px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Logo variant="light" size="md" showSubtitle />
            <span style={{ fontSize: "12px", color: "#475569", background: "#1e3a52", padding: "2px 10px", borderRadius: "20px" }}>
              Admin
            </span>
          </div>
          <button
            onClick={() => router.push("/portafolio")}
            style={{ background: "transparent", border: `1px solid ${colors.borderDark}`, borderRadius: "8px", color: colors.textMuted, fontSize: "14px", padding: "8px 16px", cursor: "pointer", fontFamily: fonts.body }}
          >
            ← Volver a la app
          </button>
        </div>
      </header>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 32px" }}>

        {/* ── Título — alineado con el resto de módulos ── */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: "20px", fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>
            Panel de Administración
          </h1>
          <p style={{ fontSize: "14px", color: colors.textSecondary, margin: 0 }}>
            Gestión de usuarios y suscripciones
          </p>
        </div>

        {/* Métricas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Total usuarios",         value: totalUsers,   color: colors.primary },
            { label: "Cuentas activas",        value: activeUsers,  color: colors.accent  },
            { label: "Suscripciones vencidas", value: expiredUsers, color: colors.danger  },
          ].map((m) => (
            <div key={m.label} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "24px" }}>
              <p style={{ fontSize: "13px", color: colors.textMuted, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</p>
              <p style={{ fontSize: "32px", fontWeight: 700, color: m.color, margin: 0, fontFamily: fonts.display }}>{loading ? "—" : m.value}</p>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
              Usuarios ({totalUsers})
            </h2>
          </div>

          {loading  && <div style={{ padding: "48px", textAlign: "center", color: colors.textMuted }}>Cargando usuarios...</div>}
          {error    && <div style={{ padding: "48px", textAlign: "center", color: colors.danger }}>{error}</div>}
          {!loading && !error && users.length === 0 && <div style={{ padding: "48px", textAlign: "center", color: colors.textMuted }}>No hay usuarios registrados</div>}

          {!loading && !error && users.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: colors.surfaceAlt }}>
                    {["Usuario", "Rol", "Estado", "Plan", "Suscripción", "Registro", "Acciones"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${colors.border}` }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <p style={{ fontSize: "14px", fontWeight: 500, color: colors.textPrimary, margin: "0 0 2px" }}>{user.fullName}</p>
                        <p style={{ fontSize: "12px", color: colors.textMuted, margin: 0 }}>{user.email}</p>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: "12px", background: "#F1F5F9", color: colors.textSecondary, padding: "3px 10px", borderRadius: "20px", textTransform: "capitalize" }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: "12px", color: STATUS_COLORS[user.status], fontWeight: 500 }}>
                          ● {STATUS_LABELS[user.status]}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: "13px", color: "#334155" }}>{PLAN_LABELS[user.subscriptionPlan]}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: "13px", color: isExpired(user.subscriptionExpiresAt) ? colors.danger : colors.accent, fontWeight: 500 }}>
                          {daysLeft(user.subscriptionExpiresAt)}
                        </span>
                        {user.subscriptionExpiresAt && (
                          <p style={{ fontSize: "11px", color: colors.textMuted, margin: "2px 0 0" }}>{formatDate(user.subscriptionExpiresAt)}</p>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: "13px", color: colors.textSecondary }}>{formatDate(user.createdAt)}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {user.role !== "admin" ? (
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button onClick={() => { setEditSubscription(user); setSelectedPlan(user.subscriptionPlan); setDaysToAdd(30); }} disabled={actionLoading === user.id + "_sub"} style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "6px", border: `1px solid ${colors.border}`, background: "transparent", color: colors.textSecondary, cursor: "pointer", fontFamily: fonts.body }}>
                              Suscripción
                            </button>
                            <button onClick={() => handleStatusToggle(user)} disabled={actionLoading === user.id + "_status"} style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "6px", border: "none", background: user.status === "active" ? "rgba(239,68,68,0.08)" : "rgba(22,163,74,0.08)", color: user.status === "active" ? colors.danger : colors.accent, cursor: "pointer", fontFamily: fonts.body, fontWeight: 500 }}>
                              {user.status === "active" ? "Suspender" : "Activar"}
                            </button>
                            <button onClick={() => setConfirmDelete(user)} disabled={actionLoading === user.id} style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "6px", border: "none", background: "rgba(239,68,68,0.08)", color: colors.danger, cursor: "pointer", fontFamily: fonts.body, fontWeight: 500 }}>
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "12px", color: colors.textMuted }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal — Confirmar eliminación */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "32px" }}>
          <div style={{ background: colors.surface, borderRadius: "16px", padding: "40px", maxWidth: "440px", width: "100%" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: colors.textPrimary, margin: "0 0 12px" }}>¿Eliminar usuario?</h2>
            <p style={{ fontSize: "15px", color: colors.textSecondary, margin: "0 0 8px" }}>Esta acción es irreversible. Se eliminarán todos los datos de:</p>
            <p style={{ fontSize: "15px", fontWeight: 600, color: colors.danger, margin: "0 0 32px" }}>{confirmDelete.email}</p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: `1px solid ${colors.border}`, background: "transparent", color: colors.textSecondary, fontSize: "14px", cursor: "pointer", fontFamily: fonts.body }}>Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={actionLoading === confirmDelete.id} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: colors.danger, color: "#ffffff", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: fonts.body }}>
                {actionLoading === confirmDelete.id ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Editar suscripción */}
      {editSubscription && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "32px" }}>
          <div style={{ background: colors.surface, borderRadius: "16px", padding: "40px", maxWidth: "440px", width: "100%" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: colors.textPrimary, margin: "0 0 6px" }}>Actualizar suscripción</h2>
            <p style={{ fontSize: "14px", color: colors.textMuted, margin: "0 0 28px" }}>{editSubscription.email}</p>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "8px" }}>Plan</label>
            <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value as SubscriptionPlan)} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${colors.border}`, fontSize: "14px", color: colors.textPrimary, marginBottom: "20px", fontFamily: fonts.body, background: colors.surface }}>
              <option value="BASICO">Básico → personal</option>
              <option value="PROFESIONAL">Profesional → contador</option>
              <option value="EMPRESA">Empresa → empresa</option>
            </select>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "8px" }}>Días a agregar</label>
            <input type="number" min={1} max={365} value={daysToAdd} onChange={(e) => setDaysToAdd(Number(e.target.value))} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${colors.border}`, fontSize: "14px", color: colors.textPrimary, marginBottom: "28px", fontFamily: fonts.body, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setEditSubscription(null)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: `1px solid ${colors.border}`, background: "transparent", color: colors.textSecondary, fontSize: "14px", cursor: "pointer", fontFamily: fonts.body }}>Cancelar</button>
              <button onClick={handleUpdateSubscription} disabled={actionLoading === editSubscription.id + "_sub"} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: colors.accent, color: "#ffffff", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: fonts.body }}>
                {actionLoading === editSubscription.id + "_sub" ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "32px", right: "32px", background: toast.ok ? colors.accent : colors.danger, color: "#ffffff", padding: "14px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: 500, zIndex: 200, boxShadow: shadows.md, maxWidth: "360px" }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}