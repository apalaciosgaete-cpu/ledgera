"use client";

import { useEffect, useState } from "react";

type Task = {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "PENDING" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED";
  source: string;
  sourceId: string | null;
  assignedTo: string | null;
  dueDate: string | null;
  createdAt: string;
};

const categories = [
  { value: "", label: "Todas" },
  { value: "TRIBUTARY", label: "Tributario" },
  { value: "COMPLIANCE", label: "Cumplimiento" },
  { value: "OPERATIONS", label: "Operaciones" },
  { value: "CONNECTIONS", label: "Conexiones" },
  { value: "BILLING", label: "Suscripción" },
  { value: "SECURITY", label: "Seguridad" },
];

const priorities = [
  { value: "", label: "Todas" },
  { value: "CRITICAL", label: "Crítica" },
  { value: "HIGH", label: "Alta" },
  { value: "MEDIUM", label: "Media" },
  { value: "LOW", label: "Baja" },
];

const statuses = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Pendiente" },
  { value: "IN_PROGRESS", label: "En progreso" },
  { value: "BLOCKED", label: "Bloqueada" },
  { value: "COMPLETED", label: "Completada" },
  { value: "CANCELLED", label: "Cancelada" },
];

export default function ExpertTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (priority) params.set("priority", priority);
        if (status) params.set("status", status);
        if (userId) params.set("userId", userId);

        const res = await fetch(`/api/tasks/admin?${params.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.message || "Error cargando tareas.");
        setTasks(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [category, priority, status, userId]);

  return (
    <section style={{ padding: "24px 0" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 850, margin: "0 0 8px" }}>
          Tareas tributarias
        </h1>
        <p style={{ color: "#64748B", margin: 0 }}>
          Seguimiento centralizado de tareas generadas para los usuarios.
        </p>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <Select label="Estado" value={status} options={statuses} onChange={setStatus} />
        <Select label="Prioridad" value={priority} options={priorities} onChange={setPriority} />
        <Select label="Categoría" value={category} options={categories} onChange={setCategory} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 200 }}>
          <label style={{ color: "#64748B", fontSize: 12, fontWeight: 700 }}>Usuario</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Filtrar por userId"
            style={{
              background: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: 8,
              color: "#0F2A3D",
              fontSize: 14,
              padding: "8px 12px",
            }}
          />
        </div>
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
        <p style={{ color: "#64748B" }}>Cargando tareas…</p>
      ) : tasks.length === 0 ? (
        <p style={{ color: "#64748B" }}>Sin tareas para los filtros seleccionados.</p>
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
                <th style={{ padding: "12px 16px" }}>Tarea</th>
                <th style={{ padding: "12px 16px" }}>Prioridad</th>
                <th style={{ padding: "12px 16px" }}>Estado</th>
                <th style={{ padding: "12px 16px" }}>Vencimiento</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} style={{ borderTop: "1px solid #E2E8F0" }}>
                  <td style={{ padding: "12px 16px", color: "#0F2A3D", fontWeight: 600 }}>
                    {t.userId}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 700, color: "#0F2A3D" }}>{t.title}</div>
                    <div style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>
                      {t.description}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusBadge status={t.status} />
                  </td>
                  <td style={{ padding: "12px 16px", color: "#64748B" }}>
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString("es-CL") : "—"}
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
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 160 }}>
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

function PriorityBadge({ priority }: { priority: Task["priority"] }) {
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

  return <span style={{ color, fontWeight: 700, fontSize: 12 }}>{label}</span>;
}

function StatusBadge({ status }: { status: Task["status"] }) {
  const color: Record<Task["status"], string> = {
    PENDING: "#B45309",
    IN_PROGRESS: "#0F766E",
    BLOCKED: "#991B1B",
    COMPLETED: "#15803D",
    CANCELLED: "#64748B",
  };

  const label: Record<Task["status"], string> = {
    PENDING: "Pendiente",
    IN_PROGRESS: "En progreso",
    BLOCKED: "Bloqueada",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
  };

  return (
    <span
      style={{
        background: color[status] + "15",
        borderRadius: 12,
        color: color[status],
        fontSize: 11,
        fontWeight: 750,
        padding: "4px 10px",
        textTransform: "uppercase",
      }}
    >
      {label[status]}
    </span>
  );
}
