"use client";

import { useState, type FormEvent } from "react";

import { requestAdminReauthentication } from "@/modules/admin/client/adminReauthenticationClient";
import { isHttpClientError } from "@/shared/http/httpClient";
import { fonts, radius, shadows } from "@/styles/tokens";

export function AdminReauthenticationModal({
  onAuthenticated,
  onClose,
}: {
  onAuthenticated: () => void | Promise<void>;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await requestAdminReauthentication({ password, code });
      await onAuthenticated();
      onClose();
    } catch (currentError) {
      setError(
        isHttpClientError(currentError)
          ? currentError.message
          : "No fue posible reautenticar la sesión administrativa.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-reauth-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "rgba(0,0,0,0.68)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "min(430px, 100%)",
          padding: 24,
          border: "1px solid var(--border)",
          borderRadius: radius.lg,
          background: "var(--bg-elev)",
          boxShadow: shadows.lg,
          fontFamily: fonts.body,
        }}
      >
        <h2 id="admin-reauth-title" style={{ margin: 0, fontFamily: fonts.display, fontSize: 20 }}>
          Confirmar acción crítica
        </h2>
        <p style={{ margin: "8px 0 18px", color: "var(--text-soft)", fontSize: 13, lineHeight: 1.5 }}>
          Ingresa nuevamente tu contraseña y el código 2FA. La autorización será válida durante diez minutos y solo para esta sesión.
        </p>

        {error ? (
          <div style={{ marginBottom: 14, padding: 10, border: "1px solid var(--loss)", borderRadius: radius.md, color: "var(--loss)", fontSize: 12 }}>
            {error}
          </div>
        ) : null}

        <label style={{ display: "grid", gap: 6, marginBottom: 14, fontSize: 12 }}>
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            style={{ padding: 11, border: "1px solid var(--border-strong)", borderRadius: radius.md, background: "var(--bg-sunken)", color: "var(--text)" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6, marginBottom: 18, fontSize: 12 }}>
          Código 2FA
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            minLength={6}
            maxLength={6}
            required
            placeholder="123456"
            style={{ padding: 11, border: "1px solid var(--border-strong)", borderRadius: radius.md, background: "var(--bg-sunken)", color: "var(--text)", fontFamily: fonts.mono, letterSpacing: "0.18em" }}
          />
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{ padding: "9px 13px", border: "1px solid var(--border)", borderRadius: radius.md, background: "var(--bg-elev)", color: "var(--text)", cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || code.length !== 6 || !password}
            style={{ padding: "9px 13px", border: 0, borderRadius: radius.md, background: "var(--accent)", color: "var(--accent-contrast)", fontWeight: 800, cursor: "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Validando…" : "Autorizar"}
          </button>
        </div>
      </form>
    </div>
  );
}
