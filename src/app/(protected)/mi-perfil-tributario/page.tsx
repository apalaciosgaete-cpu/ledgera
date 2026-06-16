"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  profileTypeLabel,
  profileTypeDescription,
  profileTypeColor,
  profileTypeBg,
  profileTypeIcon,
  confidenceLabel,
  COMPLIANCE_LABELS,
  RECOMMENDATION_LABELS,
  TASK_LABELS,
  DOCUMENT_LABELS,
  RISK_LABELS,
  type AdaptiveProfileSnapshot,
  type AdaptiveProfileType,
  type ComplianceBehavior,
  type RecommendationBehavior,
  type TaskBehavior,
  type DocumentBehavior,
  type RiskBehavior,
} from "@/modules/adaptive-profile/domain/adaptiveProfile";

export default function MiPerfilTributarioPage() {
  const [profile, setProfile] = useState<AdaptiveProfileSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rebuilding, setRebuilding] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/profile/adaptive", { cache: "no-store" });
        const json = await res.json();
        if (!json.ok) throw new Error(json.message || "Error al cargar perfil.");
        setProfile(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function handleRebuild() {
    setRebuilding(true);
    try {
      const res = await fetch("/api/profile/adaptive", {
        method: "POST",
        cache: "no-store",
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Error al reconstruir perfil.");
      setProfile(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setRebuilding(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 800, width: "100%" }}>
        <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>
          Cargando tu perfil tributario…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, width: "100%" }}>
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            color: "#991B1B",
            fontWeight: 750,
            padding: 16,
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ maxWidth: 800, width: "100%" }}>
        <p style={{ color: "#64748B", fontSize: 14 }}>
          No hay perfil disponible. Reconstruye tu perfil para obtener recomendaciones personalizadas.
        </p>
        <button
          onClick={handleRebuild}
          disabled={rebuilding}
          style={{
            background: "#0F766E",
            border: "none",
            borderRadius: 8,
            color: "#FFFFFF",
            cursor: rebuilding ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 850,
            marginTop: 16,
            padding: "12px 22px",
          }}
        >
          {rebuilding ? "Generando perfil…" : "Generar mi perfil"}
        </button>
      </div>
    );
  }

  const pt = profile.profileType as AdaptiveProfileType;
  const color = profileTypeColor(pt);
  const bg = profileTypeBg(pt);
  const icon = profileTypeIcon(pt);

  return (
    <div style={{ maxWidth: 800, width: "100%" }}>
      <section style={{ marginBottom: 28 }}>
        <p
          style={{
            color: "#0F766E",
            fontSize: 12,
            fontWeight: 850,
            letterSpacing: "0.06em",
            margin: "0 0 7px",
            textTransform: "uppercase",
          }}
        >
          Perfil Tributario
        </p>
        <h1
          style={{
            color: "#0F2A3D",
            fontSize: "1.85rem",
            fontWeight: 850,
            lineHeight: 1.12,
            margin: "0 0 8px",
          }}
        >
          Mi Perfil Tributario
        </h1>
        <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
          LEDGERA aprende cómo te comportas y adapta sus recomendaciones para ti.
        </p>
      </section>

      {/* Tarjeta principal — Tipo de perfil */}
      <section
        style={{
          background: bg,
          border: `2px solid ${color}`,
          borderRadius: 14,
          padding: "28px",
          marginBottom: 24,
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 14, marginBottom: 16 }}>
          <span style={{ fontSize: 32 }}>{icon}</span>
          <div>
            <h2
              style={{
                color,
                fontSize: "1.5rem",
                fontWeight: 850,
                lineHeight: 1.15,
                margin: 0,
              }}
            >
              {profileTypeLabel(pt)}
            </h2>
            <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.5, margin: "6px 0 0" }}>
              {profileTypeDescription(pt)}
            </p>
          </div>
        </div>

        {/* Score */}
        <div style={{ marginBottom: 20 }}>
          <p
            style={{
              color: "#64748B",
              fontSize: 11,
              fontWeight: 850,
              letterSpacing: "0.04em",
              margin: "0 0 4px",
              textTransform: "uppercase",
            }}
          >
            Nivel de cumplimiento
          </p>
          <p style={{ color, fontSize: "2.2rem", fontWeight: 850, lineHeight: 1.1, margin: 0 }}>
            {profile.complianceScore}/100
          </p>
        </div>

        {/* Comportamientos */}
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          <BehaviorCard
            label="Cumplimiento"
            value={COMPLIANCE_LABELS[profile.complianceBehavior as ComplianceBehavior]}
          />
          <BehaviorCard
            label="Recomendaciones"
            value={RECOMMENDATION_LABELS[profile.recommendationBehavior as RecommendationBehavior]}
          />
          <BehaviorCard
            label="Tareas"
            value={TASK_LABELS[profile.taskBehavior as TaskBehavior]}
          />
          <BehaviorCard
            label="Documentos"
            value={DOCUMENT_LABELS[profile.documentBehavior as DocumentBehavior]}
          />
          <BehaviorCard
            label="Riesgo"
            value={RISK_LABELS[profile.riskBehavior as RiskBehavior]}
          />
          <BehaviorCard
            label="Confianza"
            value={confidenceLabel(profile.confidence)}
          />
        </div>

        {/* Reconstruir perfil */}
        <div style={{ marginTop: 24 }}>
          <button
            onClick={handleRebuild}
            disabled={rebuilding}
            style={{
              background: color,
              border: "none",
              borderRadius: 8,
              color: "#FFFFFF",
              cursor: rebuilding ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 850,
              padding: "12px 22px",
            }}
          >
            {rebuilding ? "Actualizando…" : "Actualizar mi perfil"}
          </button>
        </div>
      </section>

      {/* ¿Qué significa esto? */}
      <section
        style={{
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: 14,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h3
          style={{
            color: "#0F2A3D",
            fontSize: "1.1rem",
            fontWeight: 850,
            margin: "0 0 12px",
          }}
        >
          ¿Qué significa esto?
        </h3>
        <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          LEDGERA analiza tu historial de cumplimiento, cómo respondes a recomendaciones,
          cómo gestionas tus tareas, el estado de tus documentos y tu nivel de riesgo
          para crear un perfil adaptativo. Este perfil se usa para personalizar las
          recomendaciones, priorizar tareas y ajustar la frecuencia de automatizaciones.
        </p>
      </section>

      {/* Explorar más */}
      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 14,
          padding: 24,
        }}
      >
        <h3
          style={{
            color: "#0F2A3D",
            fontSize: "1.1rem",
            fontWeight: 850,
            margin: "0 0 16px",
          }}
        >
          Explora más
        </h3>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
          <Link
            href="/mi-situacion"
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              color: "#0F2A3D",
              fontSize: 13,
              fontWeight: 800,
              padding: 14,
              textDecoration: "none",
            }}
          >
            Mi Situación →
          </Link>
          <Link
            href="/experto"
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              color: "#0F2A3D",
              fontSize: 13,
              fontWeight: 800,
              padding: 14,
              textDecoration: "none",
            }}
          >
            Modo Experto →
          </Link>
          <Link
            href="/experto/tributario"
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              color: "#0F2A3D",
              fontSize: 13,
              fontWeight: 800,
              padding: 14,
              textDecoration: "none",
            }}
          >
            Estado Tributario →
          </Link>
        </div>
      </section>
    </div>
  );
}

function BehaviorCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 10,
        padding: 14,
      }}
    >
      <p
        style={{
          color: "#64748B",
          fontSize: 11,
          fontWeight: 850,
          letterSpacing: "0.04em",
          margin: "0 0 6px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 750, margin: 0 }}>
        {value}
      </p>
    </div>
  );
}
