// src/app/admin/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

import { AdminReauthenticationModal } from "@/components/admin/AdminReauthenticationModal";
import { Logo } from "@/components/brand/Logo";
import {
  clearAdminReauthentication,
  getAdminReauthenticationHeaders,
} from "@/modules/admin/client/adminReauthenticationClient";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";
import { fonts, radius, shadows } from "@/styles/tokens";

type SubscriptionPlan = "BASICO" | "PERSONAL" | "PROFESIONAL" | "EMPRESA";
type SelectablePlan = Exclude<SubscriptionPlan, "EMPRESA">;
type UserStatus = "active" | "inactive" | "suspended";
type UserRole = "personal" | "contador" | "empresa" | "support" | "admin";
type CriticalAction = () => Promise<void>;

type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt: string | null;
  createdAt: string;
};

type AdminMetrics = {
  currency: "CLP";
  mrr: number;
  collectedThisMonth: number;
  activeBillingSubscriptions: number;
  pendingPayments: number;
  pastDueSubscriptions: number;
  planMrr: Record<string, number>;
  calculatedAt: string;
  source: "billing_subscriptions_and_payments";
};

type ApiResponse<T> = {
  ok: boolean;
  message?: string;
  data: T;
};

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  BASICO: "Gratuito",
  PERSONAL: "Personal",
  PROFESIONAL: "Profesional",
  EMPRESA: "Empresa (legado)",
};

const ROLE_LABELS: Record<UserRole, string> = {
  personal: "Cuenta personal",
  contador: "Contador",
  empresa: "Empresa (legado)",
  support: "Soporte limitado",
  admin: "Administrador",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
  suspended: "Suspendido",
};

const cardStyle: CSSProperties = {
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  borderRadius: radius.lg,
  boxShadow: shadows.sm,
  padding: 18,
};

const buttonStyle: CSSProperties = {
  border: "1px solid var(--border-strong)",
  borderRadius: radius.md,
  background: "var(--bg-elev)",
  color: "var(--text)",
  cursor: "pointer",
  fontFamily: fonts.body,
  fontSize: 12,
  fontWeight: 750,
  padding: "8px 11px",
};

function formatClp(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Sin vencimiento";
  return new Date(value).toLocaleDateString("es-CL");
}

function isExpired(value: string | null) {
  return Boolean(value && new Date(value).getTime() < Date.now());
}

function errorMessage(error: unknown, fallback: string) {
  return isHttpClientError(error) ? error.message || fallback : fallback;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SelectablePlan>("PERSONAL");
  const [daysToAdd, setDaysToAdd] = useState(30);
  const [pendingCriticalAction, setPendingCriticalAction] = useState<CriticalAction | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [usersResponse, metricsResponse] = await Promise.all([
        httpClient<ApiResponse<AdminUser[]>>("/api/admin/users"),
        httpClient<ApiResponse<AdminMetrics>>("/api/admin/metrics"),
      ]);

      setUsers(usersResponse.data ?? []);
      setMetrics(metricsResponse.data ?? null);
    } catch (currentError) {
      if (isHttpClientError(currentError) && currentError.status === 401) {
        router.push("/login");
        return;
      }

      setError(errorMessage(currentError, "No fue posible cargar el panel administrativo."));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const userSummary = useMemo(() => {
    const active = users.filter((user) => user.status === "active").length;
    const suspended = users.filter((user) => user.status === "suspended").length;
    const expired = users.filter((user) => isExpired(user.subscriptionExpiresAt)).length;

    return { total: users.length, active, suspended, expired };
  }, [users]);

  function queueCriticalAction(action: CriticalAction) {
    const headers = getAdminReauthenticationHeaders();

    if (!headers) {
      setPendingCriticalAction(() => action);
      return;
    }

    void action();
  }

  function criticalHeaders() {
    const headers = getAdminReauthenticationHeaders();
    if (!headers) {
      throw new Error("Reautenticación administrativa requerida.");
    }
    return headers;
  }

  function handleCriticalError(currentError: unknown, action: CriticalAction, fallback: string) {
    if (
      isHttpClientError(currentError) &&
      (currentError.code === "ADMIN_REAUTH_REQUIRED" || currentError.status === 428)
    ) {
      clearAdminReauthentication();
      setPendingCriticalAction(() => action);
      return;
    }

    setError(errorMessage(currentError, fallback));
  }

  async function toggleStatusAuthorized(user: AdminUser) {
    const status: UserStatus = user.status === "active" ? "suspended" : "active";
    const retry = () => toggleStatusAuthorized(user);
    setActionLoading(`status:${user.id}`);

    try {
      await httpClient<ApiResponse<AdminUser>>(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: criticalHeaders(),
        body: { status },
      });

      setUsers((current) =>
        current.map((item) => item.id === user.id ? { ...item, status } : item),
      );
      setToast(`Estado de ${user.email} actualizado.`);
    } catch (currentError) {
      handleCriticalError(currentError, retry, "No fue posible actualizar el estado.");
    } finally {
      setActionLoading(null);
    }
  }

  function openSubscriptionEditor(user: AdminUser) {
    setEditingUser(user);
    setSelectedPlan(user.subscriptionPlan === "EMPRESA" ? "PROFESIONAL" : user.subscriptionPlan);
    setDaysToAdd(30);
  }

  async function updateSubscriptionAuthorized() {
    if (!editingUser) return;
    const target = editingUser;
    const retry = () => updateSubscriptionAuthorized();
    setActionLoading(`subscription:${target.id}`);

    try {
      await httpClient<ApiResponse<AdminUser>>(
        `/api/admin/users/${target.id}/subscription`,
        {
          method: "PATCH",
          headers: criticalHeaders(),
          body: { plan: selectedPlan, daysToAdd },
        },
      );

      setEditingUser(null);
      setToast(`Suscripción de ${target.email} actualizada.`);
      await loadDashboard();
    } catch (currentError) {
      handleCriticalError(currentError, retry, "No fue posible actualizar la suscripción.");
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteUserAuthorized(user: AdminUser) {
    const retry = () => deleteUserAuthorized(user);
    setActionLoading(`delete:${user.id}`);

    try {
      await httpClient<ApiResponse<{ id: string }>>(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers: criticalHeaders(),
      });
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setToast(`Cuenta ${user.email} eliminada.`);
    } catch (currentError) {
      handleCriticalError(currentError, retry, "No fue posible eliminar la cuenta.");
    } finally {
      setActionLoading(null);
    }
  }

  function requestDelete(user: AdminUser) {
    const confirmed = window.confirm(
      `Esta acción eliminará la cuenta ${user.email}. ¿Deseas continuar?`,
    );
    if (!confirmed) return;

    queueCriticalAction(() => deleteUserAuthorized(user));
  }

  async function runPendingCriticalAction() {
    const action = pendingCriticalAction;
    setPendingCriticalAction(null);
    if (action) await action();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: fonts.body,
      }}
    >
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-elev)",
          padding: "14px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Logo variant="light" size="md" showSubtitle />
            <span style={{ color: "var(--text-soft)", fontSize: 12 }}>Administración</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => router.push("/admin/chat")} style={buttonStyle}>
              Chat de soporte
            </button>
            <button type="button" onClick={() => router.push("/panel")} style={buttonStyle}>
              Volver a la app
            </button>
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 1440, margin: "0 auto", padding: "30px 24px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: fonts.display, fontSize: 25 }}>
              Panel administrativo
            </h1>
            <p style={{ margin: "6px 0 0", color: "var(--text-soft)", fontSize: 13 }}>
              Usuarios, suscripciones y métricas provenientes de facturación real.
            </p>
          </div>
          <button type="button" onClick={() => void loadDashboard()} style={buttonStyle}>
            Actualizar
          </button>
        </div>

        {error ? (
          <div style={{ ...cardStyle, borderColor: "var(--loss)", marginBottom: 18, color: "var(--loss)" }}>
            {error}
          </div>
        ) : null}

        {toast ? (
          <div style={{ ...cardStyle, borderColor: "var(--accent)", marginBottom: 18 }}>
            {toast}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 12,
            marginBottom: 22,
          }}
        >
          {[
            ["Usuarios", userSummary.total, `${userSummary.active} activos`],
            ["Suspendidos", userSummary.suspended, "requieren revisión"],
            ["Suscripciones vencidas", userSummary.expired, "modo solo lectura"],
            ["MRR contractual", metrics ? formatClp(metrics.mrr) : "—", `${metrics?.activeBillingSubscriptions ?? 0} suscripciones`],
            ["Recaudado este mes", metrics ? formatClp(metrics.collectedThisMonth) : "—", "pagos aprobados/autorizados"],
            ["Cobranza pendiente", metrics?.pendingPayments ?? "—", `${metrics?.pastDueSubscriptions ?? 0} morosas`],
          ].map(([label, value, detail]) => (
            <article key={String(label)} style={cardStyle}>
              <div style={{ color: "var(--text-soft)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 850, marginTop: 8 }}>{value}</div>
              <div style={{ color: "var(--text-faint)", fontSize: 12, marginTop: 4 }}>{detail}</div>
            </article>
          ))}
        </div>

        <section style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
            <strong>Usuarios</strong>
            <span style={{ color: "var(--text-soft)", fontSize: 12, marginLeft: 8 }}>
              Las acciones críticas requieren contraseña y 2FA. Empresa se conserva únicamente como plan legado.
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 30, color: "var(--text-soft)" }}>Cargando información…</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
                <thead>
                  <tr style={{ background: "var(--bg-sunken)", textAlign: "left" }}>
                    {["Usuario", "Cuenta", "Plan", "Estado", "Vencimiento", "Registro", "Acciones"].map((label) => (
                      <th key={label} style={{ padding: "11px 14px", fontSize: 11, color: "var(--text-soft)" }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const expired = isExpired(user.subscriptionExpiresAt);
                    const immutableAdmin = user.role === "admin";
                    return (
                      <tr key={user.id} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 750 }}>{user.fullName}</div>
                          <div style={{ color: "var(--text-soft)", fontSize: 12 }}>{user.email}</div>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 12 }}>{ROLE_LABELS[user.role]}</td>
                        <td style={{ padding: "12px 14px", fontSize: 12 }}>{PLAN_LABELS[user.subscriptionPlan]}</td>
                        <td style={{ padding: "12px 14px", fontSize: 12 }}>
                          {STATUS_LABELS[user.status]}{expired ? " · Solo lectura" : ""}
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 12 }}>{formatDate(user.subscriptionExpiresAt)}</td>
                        <td style={{ padding: "12px 14px", fontSize: 12 }}>{formatDate(user.createdAt)}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              style={buttonStyle}
                              disabled={Boolean(actionLoading) || immutableAdmin}
                              onClick={() => openSubscriptionEditor(user)}
                            >
                              Suscripción
                            </button>
                            <button
                              type="button"
                              style={buttonStyle}
                              disabled={Boolean(actionLoading) || immutableAdmin}
                              onClick={() => queueCriticalAction(() => toggleStatusAuthorized(user))}
                            >
                              {actionLoading === `status:${user.id}` ? "Procesando…" : user.status === "active" ? "Suspender" : "Activar"}
                            </button>
                            <button
                              type="button"
                              style={{ ...buttonStyle, color: "var(--loss)" }}
                              disabled={Boolean(actionLoading) || immutableAdmin}
                              onClick={() => requestDelete(user)}
                            >
                              {actionLoading === `delete:${user.id}` ? "Eliminando…" : "Eliminar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {editingUser ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.62)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 100,
          }}
        >
          <div style={{ ...cardStyle, width: "min(440px, 100%)", padding: 24 }}>
            <h2 style={{ margin: 0, fontFamily: fonts.display, fontSize: 20 }}>Actualizar suscripción</h2>
            <p style={{ color: "var(--text-soft)", fontSize: 13 }}>{editingUser.email}</p>

            <label style={{ display: "grid", gap: 6, marginTop: 16, fontSize: 12 }}>
              Plan
              <select
                value={selectedPlan}
                onChange={(event) => setSelectedPlan(event.target.value as SelectablePlan)}
                style={{ ...buttonStyle, width: "100%" }}
              >
                <option value="BASICO">Gratuito</option>
                <option value="PERSONAL">Personal</option>
                <option value="PROFESIONAL">Profesional</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 6, marginTop: 14, fontSize: 12 }}>
              Días de vigencia
              <input
                type="number"
                min={1}
                max={366}
                value={daysToAdd}
                onChange={(event) => setDaysToAdd(Math.max(1, Number(event.target.value) || 1))}
                style={{ ...buttonStyle, width: "100%" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button type="button" style={buttonStyle} onClick={() => setEditingUser(null)}>
                Cancelar
              </button>
              <button
                type="button"
                style={{ ...buttonStyle, background: "var(--accent)", color: "var(--accent-contrast)" }}
                disabled={Boolean(actionLoading)}
                onClick={() => queueCriticalAction(updateSubscriptionAuthorized)}
              >
                {actionLoading === `subscription:${editingUser.id}` ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingCriticalAction ? (
        <AdminReauthenticationModal
          onAuthenticated={runPendingCriticalAction}
          onClose={() => setPendingCriticalAction(null)}
        />
      ) : null}
    </main>
  );
}
