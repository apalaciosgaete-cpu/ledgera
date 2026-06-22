"use client";

import type { ReactNode } from "react";

import { useAuth } from "@/modules/identity/client/authContext";

interface AppScreenProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

function resolveSubscriptionColor(state: string | null | undefined) {
  switch (state) {
    case "ADMIN":
    case "ACTIVE":
      return {
        border: "#16A34A",
        background: "rgba(22, 163, 74, 0.12)",
        text: "#86EFAC",
      };

    case "WARNING":
      return {
        border: "#F59E0B",
        background: "rgba(245, 158, 11, 0.14)",
        text: "#FCD34D",
      };

    case "EXPIRED":
    case "SUSPENDED":
    case "INACTIVE":
      return {
        border: "#EF4444",
        background: "rgba(239, 68, 68, 0.14)",
        text: "#FCA5A5",
      };

    default:
      return {
        border: "#64748B",
        background: "rgba(100, 116, 139, 0.12)",
        text: "#CBD5E1",
      };
  }
}

export default function AppScreen({
  title,
  description,
  children,
}: AppScreenProps) {
  const { user, subscriptionState } = useAuth();

  const subscriptionColors = resolveSubscriptionColor(subscriptionState?.state);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px 24px",
        backgroundColor: "#0b1020",
        color: "#f5f7fb",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: "40px" }}>{title}</h1>

            {description ? (
              <p
                style={{
                  marginTop: "16px",
                  color: "#cbd5e1",
                  lineHeight: 1.7,
                  maxWidth: "760px",
                }}
              >
                {description}
              </p>
            ) : null}
          </div>

          {subscriptionState ? (
            <aside
              style={{
                minWidth: "260px",
                maxWidth: "360px",
                border: `1px solid ${subscriptionColors.border}`,
                background: subscriptionColors.background,
                borderRadius: "14px",
                padding: "14px 16px",
              }}
            >
              <p
                style={{
                  margin: "0 0 4px",
                  color: subscriptionColors.text,
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {subscriptionState.label}
              </p>

              <p
                style={{
                  margin: "0 0 8px",
                  color: "#E2E8F0",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                {subscriptionState.message}
              </p>

              <div
                style={{
                  display: "grid",
                  gap: "4px",
                  color: "#94A3B8",
                  fontSize: "12px",
                }}
              >
                <span>Usuario: {user?.email ?? "-"}</span>
                <span>Plan: {subscriptionState.plan ?? "Sin plan"}</span>
                {subscriptionState.expiresAt ? (
                  <span>
                    Vence:{" "}
                    {subscriptionState.expiresAt.toLocaleDateString("es-CL")}
                  </span>
                ) : null}
              </div>
            </aside>
          ) : null}
        </header>

        {children ? <section style={{ marginTop: "32px" }}>{children}</section> : null}
      </div>
    </main>
  );
}