"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CONSENT_POLICY_VERSION,
  PRIVACY_PREFERENCES_EVENT,
  ConsentCategories,
  DEFAULT_CONSENT_CATEGORIES,
  buildConsentSnapshot,
  normalizeConsentCategories,
  persistConsentSnapshot,
  readConsentSnapshot,
} from "@/lib/privacy/consent";

type SaveState = "idle" | "saving" | "error";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    const current = readConsentSnapshot();
    if (!current) {
      setVisible(true);
      return;
    }

    setFunctional(current.categories.functional);
    setAnalytics(current.categories.analytics);
  }, []);

  useEffect(() => {
    function openPreferences() {
      const current = readConsentSnapshot();
      const categories = current?.categories || DEFAULT_CONSENT_CATEGORIES;
      setFunctional(categories.functional);
      setAnalytics(categories.analytics);
      setVisible(true);
      setShowPanel(true);
      setSaveState("idle");
    }

    window.addEventListener(PRIVACY_PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(PRIVACY_PREFERENCES_EVENT, openPreferences);
  }, []);

  async function save(categories: ConsentCategories) {
    setSaveState("saving");

    const normalized = normalizeConsentCategories(categories);
    const decidedAt = new Date().toISOString();
    const localFallback = buildConsentSnapshot({ categories: normalized, decidedAt, serverLogged: false });

    try {
      const response = await fetch("/api/privacy/consent", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: normalized, policyVersion: CONSENT_POLICY_VERSION }),
      });

      if (!response.ok) throw new Error("consent-log-failed");

      const payload = (await response.json()) as { consent?: unknown };
      const consent = payload.consent && typeof payload.consent === "object"
        ? buildConsentSnapshot(payload.consent as Parameters<typeof buildConsentSnapshot>[0])
        : localFallback;

      persistConsentSnapshot(consent);
      setVisible(false);
      setShowPanel(false);
      setSaveState("idle");
    } catch {
      persistConsentSnapshot(localFallback);
      setVisible(false);
      setShowPanel(false);
      setSaveState("error");
    }
  }

  function acceptAll() {
    void save({ necessary: true, functional: true, analytics: true });
  }

  function rejectNonEssential() {
    void save({ necessary: true, functional: false, analytics: false });
  }

  function saveCustom() {
    void save({ necessary: true, functional, analytics });
  }

  if (!visible) return null;

  return (
    <>
      {showPanel ? (
        <div
          onClick={() => setShowPanel(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 1998,
            backdropFilter: "blur(2px)",
          }}
        />
      ) : null}

      {showPanel ? (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-preferences-title"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1999,
            background: "var(--bg-elev)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderBottom: "none",
            borderRadius: "16px 16px 0 0",
            padding: "2rem 2rem 2.5rem",
            maxWidth: "680px",
            margin: "0 auto",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.2rem" }}>
            <div>
              <p style={{ margin: "0 0 0.25rem", color: "var(--accent)", fontSize: "0.74rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Ley 21.719 · Chile
              </p>
              <h2 id="privacy-preferences-title" style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                Preferencias de privacidad
              </h2>
            </div>
            <button
              onClick={() => setShowPanel(false)}
              style={{ background: "none", border: "none", color: "var(--text-soft)", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1, padding: "0.2rem" }}
              aria-label="Cerrar preferencias de privacidad"
            >
              ✕
            </button>
          </div>

          <p style={{ margin: "0 0 1.25rem", color: "var(--text-soft)", fontSize: "0.86rem", lineHeight: 1.65 }}>
            Puedes aceptar, rechazar o configurar las categorías no esenciales. Las necesarias se mantienen activas porque permiten iniciar sesión, proteger la cuenta y operar la plataforma.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", marginBottom: "1.4rem" }}>
            <ToggleRow
              label="Estrictamente necesarias"
              description="Sesión, seguridad, prevención de fraude, balanceo de carga y funcionamiento básico de LEDGERA. No pueden desactivarse."
              checked={true}
              locked
              onChange={() => {}}
            />
            <ToggleRow
              label="Funcionales"
              description="Recuerdan preferencias de visualización y configuración de uso, sin fines publicitarios."
              checked={functional}
              onChange={setFunctional}
            />
            <ToggleRow
              label="Analíticas"
              description="Medición agregada para mejorar la plataforma. Incluye Vercel Analytics, Speed Insights, Google Analytics o PostHog solo si aceptas esta categoría."
              checked={analytics}
              onChange={setAnalytics}
            />
          </div>

          <p style={{ margin: "0 0 1.2rem", color: "var(--text-soft)", fontSize: "0.78rem", lineHeight: 1.55 }}>
            Guardamos una prueba auditable de la decisión: versión de política, fecha, categorías y una huella criptográfica. No usamos cookies publicitarias.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <EqualChoiceButton onClick={rejectNonEssential} disabled={saveState === "saving"}>
              Rechazar no esenciales
            </EqualChoiceButton>
            <button
              onClick={saveCustom}
              disabled={saveState === "saving"}
              style={{
                flex: 1,
                minWidth: "165px",
                padding: "0.78rem 1.1rem",
                borderRadius: "9px",
                background: "linear-gradient(135deg, var(--accent), var(--bg-elev))",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.86rem",
                cursor: saveState === "saving" ? "wait" : "pointer",
              }}
            >
              Guardar preferencias
            </button>
            <EqualChoiceButton onClick={acceptAll} disabled={saveState === "saving"}>
              Aceptar todo
            </EqualChoiceButton>
          </div>
        </section>
      ) : null}

      {!showPanel ? (
        <section
          role="dialog"
          aria-live="polite"
          aria-label="Preferencias de privacidad"
          style={{
            position: "fixed",
            bottom: "1.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(92vw, 700px)",
            zIndex: 1997,
            background: "var(--bg-elev)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px",
            padding: "1.15rem 1.3rem",
            boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: "230px" }}>
            <p style={{ margin: "0 0 0.25rem", color: "var(--text)", fontSize: "0.9rem", fontWeight: 700, lineHeight: 1.4 }}>
              Privacidad y cookies en LEDGERA
            </p>
            <p style={{ margin: 0, color: "var(--text-soft)", fontSize: "0.8rem", lineHeight: 1.55 }}>
              Usamos cookies necesarias y, solo con tu autorización, cookies funcionales o analíticas. Rechazar debe ser tan simple como aceptar. {" "}
              <Link href="/cookies" style={{ color: "var(--accent)", textDecoration: "none" }}>
                Ver política
              </Link>
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", flexShrink: 0, flexWrap: "wrap" }}>
            <EqualChoiceButton onClick={rejectNonEssential} disabled={saveState === "saving"} compact>
              Rechazar
            </EqualChoiceButton>
            <button
              onClick={() => setShowPanel(true)}
              disabled={saveState === "saving"}
              style={{
                padding: "0.58rem 1rem",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid rgba(99,102,241,0.45)",
                color: "var(--accent)",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: saveState === "saving" ? "wait" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Configurar
            </button>
            <EqualChoiceButton onClick={acceptAll} disabled={saveState === "saving"} compact>
              Aceptar
            </EqualChoiceButton>
          </div>
        </section>
      ) : null}
    </>
  );
}

function EqualChoiceButton({
  children,
  compact = false,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  compact?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: compact ? "0 0 auto" : 1,
        minWidth: compact ? "104px" : "165px",
        padding: compact ? "0.58rem 1rem" : "0.78rem 1.1rem",
        borderRadius: "8px",
        background: "rgba(63,166,135,0.13)",
        border: "1px solid rgba(63,166,135,0.45)",
        color: "var(--text)",
        fontSize: compact ? "0.82rem" : "0.86rem",
        fontWeight: 700,
        cursor: disabled ? "wait" : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  locked = false,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  locked?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "flex-start",
        padding: "0.9rem 1rem",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "10px",
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ margin: "0 0 0.2rem", color: "var(--text)", fontWeight: 700, fontSize: "0.88rem" }}>
          {label}
          {locked ? (
            <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: "var(--text)", background: "rgba(255,255,255,0.05)", padding: "0.1rem 0.45rem", borderRadius: "999px", verticalAlign: "middle" }}>
              Siempre activa
            </span>
          ) : null}
        </p>
        <p style={{ margin: 0, color: "var(--text-soft)", fontSize: "0.8rem", lineHeight: 1.55 }}>{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={locked}
        onClick={() => !locked && onChange(!checked)}
        style={{
          flexShrink: 0,
          width: "44px",
          height: "24px",
          borderRadius: "999px",
          border: "none",
          background: checked ? (locked ? "rgba(99,102,241,0.45)" : "#3FA687") : "rgba(255,255,255,0.1)",
          cursor: locked ? "not-allowed" : "pointer",
          position: "relative",
          transition: "background 0.2s",
          padding: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "3px",
            left: checked ? "23px" : "3px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
            display: "block",
          }}
        />
      </button>
    </div>
  );
}
