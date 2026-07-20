"use client";

import { useCallback, useEffect, useState } from "react";

import {
  httpClient,
  isHttpClientError,
} from "@/shared/http/httpClient";
import { fonts } from "@/styles/tokens";

type Invitation = {
  id: string;
  professionalUserId: string;
  status: string;
  permissions: string[];
  invitedAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  professional: {
    id: string;
    email: string;
    fullName: string;
    status: string;
    twoFactorEnabled: boolean;
  };
};

type InvitationsResponse = {
  ok: boolean;
  data: {
    invitations: Invitation[];
  };
};

const PERMISSION_LABELS: Record<string, string> = {
  VIEW_TAX_DATA: "Consultar información tributaria",
  MANAGE_IMPORTS: "Gestionar importaciones",
  EDIT_CLASSIFICATIONS: "Corregir clasificaciones",
  EXPORT_REPORTS: "Descargar reportes",
  MANAGE_DECLARATIONS: "Preparar declaraciones",
  VIEW_AUDIT: "Consultar auditoría",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  ACTIVE: "Autorizado",
  DECLINED: "Rechazado",
  REVOKED: "Revocado",
};

export default function ProfessionalAccessPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await httpClient<InvitationsResponse>(
        "/api/professional/invitations",
      );
      setInvitations(response.data.invitations);
      setMessage(null);
    } catch (error) {
      setMessage({
        ok: false,
        text: isHttpClientError(error)
          ? error.message
          : "No fue posible cargar las autorizaciones.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  async function respond(invitation: Invitation, action: "ACCEPT" | "DECLINE") {
    setActionId(invitation.id);
    setMessage(null);
    try {
      await httpClient(`/api/professional/invitations/${invitation.id}/respond`, {
        method: "POST",
        body: { action },
      });
      setMessage({
        ok: true,
        text: action === "ACCEPT"
          ? "Acceso profesional autorizado."
          : "Invitación rechazada.",
      });
      await loadInvitations();
    } catch (error) {
      setMessage({
        ok: false,
        text: isHttpClientError(error)
          ? error.message
          : "No fue posible responder la invitación.",
      });
    } finally {
      setActionId(null);
    }
  }

  async function revoke(invitation: Invitation) {
    setActionId(invitation.id);
    setMessage(null);
    try {
      await httpClient(`/api/professional/invitations/${invitation.id}/revoke`, {
        method: "POST",
      });
      setMessage({ ok: true, text: "El acceso profesional fue revocado." });
      await loadInvitations();
    } catch (error) {
      setMessage({
        ok: false,
        text: isHttpClientError(error)
          ? error.message
          : "No fue posible revocar el acceso.",
      });
    } finally {
      setActionId(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: 18, fontFamily: fonts.body }}>
      <section>
        <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 900, letterSpacing: "0.14em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Privacidad y control
        </p>
        <h1 style={{ color: "var(--text)", fontFamily: fonts.display, fontSize: 30, fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 8px" }}>
          Accesos profesionales
        </h1>
        <p style={{ color: "var(--text-soft)", lineHeight: 1.55, margin: 0, maxWidth: 780 }}>
          Revisa qué asesores pueden trabajar con tu información. Ningún profesional accede a tus datos sin una autorización activa y puedes revocarla en cualquier momento.
        </p>
      </section>

      {message ? (
        <div style={{ background: message.ok ? "var(--accent-soft)" : "rgba(196,99,74,0.12)", border: `1px solid ${message.ok ? "var(--accent)" : "var(--loss)"}`, borderRadius: 14, color: message.ok ? "var(--accent)" : "var(--loss)", fontSize: 13, fontWeight: 750, padding: "12px 14px" }}>
          {message.text}
        </div>
      ) : null}

      {loading ? (
        <div style={{ color: "var(--text-soft)", padding: 18 }}>Cargando autorizaciones…</div>
      ) : invitations.length === 0 ? (
        <div style={{ background: "var(--bg-elev)", border: "1px dashed var(--border-strong)", borderRadius: 16, color: "var(--text-soft)", padding: 22 }}>
          No tienes invitaciones ni accesos profesionales registrados.
        </div>
      ) : (
        invitations.map((invitation) => (
          <article key={invitation.id} style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, display: "grid", gap: 14, padding: 18 }}>
            <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
              <div>
                <strong style={{ color: "var(--text)", display: "block", fontSize: 16 }}>{invitation.professional.fullName}</strong>
                <span style={{ color: "var(--text-soft)", display: "block", fontSize: 12, marginTop: 4 }}>{invitation.professional.email}</span>
              </div>
              <span style={{ background: invitation.status === "ACTIVE" ? "var(--accent-soft)" : invitation.status === "PENDING" ? "rgba(232,184,75,0.14)" : "var(--bg-sunken)", borderRadius: 999, color: invitation.status === "ACTIVE" ? "var(--accent)" : invitation.status === "PENDING" ? "var(--warn)" : "var(--text-faint)", fontSize: 11, fontWeight: 900, padding: "6px 10px" }}>
                {STATUS_LABELS[invitation.status] ?? invitation.status}
              </span>
            </div>

            <div>
              <span style={{ color: "var(--text)", display: "block", fontSize: 12, fontWeight: 850, marginBottom: 8 }}>Permisos solicitados</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {invitation.permissions.map((permission) => (
                  <span key={permission} style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 999, color: "var(--text-soft)", fontSize: 11, padding: "5px 8px" }}>
                    {PERMISSION_LABELS[permission] ?? permission}
                  </span>
                ))}
              </div>
            </div>

            {!invitation.professional.twoFactorEnabled ? (
              <p style={{ background: "rgba(232,184,75,0.14)", border: "1px solid rgba(232,184,75,0.22)", borderRadius: 12, color: "var(--warn)", fontSize: 12, margin: 0, padding: 10 }}>
                Este profesional todavía no tiene 2FA activo. La autorización no podrá activarse hasta que proteja su cuenta.
              </p>
            ) : null}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {invitation.status === "PENDING" ? (
                <>
                  <button type="button" onClick={() => void respond(invitation, "ACCEPT")} disabled={actionId === invitation.id || !invitation.professional.twoFactorEnabled} style={{ background: "var(--accent)", border: 0, borderRadius: 9, color: "var(--accent-contrast)", cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 38, padding: "0 14px" }}>
                    Autorizar acceso
                  </button>
                  <button type="button" onClick={() => void respond(invitation, "DECLINE")} disabled={actionId === invitation.id} style={{ background: "transparent", border: "1px solid var(--border-strong)", borderRadius: 9, color: "var(--text)", cursor: "pointer", fontSize: 12, fontWeight: 850, minHeight: 38, padding: "0 14px" }}>
                    Rechazar
                  </button>
                </>
              ) : null}
              {invitation.status === "ACTIVE" ? (
                <button type="button" onClick={() => void revoke(invitation)} disabled={actionId === invitation.id} style={{ background: "transparent", border: "1px solid var(--loss)", borderRadius: 9, color: "var(--loss)", cursor: "pointer", fontSize: 12, fontWeight: 850, minHeight: 38, padding: "0 14px" }}>
                  Revocar acceso
                </button>
              ) : null}
            </div>
          </article>
        ))
      )}
    </div>
  );
}
