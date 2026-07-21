"use client";

import Link from "next/link";

import { useAuth } from "@/modules/identity/client/authContext";
import { resolveSubscriptionState } from "@/modules/subscription/application/resolveSubscriptionState";
import { fonts } from "@/styles/tokens";

export function SubscriptionAccessBanner() {
  const { user } = useAuth();

  if (!user || user.role === "admin" || user.role === "support") return null;

  const state = resolveSubscriptionState({
    id: user.id,
    role: user.role,
    status: user.status,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
  });

  if (state.state !== "EXPIRED" && state.state !== "SUSPENDED") return null;

  const expired = state.state === "EXPIRED";

  return (
    <div
      role="status"
      style={{
        position: "sticky",
        top: 60,
        zIndex: 45,
        alignItems: "center",
        background: expired ? "rgba(232,184,75,0.14)" : "rgba(196,99,74,0.14)",
        borderBottom: `1px solid ${expired ? "var(--warn)" : "var(--loss)"}`,
        color: "var(--text)",
        display: "flex",
        flexWrap: "wrap",
        fontFamily: fonts.body,
        fontSize: 12,
        gap: 10,
        justifyContent: "space-between",
        padding: "10px 20px",
      }}
    >
      <span>
        <strong>{expired ? "Modo solo lectura." : "Cuenta suspendida."}</strong>{" "}
        {expired
          ? "Puedes consultar tu información, pero las modificaciones y exportaciones pagadas están bloqueadas hasta reactivar el plan."
          : "El acceso está restringido. Contacta a soporte para revisar el estado de la cuenta."}
      </span>

      {expired ? (
        <Link
          href="/configuracion/facturacion"
          style={{
            border: "1px solid var(--warn)",
            borderRadius: 8,
            color: "var(--text)",
            fontWeight: 850,
            padding: "7px 10px",
            textDecoration: "none",
          }}
        >
          Reactivar plan
        </Link>
      ) : (
        <Link
          href="/ayuda"
          style={{
            border: "1px solid var(--loss)",
            borderRadius: 8,
            color: "var(--text)",
            fontWeight: 850,
            padding: "7px 10px",
            textDecoration: "none",
          }}
        >
          Contactar soporte
        </Link>
      )}
    </div>
  );
}
