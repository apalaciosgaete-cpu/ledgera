// src/app/blocked/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type MeResponse = {
  data?: {
    user?: {
      email?: string;
      status?: string;
      subscriptionPlan?: string | null;
      subscriptionExpiresAt?: string | null;
    };
  };
};

export default function BlockedPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [reason, setReason] = useState("La cuenta no tiene una suscripción activa.");

  useEffect(() => {
    fetch("/api/me")
      .then((response) => response.json() as Promise<MeResponse>)
      .then((data) => {
        const user = data?.data?.user;

        if (user?.email) {
          setEmail(user.email);
        }

        if (user?.status === "suspended") {
          setReason("La cuenta fue suspendida temporalmente.");
          return;
        }

        if (user?.subscriptionExpiresAt) {
          const expiresAt = new Date(user.subscriptionExpiresAt);

          if (!Number.isNaN(expiresAt.getTime()) && expiresAt < new Date()) {
            setReason("La suscripción asociada a la cuenta está vencida.");
          }
        }
      })
      .catch(() => null);
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/logout", {
        method: "POST",
      });
    } catch {
      // ignorar error logout
    } finally {
      router.push("/login");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F6F8FA",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-body)",
        padding: "32px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          padding: "48px",
          maxWidth: "520px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ marginBottom: "32px" }}>
          <svg
            width="48"
            height="42"
            viewBox="0 0 64 56"
            style={{ margin: "0 auto" }}
          >
            <rect x="4" y="44" width="10" height="12" rx="2" fill="#16A34A" fillOpacity="0.4" />
            <rect x="18" y="32" width="10" height="24" rx="2" fill="#16A34A" fillOpacity="0.65" />
            <rect x="32" y="18" width="10" height="38" rx="2" fill="#16A34A" />
            <rect x="46" y="4" width="10" height="52" rx="2" fill="#F59E0B" />
          </svg>
        </div>

        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EF4444"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "24px",
            fontWeight: 700,
            color: "#0F172A",
            margin: "0 0 12px",
          }}
        >
          Acceso temporalmente bloqueado
        </h1>

        <p
          style={{
            fontSize: "15px",
            color: "#64748B",
            lineHeight: "1.6",
            margin: "0 0 8px",
          }}
        >
          {reason}
        </p>

        {email && (
          <p
            style={{
              fontSize: "14px",
              color: "#94A3B8",
              margin: "0 0 32px",
            }}
          >
            {email}
          </p>
        )}

        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "32px",
            textAlign: "left",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#334155",
              margin: "0 0 12px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            ¿Qué puedo hacer?
          </p>

          <ul
            style={{
              margin: 0,
              padding: "0 0 0 16px",
              color: "#475569",
              fontSize: "14px",
              lineHeight: "1.8",
            }}
          >
            <li>Contacta a soporte para revisar el estado de la cuenta.</li>
            <li>Escríbenos a <strong>soporte@ledgera.cl</strong>.</li>
            <li>Tu información permanece segura y disponible al regularizar el acceso.</li>
          </ul>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "12px 24px",
            borderRadius: "10px",
            border: "1px solid #E2E8F0",
            background: "transparent",
            color: "#64748B",
            fontSize: "14px",
            fontFamily: "var(--font-body)",
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}