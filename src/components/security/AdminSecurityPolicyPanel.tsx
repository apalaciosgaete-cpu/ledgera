"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/modules/identity/client/authContext";
import { fonts } from "@/styles/tokens";

type SecuritySettings = {
  SECURITY_SESSION_HOURS: string;
  SECURITY_MAX_LOGIN_ATTEMPTS: string;
};

const defaults: SecuritySettings = {
  SECURITY_SESSION_HOURS: "24",
  SECURITY_MAX_LOGIN_ATTEMPTS: "5",
};

function NumberField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ display: "grid", gap: "6px" }}>
      <span style={{ color: "var(--text)", fontSize: "13px", fontWeight: 600 }}>{label}</span>
      <span style={{ color: "var(--text-soft)", fontSize: "11px", lineHeight: 1.45 }}>{hint}</span>
      <input
        type="number"
        min="1"
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

export default function AdminSecurityPolicyPanel() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [settings, setSettings] = useState<SecuritySettings>(defaults);
  const [original, setOriginal] = useState<SecuritySettings>(defaults);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadSettings = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/configuracion", {
        credentials: "include",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "No fue posible cargar las políticas de seguridad.");
      }

      const values = payload?.data ?? payload ?? {};
      const next: SecuritySettings = {
        SECURITY_SESSION_HOURS: String(values.SECURITY_SESSION_HOURS ?? defaults.SECURITY_SESSION_HOURS),
        SECURITY_MAX_LOGIN_ATTEMPTS: String(values.SECURITY_MAX_LOGIN_ATTEMPTS ?? defaults.SECURITY_MAX_LOGIN_ATTEMPTS),
      };

      setSettings(next);
      setOriginal(next);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar las políticas de seguridad.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function saveSettings() {
    const sessionHours = Number(settings.SECURITY_SESSION_HOURS);
    const maxAttempts = Number(settings.SECURITY_MAX_LOGIN_ATTEMPTS);

    if (!Number.isInteger(sessionHours) || sessionHours < 1) {
      setError("La expiración de sesión debe ser un número entero mayor que cero.");
      return;
    }

    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
      setError("El máximo de intentos debe ser un número entero mayor que cero.");
      return;
    }

    setSaving(true);
    setNotice("");
    setError("");

    try {
      const changed = (Object.entries(settings) as [keyof SecuritySettings, string][])
        .filter(([key, value]) => value !== original[key]);

      for (const [key, value] of changed) {
        const response = await fetch("/api/configuracion", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value, role: "admin" }),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? "No fue posible guardar las políticas de seguridad.");
        }
      }

      setOriginal(settings);
      setNotice(changed.length > 0 ? "Políticas de seguridad guardadas." : "No hay cambios pendientes.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No fue posible guardar las políticas de seguridad.");
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) return null;

  return (
    <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ fontFamily: fonts.display, fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>
          Sesiones y control de acceso
        </h3>
        <p style={{ color: "var(--text-soft)", fontSize: "12px", lineHeight: 1.5, margin: 0 }}>
          Parámetros de gobierno operacional aplicados a toda la plataforma.
        </p>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-soft)", fontSize: "12px", margin: 0 }}>Cargando políticas…</p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          <NumberField
            label="Expiración de sesión (horas)"
            hint="Las sesiones se cerrarán automáticamente al vencer este período."
            value={settings.SECURITY_SESSION_HOURS}
            onChange={(value) => setSettings((current) => ({ ...current, SECURITY_SESSION_HOURS: value }))}
          />
          <NumberField
            label="Máximo de intentos de acceso fallidos"
            hint="La cuenta se bloqueará temporalmente al alcanzar este límite."
            value={settings.SECURITY_MAX_LOGIN_ATTEMPTS}
            onChange={(value) => setSettings((current) => ({ ...current, SECURITY_MAX_LOGIN_ATTEMPTS: value }))}
          />
        </div>
      )}

      {error ? <p role="alert" style={{ color: "var(--loss)", fontSize: "12px", fontWeight: 600, margin: "1rem 0 0" }}>{error}</p> : null}
      {notice ? <p role="status" style={{ color: "var(--accent)", fontSize: "12px", fontWeight: 600, margin: "1rem 0 0" }}>{notice}</p> : null}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--border)", marginTop: "1.25rem", paddingTop: "1rem" }}>
        <button
          type="button"
          onClick={() => { setSettings(original); setError(""); setNotice(""); }}
          disabled={loading || saving}
          style={{ padding: "9px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-soft)", fontSize: "13px", fontWeight: 600, cursor: loading || saving ? "not-allowed" : "pointer", fontFamily: fonts.body }}
        >
          Descartar
        </button>
        <button
          type="button"
          onClick={saveSettings}
          disabled={loading || saving}
          style={{ padding: "9px 18px", borderRadius: "8px", border: "none", background: "var(--accent)", color: "var(--text)", fontSize: "13px", fontWeight: 700, cursor: loading || saving ? "not-allowed" : "pointer", fontFamily: fonts.body }}
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </section>
  );
}
