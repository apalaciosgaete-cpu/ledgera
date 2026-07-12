"use client";

import { useCallback, useEffect, useState } from "react";

import { fonts } from "@/styles/tokens";

type SecurityStatusResponse = {
  ok?: boolean;
  message?: string;
  data?: {
    email?: {
      address?: string;
      verified?: boolean;
    };
  };
};

function readCsrfCookie() {
  if (typeof document === "undefined") return "";

  return (
    document.cookie
      .split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith("ledgera_csrf="))
      ?.split("=")[1] ?? ""
  );
}

export default function EmailVerificationPanel() {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/security/status", {
        credentials: "include",
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as SecurityStatusResponse | null;

      if (!response.ok || !payload?.ok || !payload.data?.email) {
        throw new Error(payload?.message ?? "No fue posible consultar el correo.");
      }

      setVerified(Boolean(payload.data.email.verified));
      setEmail(payload.data.email.address ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible consultar el correo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function sendVerificationEmail() {
    setSending(true);
    setNotice("");
    setError("");

    try {
      await fetch("/api/csrf", {
        credentials: "include",
        cache: "no-store",
      });

      const response = await fetch("/api/email-verification/send", {
        method: "POST",
        credentials: "include",
        headers: {
          "x-ledgera-csrf": readCsrfCookie(),
        },
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message ?? "No fue posible enviar el correo de verificación.");
      }

      if (payload?.data?.alreadyVerified) {
        setVerified(true);
        setNotice("El correo ya está verificado.");
        return;
      }

      setNotice(`Enviamos un enlace de verificación a ${email}. Revisa también la carpeta de spam.`);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "No fue posible enviar el correo de verificación.");
    } finally {
      setSending(false);
    }
  }

  if (loading || verified) return null;

  return (
    <section
      style={{
        background: "rgba(245,158,11,0.06)",
        border: "1px solid rgba(245,158,11,0.2)",
        borderRadius: "12px",
        padding: "1.25rem 1.5rem",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              fontFamily: fonts.display,
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--text)",
              margin: "0 0 5px",
            }}
          >
            Verificación de correo pendiente
          </h3>
          <p
            style={{
              color: "var(--text-soft)",
              fontSize: "12px",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Confirma {email || "tu dirección"} para acreditar la identidad de acceso y habilitar una recuperación segura de la cuenta.
          </p>
        </div>

        <button
          type="button"
          onClick={sendVerificationEmail}
          disabled={sending}
          style={{
            border: "1px solid rgba(245,158,11,0.32)",
            background: "rgba(245,158,11,0.1)",
            color: "var(--warn)",
            borderRadius: "8px",
            padding: "9px 14px",
            fontSize: "12px",
            fontWeight: 800,
            fontFamily: fonts.body,
            cursor: sending ? "not-allowed" : "pointer",
            opacity: sending ? 0.65 : 1,
          }}
        >
          {sending ? "Enviando…" : "Enviar correo de verificación"}
        </button>
      </div>

      {notice ? (
        <p role="status" style={{ color: "var(--accent)", fontSize: "12px", fontWeight: 600, margin: "12px 0 0" }}>
          {notice}
        </p>
      ) : null}

      {error ? (
        <p role="alert" style={{ color: "var(--loss)", fontSize: "12px", fontWeight: 600, margin: "12px 0 0" }}>
          {error}
        </p>
      ) : null}
    </section>
  );
}
