"use client";

import { useEffect, useState } from "react";
import {
  profileTypeLabel,
  profileTypeColor,
  profileTypeIcon,
  confidenceLabel,
  COMPLIANCE_LABELS,
  RECOMMENDATION_LABELS,
  TASK_LABELS,
  DOCUMENT_LABELS,
  RISK_LABELS,
  type AdaptiveProfileSnapshot,
  type AdaptiveProfileType,
} from "@/modules/adaptive-profile/domain/adaptiveProfile";

export default function ExpertPerfilesAdaptativosPage() {
  const [profiles, setProfiles] = useState<AdaptiveProfileSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (filterType) params.set("profileType", filterType);
        params.set("limit", "100");

        const res = await fetch(`/api/profile/adaptive/admin?${params.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.message || "Error al cargar perfiles.");
        setProfiles(json.data.profiles);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [filterType]);

  // Metrics
  const optimized = profiles.filter((p) => p.profileType === "OPTIMIZED").length;
  const standard = profiles.filter((p) => p.profileType === "STANDARD").length;
  const attention = profiles.filter((p) => p.profileType === "ATTENTION_REQUIRED").length;
  const critical = profiles.filter((p) => p.profileType === "CRITICAL").length;

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ marginBottom: 24 }}>
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
          Modo Experto
        </p>
        <h1
          style={{
            color: "#F8FAFC",
            fontSize: "1.85rem",
            fontWeight: 850,
            lineHeight: 1.12,
            margin: "0 0 8px",
          }}
        >
          Perfiles Adaptativos
        </h1>
        <p style={{ color: "#94A3B8", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
          Distribución de usuarios según su perfil tributario adaptativo.
        </p>
      </section>

      {/* Metrics cards */}
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(4, 1fr)",
          marginBottom: 24,
        }}
      >
        <MetricCard label="Optimizados" value={optimized} color="#15803D" accent="good" />
        <MetricCard label="Estándar" value={standard} color="#0F766E" accent="neutral" />
        <MetricCard label="Atención Requerida" value={attention} accent="warn" />
        <MetricCard label="Críticos" value={critical} color="#991B1B" accent="danger" />
      </div>

      {/* Filter */}
      <section
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          marginBottom: 20,
          padding: 16,
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 12 }}>
          <label
            style={{
              color: "#94A3B8",
              fontSize: 13,
              fontWeight: 750,
            }}
          >
            Filtrar por perfil
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: "#0B1D2C",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              color: "#F8FAFC",
              fontSize: 13,
              fontWeight: 750,
              minHeight: 38,
              padding: "0 10px",
            }}
          >
            <option value="">Todos</option>
            <option value="OPTIMIZED">Optimizado</option>
            <option value="STANDARD">Estándar</option>
            <option value="ATTENTION_REQUIRED">Atención Requerida</option>
            <option value="CRITICAL">Crítico</option>
          </select>
          {profiles.length > 0 && (
            <span style={{ color: "#64748B", fontSize: 13 }}>
              {profiles.length} usuario{profiles.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </section>

      {/* Table */}
      {loading ? (
        <p style={{ color: "#94A3B8", fontSize: 14, fontWeight: 750 }}>Cargando perfiles…</p>
      ) : error ? (
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
      ) : profiles.length === 0 ? (
        <section
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px dashed rgba(255,255,255,0.12)",
            borderRadius: 8,
            padding: 28,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              color: "#F8FAFC",
              fontSize: "1.15rem",
              fontWeight: 850,
              margin: "0 0 8px",
            }}
          >
            Sin perfiles adaptativos
          </h2>
          <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.55, margin: 0 }}>
            Aún no hay perfiles generados. Los perfiles se crean automáticamente al consultarlos.
          </p>
        </section>
      ) : (
        <section
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", minWidth: 780, width: "100%" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.06)", color: "#94A3B8", textAlign: "left" }}>
                  <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Usuario</th>
                  <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Perfil</th>
                  <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Score</th>
                  <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Riesgo</th>
                  <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Tareas</th>
                  <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Recomendaciones</th>
                  <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Confianza</th>
                  <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Actualización</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => {
                  const pt = p.profileType as AdaptiveProfileType;
                  const pColor = profileTypeColor(pt);
                  return (
                    <tr
                      key={p.id}
                      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <td style={{ color: "#F8FAFC", fontSize: 13, padding: "14px" }}>
                        <div>
                          <span style={{ fontWeight: 750 }}>{p.userName}</span>
                          <span style={{ color: "#64748B", fontSize: 12, marginLeft: 8 }}>
                            {p.userEmail}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "14px" }}>
                        <span
                          style={{
                            color: pColor,
                            fontSize: 13,
                            fontWeight: 800,
                          }}
                        >
                          {profileTypeIcon(pt)} {profileTypeLabel(pt)}
                        </span>
                      </td>
                      <td style={{ color: "#F8FAFC", fontSize: 13, padding: "14px", textAlign: "right" }}>
                        {p.complianceScore}
                      </td>
                      <td style={{ color: "#94A3B8", fontSize: 13, padding: "14px" }}>
                        {RISK_LABELS[p.riskBehavior as keyof typeof RISK_LABELS] ?? p.riskBehavior}
                      </td>
                      <td style={{ color: "#94A3B8", fontSize: 13, padding: "14px" }}>
                        {TASK_LABELS[p.taskBehavior as keyof typeof TASK_LABELS] ?? p.taskBehavior}
                      </td>
                      <td style={{ color: "#94A3B8", fontSize: 13, padding: "14px" }}>
                        {RECOMMENDATION_LABELS[p.recommendationBehavior as keyof typeof RECOMMENDATION_LABELS] ?? p.recommendationBehavior}
                      </td>
                      <td style={{ color: "#F8FAFC", fontSize: 13, padding: "14px", textAlign: "right" }}>
                        {confidenceLabel(p.confidence)}
                      </td>
                      <td style={{ color: "#64748B", fontSize: 12, padding: "14px", textAlign: "right" }}>
                        {new Date(p.updatedAt).toLocaleDateString("es-CL")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
  accent = "neutral",
}: {
  label: string;
  value: number;
  color?: string;
  accent?: "neutral" | "good" | "warn" | "danger";
}) {
  const c =
    color ??
    (accent === "good" ? "#15803D" : accent === "warn" ? "#B45309" : accent === "danger" ? "#991B1B" : "#F8FAFC");

  return (
    <article
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        padding: 16,
      }}
    >
      <p
        style={{
          color: "#94A3B8",
          fontSize: 11,
          fontWeight: 850,
          letterSpacing: "0.04em",
          margin: "0 0 8px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <p style={{ color: c, fontSize: "1.75rem", fontWeight: 850, margin: 0 }}>{value}</p>
    </article>
  );
}
