"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type ConsentState = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
};

const STORAGE_KEY = "ledgera-cookie-consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  // Ley 21.719: las categorías no esenciales arrancan desactivadas (opt-in explícito).
  const [functional, setFunctional] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function save(consent: ConsentState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch {}
    setVisible(false);
    setShowPanel(false);
  }

  function acceptAll() {
    save({ necessary: true, functional: true, analytics: true });
  }

  function rejectNonEssential() {
    save({ necessary: true, functional: false, analytics: false });
  }

  function saveCustom() {
    save({ necessary: true, functional, analytics });
  }

  if (!visible) return null;

  return (
    <>
      {/* OVERLAY cuando el panel está abierto */}
      {showPanel && (
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
      )}

      {/* PANEL DE PERSONALIZACIÓN */}
      {showPanel && (
        <div
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
            maxWidth: "640px",
            margin: "0 auto",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.5rem",
            }}
          >
            <h2
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "var(--text)",
                margin: 0,
              }}
            >
              Personalizar cookies
            </h2>
            <button
              onClick={() => setShowPanel(false)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-soft)",
                cursor: "pointer",
                fontSize: "1.2rem",
                lineHeight: 1,
                padding: "0.2rem",
              }}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
            {/* Necesarias — siempre activas */}
            <ToggleRow
              label="Estrictamente necesarias"
              description="Imprescindibles para el inicio de sesión y el funcionamiento básico de la plataforma. No pueden desactivarse."
              checked={true}
              locked
              onChange={() => {}}
            />

            {/* Funcionales */}
            <ToggleRow
              label="Funcionales"
              description="Recuerdan sus preferencias de visualización y el período tributario seleccionado."
              checked={functional}
              onChange={setFunctional}
            />

            {/* Analíticas */}
            <ToggleRow
              label="Analíticas"
              description="Métricas de uso anónimas y agregadas que nos ayudan a mejorar la plataforma. No incluyen datos personales identificables."
              checked={analytics}
              onChange={setAnalytics}
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={saveCustom}
              style={{
                flex: 1,
                minWidth: "160px",
                padding: "0.75rem 1.2rem",
                borderRadius: "8px",
                background: "linear-gradient(135deg, var(--accent), var(--bg-elev))",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.88rem",
                cursor: "pointer",
              }}
            >
              Guardar preferencias
            </button>
            <button
              onClick={acceptAll}
              style={{
                flex: 1,
                minWidth: "140px",
                padding: "0.75rem 1.2rem",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--text-soft)",
                fontWeight: 500,
                fontSize: "0.88rem",
                cursor: "pointer",
              }}
            >
              Aceptar todas
            </button>
          </div>
        </div>
      )}

      {/* BANNER PRINCIPAL */}
      {!showPanel && (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(92vw, 680px)",
            zIndex: 1997,
            background: "var(--bg-elev)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px",
            padding: "1.2rem 1.4rem",
            boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
            display: "flex",
            gap: "1.2rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Icono */}
          <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>🍪</span>

          {/* Texto */}
          <div style={{ flex: 1, minWidth: "200px" }}>
            <p
              style={{
                margin: "0 0 0.25rem",
                color: "var(--text)",
                fontSize: "0.88rem",
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              Usamos cookies para mejorar tu experiencia
            </p>
            <p style={{ margin: 0, color: "var(--text-soft)", fontSize: "0.8rem", lineHeight: 1.5 }}>
              Las estrictamente necesarias siempre están activas.{" "}
              <Link href="/cookies" style={{ color: "var(--accent)", textDecoration: "none" }}>
                Política de Cookies
              </Link>
            </p>
          </div>

          {/* Botones */}
          <div style={{ display: "flex", gap: "0.6rem", flexShrink: 0, flexWrap: "wrap" }}>
            <button
              onClick={rejectNonEssential}
              style={{
                padding: "0.55rem 1rem",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "var(--text-soft)",
                fontSize: "0.82rem",
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-soft)")}
            >
              Solo necesarias
            </button>
            <button
              onClick={() => setShowPanel(true)}
              style={{
                padding: "0.55rem 1rem",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid rgba(99,102,241,0.4)",
                color: "var(--accent)",
                fontSize: "0.82rem",
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.8)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)")}
            >
              Personalizar
            </button>
            <button
              onClick={acceptAll}
              style={{
                padding: "0.55rem 1.1rem",
                borderRadius: "8px",
                background: "linear-gradient(135deg, var(--accent), var(--bg-elev))",
                border: "none",
                color: "#fff",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Aceptar todas
            </button>
          </div>
        </div>
      )}
    </>
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
  onChange: (v: boolean) => void;
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
        <p style={{ margin: "0 0 0.2rem", color: "var(--text)", fontWeight: 600, fontSize: "0.88rem" }}>
          {label}
          {locked && (
            <span
              style={{
                marginLeft: "0.5rem",
                fontSize: "0.7rem",
                color: "var(--text)",
                background: "rgba(255,255,255,0.05)",
                padding: "0.1rem 0.45rem",
                borderRadius: "999px",
                verticalAlign: "middle",
              }}
            >
              Siempre activa
            </span>
          )}
        </p>
        <p style={{ margin: 0, color: "var(--text-soft)", fontSize: "0.8rem", lineHeight: 1.55 }}>
          {description}
        </p>
      </div>

      {/* Toggle switch */}
      <button
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
          background: checked
            ? locked
              ? "rgba(99,102,241,0.5)"
              : "#3FA687"
            : "rgba(255,255,255,0.1)",
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
