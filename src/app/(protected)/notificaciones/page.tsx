"use client";

import { useEffect, useState } from "react";
const RETENTION_ALERTS = [
  {
    id: "situacion-30d",
    type: "warning",
    icon: "📅",
    title: "Revisa tu situación tributaria",
    message: "Hace 30 días que no revisas tu posición frente al SII. Mantente al día con tus obligaciones.",
    cta: "Ver Mi Situación",
    href: "/mi-situacion",
  },
  {
    id: "nuevo-staking",
    type: "info",
    icon: "⛏️",
    title: "Nuevo staking detectado",
    message: "Detectamos nuevos ingresos por staking. Revisa si generan obligaciones tributarias.",
    cta: "Revisar staking",
    href: "/inversiones/staking",
  },
  {
    id: "nueva-obligacion",
    type: "alert",
    icon: "⚠️",
    title: "Nueva obligación tributaria",
    message: "Con los datos actuales podrías tener una obligación ante el SII. Valida con un contador.",
    cta: "Ver detalle",
    href: "/mi-situacion",
  },
  {
    id: "declaracion-disponible",
    type: "success",
    icon: "📄",
    title: "Nueva declaración disponible",
    message: "Tienes un período listo para declarar. Prepara tu respaldo documental.",
    cta: "Ir a declaraciones",
    href: "/experto/declaraciones",
  },
];

export default function NotificacionesPage() {
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("ledgera_dismissed_alerts");
    if (saved) {
      try {
        setDismissed(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  function dismiss(id: string) {
    const next = [...dismissed, id];
    setDismissed(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("ledgera_dismissed_alerts", JSON.stringify(next));
    }
  }

  const visibleAlerts = RETENTION_ALERTS.filter((alert) => !dismissed.includes(alert.id));

  return (
    <div style={{ maxWidth: 800, width: "100%" }}>
      <section style={{ marginBottom: 28 }}>
        <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>
          Centro de alertas
        </p>
        <h1 style={{ color: "var(--text)", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>
          Notificaciones
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
          Mantente al día con tu situación tributaria y evita abandonar tus revisiones.
        </p>
      </section>

      {visibleAlerts.length === 0 ? (
        <div style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 12, padding: 32, textAlign: "center" }}>
          <p style={{ color: "var(--text-soft)", fontSize: 15, margin: 0 }}>No tienes alertas pendientes.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                background: "var(--bg-elev)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 18,
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
              }}
            >
              <span style={{ fontSize: 24 }}>{alert.icon}</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: "var(--text)", fontSize: 15, fontWeight: 800, margin: "0 0 4px" }}>{alert.title}</h3>
                <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.5, margin: "0 0 12px" }}>{alert.message}</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <a
                    href={alert.href}
                    style={{
                      background: "var(--accent)",
                      borderRadius: 8,
                      color: "var(--text)",
                      fontSize: 13,
                      fontWeight: 800,
                      padding: "8px 14px",
                      textDecoration: "none",
                    }}
                  >
                    {alert.cta}
                  </a>
                  <button
                    onClick={() => dismiss(alert.id)}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--text-soft)",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 700,
                      padding: "8px 14px",
                    }}
                  >
                    Descartar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
