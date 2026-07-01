"use client";

import { useEffect, useState } from "react";

type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "PENDING" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED";
  source: string;
  sourceId: string | null;
  dueDate: string | null;
  createdAt: string;
};

const priorityLabel: Record<Task["priority"], string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

const priorityColor: Record<Task["priority"], string> = {
  LOW: "var(--bg-elev)",
  MEDIUM: "var(--warn)",
  HIGH: "var(--loss)",
  CRITICAL: "var(--loss)",
};

const statusLabel: Record<Task["status"], string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  BLOCKED: "Bloqueada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const statusColor: Record<Task["status"], string> = {
  PENDING: "var(--warn)",
  IN_PROGRESS: "var(--accent)",
  BLOCKED: "var(--loss)",
  COMPLETED: "var(--accent)",
  CANCELLED: "var(--bg-elev)",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [generating, setGenerating] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/tasks${params}`, { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Error cargando tareas.");
      setTasks(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [statusFilter]);

  async function handleAction(id: string, action: "start" | "complete" | "cancel") {
    try {
      const res = await fetch(`/api/tasks/${id}/${action}`, { method: "PATCH" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Error actualizando tarea.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    }
  }

  async function generateFromRecommendations() {
    try {
      setGenerating(true);
      const res = await fetch("/api/tasks/generate", { method: "POST" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Error generando tareas.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section style={{ maxWidth: 800, width: "100%" }}>
      <header style={{ marginBottom: 24 }}>
        <p
          style={{
            color: "var(--accent)",
            fontSize: 12,
            fontWeight: 850,
            letterSpacing: "0.06em",
            margin: "0 0 7px",
            textTransform: "uppercase",
          }}
        >
          Tareas
        </p>
        <h1
          style={{
            color: "var(--text)",
            fontSize: "1.9rem",
            fontWeight: 850,
            lineHeight: 1.12,
            margin: "0 0 8px",
          }}
        >
          Qué hacer ahora
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          Tareas claras para mantener tu situación tributaria en orden.
        </p>
      </header>

      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <button
          onClick={generateFromRecommendations}
          disabled={generating || loading}
          style={{
            background: "var(--accent)",
            border: "none",
            borderRadius: 8,
            color: "var(--text)",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 850,
            padding: "11px 16px",
          }}
        >
          {generating ? "Generando…" : "Generar tareas desde recomendaciones"}
        </button>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: "var(--bg-elev)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--text)",
            fontSize: 14,
            padding: "10px 12px",
          }}
        >
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="IN_PROGRESS">En progreso</option>
          <option value="BLOCKED">Bloqueada</option>
          <option value="COMPLETED">Completada</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(196,99,74,0.14)",
            border: "1px solid rgba(196,99,74,0.14)",
            borderRadius: 8,
            color: "var(--loss)",
            fontWeight: 750,
            marginBottom: 24,
            padding: 16,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--text-soft)", fontSize: 14 }}>Cargando tareas…</p>
      ) : tasks.length === 0 ? (
        <EmptyState onGenerate={generateFromRecommendations} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onAction={handleAction} />
          ))}
        </div>
      )}
    </section>
  );
}

function TaskCard({
  task,
  onAction,
}: {
  task: Task;
  onAction: (id: string, action: "start" | "complete" | "cancel") => void;
}) {
  const isOpen = task.status === "PENDING" || task.status === "IN_PROGRESS" || task.status === "BLOCKED";

  return (
    <article
      style={{
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${priorityColor[task.priority]}`,
        borderRadius: 12,
        padding: "20px",
      }}
    >
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>📋</span>
        <span
          style={{
            color: priorityColor[task.priority],
            fontSize: 11,
            fontWeight: 850,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {priorityLabel[task.priority]}
        </span>
        <span style={{ color: "var(--text-soft)", fontSize: 11 }}>• {categoryLabel(task.category)}</span>
        <span
          style={{
            background: statusColor[task.status] + "15",
            borderRadius: 12,
            color: statusColor[task.status],
            fontSize: 11,
            fontWeight: 750,
            marginLeft: "auto",
            padding: "4px 10px",
            textTransform: "uppercase",
          }}
        >
          {statusLabel[task.status]}
        </span>
      </div>

      <h2
        style={{
          color: "var(--text)",
          fontSize: "1.15rem",
          fontWeight: 850,
          lineHeight: 1.25,
          margin: "0 0 8px",
        }}
      >
        {task.title}
      </h2>
      <p style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.55, margin: "0 0 16px" }}>
        {task.description}
      </p>

      {task.dueDate && (
        <p style={{ color: "var(--text-soft)", fontSize: 13, margin: "0 0 16px" }}>
          Vence: {new Date(task.dueDate).toLocaleDateString("es-CL")}
        </p>
      )}

      {isOpen && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {task.status === "PENDING" && (
            <button
              onClick={() => onAction(task.id, "start")}
              style={{
                background: "var(--accent)",
                border: "none",
                borderRadius: 8,
                color: "var(--text)",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 850,
                padding: "10px 16px",
              }}
            >
              Iniciar
            </button>
          )}
          {task.status === "IN_PROGRESS" && (
            <button
              onClick={() => onAction(task.id, "complete")}
              style={{
                background: "var(--accent)",
                border: "none",
                borderRadius: 8,
                color: "var(--text)",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 850,
                padding: "10px 16px",
              }}
            >
              Completar
            </button>
          )}
          <button
            onClick={() => onAction(task.id, "cancel")}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-soft)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 750,
              padding: "9px 14px",
            }}
          >
            Cancelar
          </button>
        </div>
      )}
    </article>
  );
}

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div
      style={{
        background: "var(--bg-sunken)",
        border: "1px dashed var(--border)",
        borderRadius: 12,
        padding: "40px 28px",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 28, margin: "0 0 10px" }}>✅</p>
      <h2
        style={{
          color: "var(--text)",
          fontSize: "1.15rem",
          fontWeight: 850,
          margin: "0 0 8px",
        }}
      >
        Sin tareas activas
      </h2>
      <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.55, margin: "0 0 18px" }}>
        No tienes tareas pendientes. Puedes generarlas automáticamente desde tus recomendaciones.
      </p>
      <button
        onClick={onGenerate}
        style={{
          background: "var(--accent)",
          border: "none",
          borderRadius: 8,
          color: "var(--text)",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 850,
          padding: "10px 16px",
        }}
      >
        Generar tareas
      </button>
    </div>
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
    case "SECURITY":
      return "Seguridad";
    default:
      return category;
  }
}
