// src/app/admin/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/brand/Logo";
import { colors, fonts, radius, shadows } from "@/styles/tokens";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";

type SubscriptionPlan = "BASICO" | "PROFESIONAL" | "EMPRESA";
type UserStatus = "active" | "inactive" | "suspended";
type UserRole = "personal" | "contador" | "empresa" | "admin";

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt: string | null;
  createdAt: string;
}

type AdminUsersResponse = {
  ok: boolean;
  message?: string;
  data: AdminUser[];
};

type MutationResponse<T = unknown> = {
  ok: boolean;
  message?: string;
  data?: T;
};

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  BASICO: "Básico",
  PROFESIONAL: "Profesional",
  EMPRESA: "Empresa",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
  suspended: "Suspendido",
};

const STATUS_COLORS: Record<UserStatus, string> = {
  active: "#16A34A",
  inactive: "#94A3B8",
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
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (!isHttpClientError(error)) {
    return fallback;
  }

  if (error.status === 429 && error.retryAfterSeconds) {
    return `Demasiadas solicitudes. Intenta nuevamente en ${error.retryAfterSeconds} segundos.`;
  }

  return error.message || fallback;
}

export default function AdminPage() {
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [editSubscription, setEditSubscription] = useState<AdminUser | null>(
    null,
  );
  const [selectedPlan, setSelectedPlan] =
    useState<SubscriptionPlan>("BASICO");
  const [daysToAdd, setDaysToAdd] = useState(30);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(
    null,
  );

  function showToast(message: string, ok: boolean) {
    setToast({ message, ok });
    setTimeout(() => setToast(null), 3500);
  }

  function handleHttpError(error: unknown, fallback: string) {
    if (isHttpClientError(error)) {
      if (error.status === 401) {
        router.push("/login");
        return;
      }

      if (error.status === 402) {
        router.push("/blocked");
        return;
      }

      if (error.status === 403) {
        setError("Acceso denegado. Se requiere rol administrador.");
        return;
      }

      setError(resolveErrorMessage(error, fallback));
      return;
    }

    setError(fallback);
  }

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await httpClient<AdminUsersResponse>("/api/admin/users");

      setUsers(response.data ?? []);
    } catch (err) {
      handleHttpError(err, "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  async function handleDelete(user: AdminUser) {
    setActionLoading(user.id);

    try {
      const response = await httpClient<MutationResponse>(
        `/api/admin/users/${user.id}`,
        {
          method: "DELETE",
        },
      );

      showToast(response.message ?? "Usuario eliminado correctamente.", true);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
    } catch (err) {
      showToast(resolveErrorMessage(err, "Error al eliminar usuario"), false);
    } finally {
      setActionLoading(null);
      setConfirmDelete(null);
    }
  }

  async function handleStatusToggle(user: AdminUser) {
    const newStatus: UserStatus =
      user.status === "active" ? "suspended" : "active";

    setActionLoading(`${user.id}_status`);

    try {
      const response = await httpClient<MutationResponse<AdminUser>>(
        `/api/admin/users/${user.id}/status`,
        {
          method: "PATCH",
          body: {
            status: newStatus,
          },
        },
      );

      showToast(response.message ?? "Estado actualizado correctamente.", true);

      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, status: newStatus } : item,
        ),
      );
    } catch (err) {
      showToast(resolveErrorMessage(err, "Error al cambiar estado"), false);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUpdateSubscription() {
    if (!editSubscription) return;

    setActionLoading(`${editSubscription.id}_sub`);

    try {
      const response = await httpClient<MutationResponse<AdminUser>>(
        `/api/admin/users/${editSubscription.id}/subscription`,
        {
          method: "PATCH",
          body: {
            plan: selectedPlan,
            daysToAdd,
          },
        },
      );

      showToast(
        response.message ?? "Suscripción actualizada correctamente.",
        true,
      );

      await fetchUsers();
    } catch (err) {
      showToast(
        resolveErrorMessage(err, "Error al actualizar suscripción"),
        false,
      );
    } finally {
      setActionLoading(null);
      setEditSubscription(null);
    }
  }

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.status === "active").length;
  const expiredUsers = users.filter((user) =>
    isExpired(user.subscriptionExpiresAt),
  ).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bgApp,
        fontFamily: fonts.body,
      }}
    >
      <header
        style={{
          background: colors.primary,
          borderBottom: `1px solid ${colors.borderDark}`,
          padding: "0 32px",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Logo variant="light" size="md" showSubtitle />
            <span
              style={{
                fontSize: "12px",
                color: "#475569",
                background: "#1e3a52",
                padding: "2px 10px",
                borderRadius: "20px",
              }}
            >
              Admin
            </span>
          </div>

          <button
            onClick={() => router.push("/portafolio")}
            style={{
              background: "transparent",
              border: `1px solid ${colors.borderDark}`,
              borderRadius: "8px",
              color: colors.textMuted,
              fontSize: "14px",
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: fonts.body,
            }}
          >
            ← Volver a la app
          </button>
        </div>
      </header>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 32px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: "20px",
              fontWeight: 700,
              color: colors.textPrimary,
              margin: "0 0 4px",
            }}
          >
            Panel de Administración
          </h1>

          <p style={{ fontSize: "14px", color: colors.textSecondary, margin: 0 }}>
            Gestión de usuarios y suscripciones
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {[
            { label: "Total usuarios", value: totalUsers, color: colors.primary },
            { label: "Cuentas activas", value: activeUsers, color: colors.accent },
            {
              label: "Suscripciones vencidas",
              value: expiredUsers,
              color: colors.danger,
            },
          ].map((metric) => (
            <div
              key={metric.label}
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: "12px",
                padding: "24px",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  color: colors.textMuted,
                  margin: "0 0 8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {metric.label}
              </p>

              <p
                style={{
                  fontSize: "32px",
                  fontWeight: 700,
                  color: metric.color,
                  margin: 0,
                  fontFamily: fonts.display,
                }}
              >
                {loading ? "—" : metric.value}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: colors.textPrimary,
                margin: 0,
              }}
            >
              Usuarios ({totalUsers})
            </h2>
          </div>

          {loading && (
            <div
              style={{
                padding: "48px",
                textAlign: "center",
                color: colors.textMuted,
              }}
            >
              Cargando usuarios...
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "48px",
                textAlign: "center",
                color: colors.danger,
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <div
              style={{
                padding: "48px",
                textAlign: "center",
                color: colors.textMuted,
              }}
            >
              No hay usuarios registrados
            </div>
          )}

          {!loading && !error && users.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: colors.surfaceAlt }}>
                    {[
                      "Usuario",
                      "Rol",
                      "Estado",
                      "Plan",
                      "Suscripción",
                      "Registro",
                      "Acciones",
                    ].map((header) => (
                      <th
                        key={header}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: colors.textSecondary,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: `1px solid ${colors.border}`,
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      style={{ borderBottom: "1px solid #F1F5F9" }}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <p
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: colors.textPrimary,
                            margin: "0 0 2px",
                          }}
                        >
                          {user.fullName}
                        </p>
                        <p
                          style={{
                            fontSize: "12px",
                            color: colors.textMuted,
                            margin: 0,
                          }}
                        >
                          {user.email}
                        </p>
                      </td>

                      <td style={{ padding: "14px 16px" }}>{user.role}</td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            fontSize: "12px",
                            color: STATUS_COLORS[user.status],
                            fontWeight: 500,
                          }}
                        >
                          ● {STATUS_LABELS[user.status]}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        {PLAN_LABELS[user.subscriptionPlan]}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            color: isExpired(user.subscriptionExpiresAt)
                              ? colors.danger
                              : colors.accent,
                            fontWeight: 500,
                          }}
                        >
                          {daysLeft(user.subscriptionExpiresAt)}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        {formatDate(user.createdAt)}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        {user.role !== "admin" ? (
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              onClick={() => { setEditSubscription(user); setSelectedPlan(user.subscriptionPlan); setDaysToAdd(30); }}
                              disabled={actionLoading === `${user.id}_sub`}
                              style={{ background: colors.surface, color: colors.textSecondary, border: `1px solid ${colors.border}`, borderRadius: radius.sm, padding: "5px 12px", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: fonts.body }}
                            >
                              Suscripción
                            </button>

                            <button
                              onClick={() => handleStatusToggle(user)}
                              disabled={actionLoading === `${user.id}_status`}
                              style={{ background: user.status === "active" ? colors.warningMuted : colors.accentMuted, color: user.status === "active" ? colors.warningHover : colors.accentHover, border: `1px solid ${user.status === "active" ? colors.warning : colors.accent}`, borderRadius: radius.sm, padding: "5px 12px", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: fonts.body }}
                            >
                              {user.status === "active" ? "Suspender" : "Activar"}
                            </button>

                            <button
                              onClick={() => setConfirmDelete(user)}
                              disabled={actionLoading === user.id}
                              style={{ background: colors.dangerMuted, color: colors.dangerHover, border: `1px solid ${colors.danger}`, borderRadius: radius.sm, padding: "5px 12px", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: fonts.body }}
                            >
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          "—"
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

      {confirmDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "32px",
          }}
        >
          <div
            style={{
              background: colors.surface,
              borderRadius: radius.xl,
              padding: "32px",
              maxWidth: "440px",
              width: "100%",
              boxShadow: shadows.lg,
            }}
          >
            <h2 style={{ fontFamily: fonts.display, fontSize: "18px", fontWeight: 700, color: colors.textPrimary, margin: "0 0 8px" }}>
              ¿Eliminar usuario?
            </h2>
            <p style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.textSecondary, margin: "0 0 4px" }}>
              Esta acción es irreversible.
            </p>
            <p style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.textMuted, margin: "0 0 24px" }}>
              {confirmDelete.email}
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ background: colors.surface, color: colors.textSecondary, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: "8px 18px", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: fonts.body }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{ background: colors.danger, color: "#ffffff", border: "none", borderRadius: radius.md, padding: "8px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: fonts.body }}
              >
                {actionLoading === confirmDelete.id ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editSubscription && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "32px",
          }}
        >
          <div
            style={{
              background: colors.surface,
              borderRadius: radius.xl,
              padding: "32px",
              maxWidth: "440px",
              width: "100%",
              boxShadow: shadows.lg,
            }}
          >
            <h2 style={{ fontFamily: fonts.display, fontSize: "18px", fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>
              Actualizar suscripción
            </h2>
            <p style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.textMuted, margin: "0 0 24px" }}>
              {editSubscription.email}
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontFamily: fonts.body, fontSize: "12px", fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                Plan
              </label>
              <select
                value={selectedPlan}
                onChange={(event) => setSelectedPlan(event.target.value as SubscriptionPlan)}
                style={{ width: "100%", fontFamily: fonts.body, fontSize: "14px", color: colors.textPrimary, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: "8px 12px", outline: "none" }}
              >
                <option value="BASICO">Básico</option>
                <option value="PROFESIONAL">Profesional</option>
                <option value="EMPRESA">Empresa</option>
              </select>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontFamily: fonts.body, fontSize: "12px", fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                Días a agregar
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={daysToAdd}
                onChange={(event) => setDaysToAdd(Number(event.target.value))}
                style={{ width: "100%", fontFamily: fonts.body, fontSize: "14px", color: colors.textPrimary, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: "8px 12px", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setEditSubscription(null)}
                style={{ background: colors.surface, color: colors.textSecondary, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: "8px 18px", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: fonts.body }}
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateSubscription}
                style={{ background: colors.accent, color: "#ffffff", border: "none", borderRadius: radius.md, padding: "8px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: fonts.body }}
              >
                {actionLoading === `${editSubscription.id}_sub` ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            background: toast.ok ? colors.accent : colors.danger,
            color: "#ffffff",
            padding: "14px 20px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 500,
            zIndex: 200,
            boxShadow: shadows.md,
            maxWidth: "360px",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}