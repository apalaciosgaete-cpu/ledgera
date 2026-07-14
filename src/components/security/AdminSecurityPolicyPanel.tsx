"use client";

import { useMemo, useState } from "react";

import type { SecurityPolicySettings } from "@/modules/security/domain/securityPolicy";
import {
  httpClient,
  isHttpClientError,
} from "@/shared/http/httpClient";
import { fonts } from "@/styles/tokens";

type AdminSecurityPolicyPanelProps = {
  initialSettings: SecurityPolicySettings;
};

function NumberField({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  min: number;
  max: number;
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ display: "grid", gap: "6px" }}>
      <span style={{ color: "var(--text)", fontSize: "13px", fontWeight: 600 }}>
        {label}
      </span>
      <span
        style={{
          color: "var(--text-soft)",
          fontSize: "11px",
          lineHeight: 1.45,
        }}
      >
        {hint}
      </span>
      <input
        type="number"
        min={min}
        max={max}
        step="1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: "140px",
          boxSizing: "border-box",
          background: "var(--bg-sunken)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "10px 12px",
          color: "var(--text)",
          fontSize: "14px",
          fontFamily: fonts.body,
          outline: "none",
        }}
      />
    </label>
  );
}

export default function AdminSecurityPolicyPanel({
  initialSettings,
}: AdminSecurityPolicyPanelProps) {
  const [settings, setSettings] =
    useState<SecurityPolicySettings>(initialSettings);
  const [original, setOriginal] =
    useState<SecurityPolicySettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const changedEntries = useMemo(
    () =>
      (
        Object.entries(settings) as [keyof SecurityPolicySettings, string][]
      ).filter(([key, value]) => value !== original[key]),
    [original, settings],
  );

  async function saveSettings() {
    const sessionHours = Number(settings.SECURITY_SESSION_HOURS);
    const maxAttempts = Number(settings.SECURITY_MAX_LOGIN_ATTEMPTS);

    if (
      !Number.isInteger(sessionHours) ||
      sessionHours < 1 ||
      sessionHours > 720
    ) {
      setError(
        "La expiración de sesión debe ser un número entero entre 1 y 720 horas.",
      );
      return;
    }

    if (
      !Number.isInteger(maxAttempts) ||
      maxAttempts < 1 ||
      maxAttempts > 20
    ) {
      setError(
        "El máximo de intentos debe ser un número entero entre 1 y 20.",
      );
      return;
    }

    if (changedEntries.length === 0) {
      setError("");
      setNotice("No hay cambios pendientes.");
      return;
    }

    setSaving(true);
    setNotice("");
    setError("");

    try {
      // Inicializa o renueva la cookie CSRF antes de la mutación. El cliente
      // HTTP lee esa cookie y adjunta automáticamente X-LEDGERA-CSRF.
      await httpClient("/api/csrf");

      await httpClient("/api/configuracion", {
        method: "PUT",
        body: {
          updates: changedEntries.map(([key, value]) => ({ key, value })),
        },
      });

      const savedSettings = { ...settings };
      setOriginal(savedSettings);
      setNotice(
        changedEntries.length === 1
          ? "Política de seguridad guardada."
          : "Políticas de seguridad guardadas.",
      );
    } catch (saveError) {
      setError(
        isHttpClientError(saveError)
          ? saveError.message
          : saveError instanceof Error
            ? saveError.message
            : "No fue posible guardar las políticas de seguridad.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      style={{
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1rem",
      }}
    >
      <div style={{ marginBottom: "1.25rem" }}>
        <h3
          style={{
            fontFamily: fonts.display,
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--text)",
            margin: "0 0 4px",
          }}
        >
          Sesiones y control de acceso
        </h3>
        <p
          style={{
            color: "var(--text-soft)",
            fontSize: "12px",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Parámetros de gobierno operacional aplicados a toda la plataforma.
        </p>
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        <NumberField
          label="Expiración de sesión (horas)"
          hint="Las sesiones se cerrarán automáticamente al vencer este período."
          value={settings.SECURITY_SESSION_HOURS}
          min={1}
          max={720}
          onChange={(value) => {
            setNotice("");
            setError("");
            setSettings((current) => ({
              ...current,
              SECURITY_SESSION_HOURS: value,
            }));
          }}
        />
        <NumberField
          label="Máximo de intentos de acceso fallidos"
          hint="La cuenta se bloqueará temporalmente al alcanzar este límite."
          value={settings.SECURITY_MAX_LOGIN_ATTEMPTS}
          min={1}
          max={20}
          onChange={(value) => {
            setNotice("");
            setError("");
            setSettings((current) => ({
              ...current,
              SECURITY_MAX_LOGIN_ATTEMPTS: value,
            }));
          }}
        />
      </div>

      {error ? (
        <p
          role="alert"
          style={{
            color: "var(--loss)",
            fontSize: "12px",
            fontWeight: 600,
            margin: "1rem 0 0",
          }}
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          style={{
            color: "var(--accent)",
            fontSize: "12px",
            fontWeight: 600,
            margin: "1rem 0 0",
          }}
        >
          {notice}
        </p>
      ) : null}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          borderTop: "1px solid var(--border)",
          marginTop: "1.25rem",
          paddingTop: "1rem",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setSettings(original);
            setError("");
            setNotice("");
          }}
          disabled={saving || changedEntries.length === 0}
          style={{
            padding: "9px 16px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-soft)",
            fontSize: "13px",
            fontWeight: 600,
            cursor:
              saving || changedEntries.length === 0 ? "not-allowed" : "pointer",
            opacity: changedEntries.length === 0 ? 0.55 : 1,
            fontFamily: fonts.body,
          }}
        >
          Descartar
        </button>
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving || changedEntries.length === 0}
          style={{
            padding: "9px 18px",
            borderRadius: "8px",
            border: "none",
            background: "var(--accent)",
            color: "var(--text)",
            fontSize: "13px",
            fontWeight: 700,
            cursor:
              saving || changedEntries.length === 0 ? "not-allowed" : "pointer",
            opacity: changedEntries.length === 0 ? 0.65 : 1,
            fontFamily: fonts.body,
          }}
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </section>
  );
}
