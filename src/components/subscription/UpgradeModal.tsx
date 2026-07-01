"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Feature, getPlanLabel, normalizePlan, requiredPlanForFeature } from "@/modules/subscription/domain/planFeatures";
import { useAuth } from "@/modules/identity/client/authContext";

type UpgradeModalProps = {
  feature: Feature;
  featureLabel: string;
  onClose: () => void;
  source?: string;
};

const FEATURE_BENEFITS: Partial<Record<Feature, string[]>> = {
  [Feature.PDF_EXPORT]: ["PDF tributario", "Declaraciones", "Calendario tributario"],
  [Feature.CSV_EXPORT]: ["Exportación CSV", "Historial tributario", "Simulador"],
  [Feature.DECLARATIONS]: ["Declaraciones", "PDF tributario", "Calendario tributario"],
  [Feature.CALENDAR]: ["Calendario tributario", "Recordatorios SII", "Historial tributario"],
  [Feature.EXPERT_MODE]: ["Modo experto", "Auditoría", "Verificaciones", "Cadena de custodia"],
  [Feature.AUDIT]: ["Auditoría completa", "Verificaciones", "Reportes avanzados"],
  [Feature.VERIFICATIONS]: ["Verificaciones", "Evidencia", "Reportes avanzados"],
  [Feature.CUSTODY]: ["Cadena de custodia", "Auditoría", "Reportes avanzados"],
  [Feature.ADVANCED_REPORTS]: ["Reportes avanzados", "Exportaciones avanzadas", "Multiempresa"],
};

export function UpgradeModal({ feature, featureLabel, onClose, source = "upgrade_modal" }: UpgradeModalProps) {
  const { user } = useAuth();
  const loggedRef = useRef(false);
  const requiredPlan = requiredPlanForFeature(feature);
  const planLabel = getPlanLabel(requiredPlan);
  const benefits = FEATURE_BENEFITS[feature] ?? ["Funcionalidad premium"];

  useEffect(() => {
    if (loggedRef.current) return;
    loggedRef.current = true;

    console.info("[paywall]", {
      event: "upgrade_prompt_viewed",
      userId: user?.id,
      source,
      feature,
      requiredPlan: normalizePlan(requiredPlan),
      currentPlan: normalizePlan(user?.subscriptionPlan),
      occurredAt: new Date().toISOString(),
    });
  }, [feature, requiredPlan, user?.id, user?.subscriptionPlan]);

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2, 6, 23, 0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "var(--bg-elev)",
          borderRadius: 16,
          maxWidth: 420,
          width: "100%",
          padding: 28,
          boxShadow: "0 24px 60px rgba(0,0,0,0.24)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
          <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
            Desbloquea esta funcionalidad
          </h2>
          <p style={{ color: "var(--text-soft)", fontSize: 14, margin: 0 }}>
            <strong>{featureLabel}</strong> está disponible en el plan {planLabel}.
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ color: "var(--text)", fontSize: 13, fontWeight: 800, margin: "0 0 10px" }}>
            Plan requerido: {planLabel}
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {benefits.map((benefit) => (
              <li key={benefit} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text)" }}>
                <span style={{ color: "var(--accent)" }}>✓</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/configuracion/facturacion"
          onClick={() => {
            console.info("[paywall]", {
              event: "upgrade_clicked",
              userId: user?.id,
              source,
              feature,
              requiredPlan: normalizePlan(requiredPlan),
              currentPlan: normalizePlan(user?.subscriptionPlan),
              occurredAt: new Date().toISOString(),
            });
          }}
          style={{
            background: "var(--accent)",
            borderRadius: 10,
            color: "var(--text)",
            display: "block",
            fontSize: 15,
            fontWeight: 800,
            padding: "14px 24px",
            textAlign: "center",
            textDecoration: "none",
            marginBottom: 12,
          }}
        >
          Actualizar plan
        </Link>

        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-soft)",
            cursor: "pointer",
            display: "block",
            fontSize: 13,
            fontWeight: 700,
            margin: "0 auto",
            padding: 8,
          }}
        >
          Seguir en plan gratuito
        </button>
      </div>
    </div>
  );
}
