"use client";

import { useEffect, useState } from "react";

type Recommendation = {
  id: string;
  userId: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  status: "ACTIVE" | "DISMISSED" | "COMPLETED";
  sourceType: string;
  sourceId: string | null;
  createdAt: string;
  updatedAt: string;
};

const categories = [
  { value: "", label: "Todas las categorías" },
  { value: "TRIBUTARY", label: "Tributario" },
  { value: "COMPLIANCE", label: "Cumplimiento" },
  { value: "OPERATIONS", label: "Operaciones" },
  { value: "CONNECTIONS", label: "Conexiones" },
  { value: "BILLING", label: "Suscripción" },
  { value: "RISK", label: "Riesgo" },
];

const priorities = [
  { value: "", label: "Todas las prioridades" },
  { value: "CRITICAL", label: "Crítica" },
  { value: "HIGH", label: "Alta" },
  { value: "MEDIUM", label: "Media" },
  { value: "LOW", label: "Baja" },
];

const statuses = [
  { value: "", label: "Todos los estados" },
  { value: "ACTIVE", label: "Activa" },
  { value: "DISMISSED", label: "Descartada" },
  { value: "COMPLETED", label: "Completada" },
];

export default function ExpertRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (priority) params.set("priority", priority);
        if (status) params.set("status", status);

        const res = await fetch(`/api/recommendations/admin?${params.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.message || "Error cargando recomendaciones.");
        setRecommendations(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [category, priority, status]);

  return (
    <section style={{ padding: "24px 0" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 850, margin: "0 0 8px" }}>
          Recomendaciones
        </h1>
        <p style={{ color: "#64748B", margin: 0 }}>
          Vista centralizada de recomendaciones generadas para los usuarios.
        </p>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <Select
          label="Categoría"
          value={category}
          options={categories}
          onChange={setCategory}
        />
        <Select
          label="Prioridad"
          value={priority}
          options={priorities}
          onChange={setPriority}
        />
        <Select
          label="Estado"
          value={status}
          options={statuses}
          onChange={setStatus}
        />
      </div>

      {error && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            color: "#991B1B",
            fontWeight: 750,
            marginBottom: 24,
            padding: 16,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#64748B" }}>Cargando recomendaciones…</p>
      ) : recommendations.length === 0 ? (
        <p style={{ color: "#64748B" }}>Sin recomendaciones para los filtros seleccionados.</p>
      ) : (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", color: "#64748B", textAlign: "left" }}>
                <th style={{ padding: "12px 16px" }}>Usuario</th>
                <th style={{ padding: "12px 16px" }}>Recomendación</th>
                <th style={{ padding: "12px 16px" }}>Prioridad</th>
                <th style={{ padding: "12px 16px" }}>Estado</th>
                <th style={{ padding: "12px 16px" }}>Categoría</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #E2E8F0" }}>
                  <td style={{ padding: "12px 16px", color: "#0F2A3D", fontWeight: 600 }}>
                    {r.userId}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 700, color: "#0F2A3D" }}>{r.title}</div>
                    <div style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>
                      {r.description}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <PriorityBadge priority={r.priority} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ padding: "12px 16px", color: "#64748B" }}>
                    {categoryLabel(r.category)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 180 }}>
      <label style={{ color: "#64748B", fontSize: 12, fontWeight: 700 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "#FFFFFF",
          border: "1px solid #CBD5E1",
          borderRadius: 8,
          color: "#0F2A3D",
          fontSize: 14,
          padding: "8px 12px",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: Recommendation["priority"] }) {
  const color =
    priority === "CRITICAL"
      ? "#991B1B"
      : priority === "HIGH"
      ? "#DC2626"
      : priority === "MEDIUM"
      ? "#B45309"
      : "#64748B";

  const label =
    priority === "CRITICAL"
      ? "Crítica"
      : priority === "HIGH"
      ? "Alta"
      : priority === "MEDIUM"
      ? "Media"
      : "Baja";

  return (
    <span style={{ color, fontWeight: 700, fontSize: 12 }}>{label}</span>
  );
}

function StatusBadge({ status }: { status: Recommendation["status"] }) {
  const color =
    status === "ACTIVE" ? "#15803D" : status === "DISMISSED" ? "#64748B" : "#0F766E";
  const label =
    status === "ACTIVE" ? "Activa" : status === "DISMISSED" ? "Descartada" : "Completada";

  return (
    <span
      style={{
        background: status === "ACTIVE" ? "#F0FDF4" : "#F8FAFC",
        borderRadius: 12,
        color,
        fontSize: 11,
        fontWeight: 750,
        padding: "4px 10px",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}

function categoryLabel(category: string): string {
  switch (category) {
    case "TRIBUTARY":
      return "Tributario";
    case "COMPLIANCE":
      return "Cumplimiento";
    case "OPERATIONS":
      return "Operaciones";
    case "CONNECTIONS":
      return "Conexiones";
    case "BILLING":
      return "Suscripción";
    case "RISK":
      return "Riesgo";
    default:
      return category;
  }
}
