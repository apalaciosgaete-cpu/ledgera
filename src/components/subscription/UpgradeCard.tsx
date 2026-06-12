"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/modules/identity/client/authContext";
import {
  Feature,
  getPlanLabel,
  requiredPlanForFeature,
} from "@/modules/subscription/domain/planFeatures";
import { UpgradeModal } from "./UpgradeModal";

const FEATURE_LABELS: Record<Feature, string> = {
  [Feature.SII_STATUS]: "Estado SII",
  [Feature.TAX_ESTIMATE]: "Impuesto estimado",
  [Feature.PDF_EXPORT]: "Exportación PDF",
  [Feature.CSV_EXPORT]: "Exportación CSV",
  [Feature.DECLARATIONS]: "Declaraciones",
  [Feature.CALENDAR]: "Calendario tributario",
  [Feature.EXPERT_MODE]: "Modo experto",
  [Feature.AUDIT]: "Auditoría",
  [Feature.VERIFICATIONS]: "Verificaciones",
  [Feature.CUSTODY]: "Cadena de custodia",
  [Feature.ADVANCED_REPORTS]: "Reportes avanzados",
  [Feature.BILLING]: "Facturación",
  [Feature.ADMIN]: "Administración",
};

type PaywallEvent =
  | "upgrade_prompt_viewed"
  | "upgrade_clicked"
  | "feature_blocked";

function logPaywallEvent(
  event: PaywallEvent,
  payload: {
    userId?: string;
    plan?: string | null;
    feature: Feature;
    requiredPlan: string;
    source: string;
  },
) {
  if (typeof window === "undefined") return;

  console.info("[paywall]", {
    event,
    ...payload,
    occurredAt: new Date().toISOString(),
  });
}

export type UpgradeCardProps = {
  feature: Feature;
  source?: string;
};

export function UpgradeCard({ feature, source = "upgrade_card" }: UpgradeCardProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const featureLabel = FEATURE_LABELS[feature] ?? feature;
  const requiredPlan = requiredPlanForFeature(feature);
  const planLabel = getPlanLabel(requiredPlan);

  useEffect(() => {
    logPaywallEvent("upgrade_prompt_viewed", {
      userId: user?.id,
      plan: user?.subscriptionPlan,
      feature,
      requiredPlan,
      source,
    });
  }, [user?.id, user?.subscriptionPlan, feature, requiredPlan, source]);

  function handleClick() {
    logPaywallEvent("upgrade_clicked", {
      userId: user?.id,
      plan: user?.subscriptionPlan,
      feature,
      requiredPlan,
      source,
    });
    setShowModal(true);
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding: 28,
        textAlign: "center",
        maxWidth: 420,
        width: "100%",
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
      <h3
        style={{
          color: "#0F2A3D",
          fontSize: 17,
          fontWeight: 800,
          margin: "0 0 8px",
        }}
      >
        {featureLabel}
      </h3>
      <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 22px" }}>
        Disponible en <strong>{planLabel}</strong>
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={handleClick}
          style={{
            background: "#0F766E",
            border: "none",
            borderRadius: 8,
            color: "#FFFFFF",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 800,
            padding: "12px 24px",
            width: "100%",
          }}
        >
          Desbloquear {featureLabel.toLowerCase()}
        </button>

        <Link
          href="/configuracion/facturacion"
          onClick={handleClick}
          style={{
            color: "#0F766E",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Ver planes →
        </Link>
      </div>

      {showModal && (
        <UpgradeModal
          feature={feature}
          featureLabel={featureLabel}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
