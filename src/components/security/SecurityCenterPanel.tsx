"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import TwoFASetupPanel from "@/components/auth/TwoFASetupPanel";
import { useAuth } from "@/modules/identity/client/authContext";
import { fonts } from "@/styles/tokens";

type SecuritySession = {
  id: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

type SecurityStatus = {
  account: {
    status: string;
  };
  email: {
    address: string;
    verified: boolean;
  };
  twoFactor: {
    enabled: boolean;
  };
  sessions: SecuritySession[];
};

type StatusTone = "ok" | "warn" | "info" | "neutral" | "error";

type SecurityStatusRowProps = {
  title: string;
  status: string;
  detail: string;
  tone: StatusTone;
  action?: ReactNode;
};

const toneStyles: Record<StatusTone, { background: string; border: string; icon: string; badge: string }> = {
  ok: {
    background: "rgba(22,163,74,0.06)",
    border: "rgba(22,163,74,0.18)",
    icon: "var(--accent)",
    badge: "var(--accent)",
  },
  warn: {
    background: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.2)",
    icon: "var(--warn)",
    badge: "var(--warn)",
  },
  info: {
    background: "rgba(14,165,233,0.06)",
    border: "rgba(14,165,233,0.18)",
    icon: "var(--accent)",
    badge: "var(--accent)",
  },
  neutral: {
    background: "var(--bg-sunken)",
    border: "var(--border)",
    icon: "var(--text-soft)",
    badge: "var(--text-soft)",
  },
  error: {
    background: "rgba(220,38,38,0.06)",
    border: "rgba(220,38,38,0.2)",
    icon: "var(--loss)",
    badge: "var(--loss)",
  },
};

function statusIcon(tone: StatusTone) {
  if (tone === "ok") return "✓";
  if (tone === "warn") return "!";
  if (tone === "error") return "×";
  if (tone === "info") return "i";
  return "•";
}

function SecurityStatusRow({ title, status, detail, tone, action }: SecurityStatusRowProps) {
  const style = toneStyles[tone];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr) auto",
        alignItems: "center",
        gap: "12px",
        padding: "14px",
        background: style.background,
        border: `1px solid ${style.border}`,
        borderRadius: "10px",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "999px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: style.icon,
          border: `1px solid ${style.border}`,
          fontSize: "13px",
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {statusIcon(tone)}
      </span>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
          <span style={{ color: "var(--text)", fontSize: "13px", fontWeight: 700 }}>{title}</span>
          <span
            style={{
              color: style.badge,
              border: `1px solid ${style.border}`,
              borderRadius: "999px",
              padding: "2px 7px",
              fontSize: "10px",
              lineHeight: 1.4,
              fontWeight: 800,
              letterSpacing: "0.03em",
            }}
          >
            {status}
          </span>
        </div>
        <p style={{ color: "var(--text-soft)", fontSize: "12px", lineHeight: 1.5, margin: 0 }}>{detail}</p>
      </div>

      {action ? <div style={{ justifySelf: "end" }}>{action}</div> : null}
    </div>
  );
}

function formatDateTime(value: string | undefined) {
  if (!value) return "Sin fecha disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha disponible";
  return date.toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function readCsrfCookie() {
  if (typeof document === "undefined") return "";
  return document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("ledgera_csrf="))
    ?.split("=")[1] ?? "";
}

const secondaryButtonStyle = {
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text)",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: 700,
  fontFamily: fonts.body,
} as const;

export default function SecurityCenterPanel() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const [closingSessions, setClosingSessions] = useState(false);
  const [notice, setNotice] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/security/status", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.message ?? "No fue posible verificar la seguridad de la cuenta.");
      }

      setStatus(payload.data as SecurityStatus);
    } catch (loadError) {
      setStatus(null);
      setError(loadError instanceof Error ? loadError.message : "No fue posible verificar la seguridad de la cuenta.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus, user?.twoFactorEnabled, user?.email]);

  const currentSession = useMemo(
    () => status?.sessions.find((session) => session.isCurrent),
    [status],
  );

  const securityLevel = useMemo(() => {
    if (!status) return { label: "Sin verificar", tone: "neutral" as StatusTone };
    if (status.twoFactor.enabled && status.email.verified) {
      return { label: "Reforzado", tone: "ok" as StatusTone };
    }
    if (status.twoFactor.enabled || status.email.verified) {
      return { label: "Intermedio", tone: "info" as StatusTone };
    }
    return { label: "Básico", tone: "warn" as StatusTone };
  }, [status]);

  async function closeOtherSessions() {
    setClosingSessions(true);
    setError("");
    setNotice("");

    try {
      await fetch("/api/csrf", {
        credentials: "include",
        cache: "no-store",
      });

      const response = await fetch("/api/sessions", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "x-ledgera-csrf": readCsrfCookie(),
        },
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message ?? "No fue posible cerrar las otras sesiones.");
      }

      const deletedCount = Number(payload?.data?.deletedCount ?? 0);
      setNotice(
        deletedCount > 0
          ? `${deletedCount} sesión${deletedCount === 1 ? "" : "es"} secundaria${deletedCount === 1 ? "" : "s"} cerrada${deletedCount === 1 ? "" : "s"}.`
          : "No había otras sesiones activas.",
      );
      await loadStatus();
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : "No fue posible cerrar las otras sesiones.");
    } finally {
      setClosingSessions(false);
    }
  }

  const levelStyle = toneStyles[securityLevel.tone];

  return (
    <div style={{ display: "grid", gap: "1rem", marginBottom: "1rem" }}>
      <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ fontFamily: fonts.display, fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>
              Estado de seguridad
            </h3>
            <p style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--text-soft)", margin: 0 }}>
              Los indicadores se verifican directamente en el servidor. Ningún control se marca como activo por defecto.
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ display: "block", color: "var(--text-soft)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
              Nivel de seguridad
            </span>
            <span style={{ color: levelStyle.badge, border: `1px solid ${levelStyle.border}`, background: levelStyle.background, borderRadius: "999px", padding: "5px 10px", fontSize: "12px", fontWeight: 800 }}>
              {loading ? "Verificando…" : securityLevel.label}
            </span>
          </div>
        </div>

        {error ? (
          <div role="alert" style={{ marginBottom: "12px", padding: "11px 12px", borderRadius: "8px", border: "1px solid rgba(220,38,38,0.2)", background: "rgba(220,38,38,0.06)", color: "var(--loss)", fontSize: "12px", fontWeight: 600 }}>
            {error}
          </div>
        ) : null}

        {notice ? (
          <div role="status" style={{ marginBottom: "12px", padding: "11px 12px", borderRadius: "8px", border: "1px solid rgba(22,163,74,0.18)", background: "rgba(22,163,74,0.06)", color: "var(--accent)", fontSize: "12px", fontWeight: 600 }}>
            {notice}
          </div>
        ) : null}

        <div style={{ display: "grid", gap: "10px" }}>
          {loading ? (
            <>
              <SecurityStatusRow title="Verificación en dos pasos" status="Verificando" detail="Consultando el estado real de la cuenta." tone="neutral" />
              <SecurityStatusRow title="Correo electrónico" status="Verificando" detail="Consultando la verificación de identidad de acceso." tone="neutral" />
              <SecurityStatusRow title="Sesiones activas" status="Verificando" detail="Consultando las sesiones vigentes." tone="neutral" />
            </>
          ) : status ? (
            <>
              <SecurityStatusRow
                title="Verificación en dos pasos"
                status={status.twoFactor.enabled ? "Activa" : "No configurada"}
                detail={
                  status.twoFactor.enabled
                    ? "La cuenta tiene un segundo factor TOTP verificado."
                    : "Añade una aplicación de autenticación para proteger el acceso y las operaciones sensibles."
                }
                tone={status.twoFactor.enabled ? "ok" : "warn"}
                action={
                  status.twoFactor.enabled ? null : (
                    <button
                      type="button"
                      onClick={() => setShowSetup((visible) => !visible)}
                      style={{
                        ...secondaryButtonStyle,
                        cursor: "pointer",
                        color: "var(--warn)",
                        borderColor: "rgba(245,158,11,0.28)",
                      }}
                    >
                      {showSetup ? "Ocultar" : "Activar 2FA"}
                    </button>
                  )
                }
              />

              <SecurityStatusRow
                title="Correo electrónico"
                status={status.email.verified ? "Verificado" : "Pendiente"}
                detail={status.email.verified ? status.email.address : `${status.email.address} aún no registra verificación.`}
                tone={status.email.verified ? "ok" : "warn"}
              />

              <SecurityStatusRow
                title="Sesiones activas"
                status={`${status.sessions.length} activa${status.sessions.length === 1 ? "" : "s"}`}
                detail={
                  currentSession
                    ? `Sesión actual vigente hasta ${formatDateTime(currentSession.expiresAt)}.`
                    : "No fue posible identificar la sesión actual."
                }
                tone={status.sessions.length > 0 ? "info" : "error"}
              />
            </>
          ) : (
            <SecurityStatusRow title="Estado no disponible" status="Error" detail="La plataforma no pudo acreditar los controles de seguridad." tone="error" />
          )}
        </div>
      </section>

      {status && !status.twoFactor.enabled && showSetup ? <TwoFASetupPanel /> : null}

      {status ? (
        <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontFamily: fonts.display, fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>
                Sesiones de la cuenta
              </h3>
              <p style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--text-soft)", margin: 0 }}>
                Revisa la fecha de creación y vencimiento de cada sesión vigente.
              </p>
            </div>

            <button
              type="button"
              onClick={closeOtherSessions}
              disabled={closingSessions || status.sessions.length <= 1}
              style={{
                ...secondaryButtonStyle,
                cursor: closingSessions || status.sessions.length <= 1 ? "not-allowed" : "pointer",
                opacity: closingSessions || status.sessions.length <= 1 ? 0.55 : 1,
              }}
            >
              {closingSessions ? "Cerrando…" : "Cerrar otras sesiones"}
            </button>
          </div>

          <div style={{ display: "grid", gap: "8px" }}>
            {status.sessions.map((session) => (
              <div key={session.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "12px", alignItems: "center", padding: "12px", background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                <div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "4px" }}>
                    <span style={{ color: "var(--text)", fontSize: "12px", fontWeight: 700 }}>
                      {session.isCurrent ? "Sesión actual" : "Sesión secundaria"}
                    </span>
                    {session.isCurrent ? (
                      <span style={{ color: "var(--accent)", fontSize: "10px", fontWeight: 800, border: "1px solid rgba(22,163,74,0.18)", borderRadius: "999px", padding: "2px 7px" }}>
                        Este dispositivo
                      </span>
                    ) : null}
                  </div>
                  <p style={{ color: "var(--text-soft)", fontSize: "11px", lineHeight: 1.5, margin: 0 }}>
                    Creada: {formatDateTime(session.createdAt)} · Vence: {formatDateTime(session.expiresAt)}
                  </p>
                </div>
                <span aria-hidden="true" style={{ color: session.isCurrent ? "var(--accent)" : "var(--text-soft)", fontSize: "18px" }}>
                  {session.isCurrent ? "✓" : "•"}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
