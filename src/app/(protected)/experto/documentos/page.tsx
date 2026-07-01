"use client";

import { useEffect, useState } from "react";

type DocumentItem = {
  id: string;
  userId: string;
  category: string;
  type: string;
  status: string;
  name: string;
  description: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  tags: string[];
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  createdAt: string;
  updatedAt: string;
};

const categories = [
  { value: "", label: "Todas" },
  { value: "TAX", label: "Tributario" },
  { value: "DTE", label: "DTE" },
  { value: "SII", label: "SII" },
  { value: "BILLING", label: "Suscripción" },
  { value: "AUDIT", label: "Auditoría" },
  { value: "TASK", label: "Tarea" },
  { value: "REPORT", label: "Reporte" },
  { value: "LEGAL", label: "Legal" },
  { value: "OTHER", label: "Otro" },
];

const statuses = [
  { value: "", label: "Todos" },
  { value: "ACTIVE", label: "Activo" },
  { value: "ARCHIVED", label: "Archivado" },
  { value: "DELETED", label: "Eliminado" },
];

const types = [
  { value: "", label: "Todos" },
  { value: "PDF", label: "PDF" },
  { value: "XML", label: "XML" },
  { value: "CSV", label: "CSV" },
  { value: "XLSX", label: "Excel" },
  { value: "JSON", label: "JSON" },
  { value: "TXT", label: "Texto" },
  { value: "IMAGE", label: "Imagen" },
];

const categoryLabel: Record<string, string> = Object.fromEntries(
  categories.filter((c) => c.value).map((c) => [c.value, c.label]),
);

const statusLabel: Record<string, string> = {
  ACTIVE: "Activo",
  ARCHIVED: "Archivado",
  DELETED: "Eliminado",
};

const statusColor: Record<string, string> = {
  ACTIVE: "var(--accent)",
  ARCHIVED: "var(--warn)",
  DELETED: "var(--loss)",
};

export default function ExpertDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (status) params.set("status", status);
        if (type) params.set("type", type);
        if (userId) params.set("userId", userId);

        const res = await fetch(`/api/documents/admin?${params.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (!json.ok) throw new Error(json.message || "Error cargando documentos.");
        setDocuments(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [category, status, type, userId]);

  function formatSize(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  }

  return (
    <section style={{ padding: "24px 0" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 850, margin: "0 0 8px" }}>Centro Documental</h1>
        <p style={{ color: "var(--text-soft)", margin: 0 }}>
          Vista centralizada de todos los documentos almacenados por los usuarios.
        </p>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <Select label="Categoría" value={category} options={categories} onChange={setCategory} />
        <Select label="Estado" value={status} options={statuses} onChange={setStatus} />
        <Select label="Tipo" value={type} options={types} onChange={setType} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 200 }}>
          <label style={{ color: "var(--text-soft)", fontSize: 12, fontWeight: 700 }}>Usuario</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Filtrar por userId"
            style={{
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text)",
              fontSize: 14,
              padding: "8px 12px",
            }}
          />
        </div>
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
        <p style={{ color: "var(--text-soft)" }}>Cargando documentos…</p>
      ) : documents.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>Sin documentos para los filtros seleccionados.</p>
      ) : (
        <div
          style={{
            background: "var(--bg-elev)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-sunken)", color: "var(--text-soft)", textAlign: "left" }}>
                <th style={{ padding: "12px 16px" }}>Usuario</th>
                <th style={{ padding: "12px 16px" }}>Nombre</th>
                <th style={{ padding: "12px 16px" }}>Categoría</th>
                <th style={{ padding: "12px 16px" }}>Tipo</th>
                <th style={{ padding: "12px 16px" }}>Estado</th>
                <th style={{ padding: "12px 16px" }}>Tamaño</th>
                <th style={{ padding: "12px 16px" }}>Fecha</th>
                <th style={{ padding: "12px 16px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px", color: "var(--text)", fontWeight: 600 }}>{d.userId}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 700, color: "var(--text)" }}>{d.name}</div>
                    <div style={{ color: "var(--text-soft)", fontSize: 12 }}>{d.fileName}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>{categoryLabel[d.category] ?? d.category}</td>
                  <td style={{ padding: "12px 16px" }}>{d.type}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        background: statusColor[d.status] + "15",
                        borderRadius: 12,
                        color: statusColor[d.status],
                        fontSize: 11,
                        fontWeight: 750,
                        padding: "4px 10px",
                        textTransform: "uppercase",
                      }}
                    >
                      {statusLabel[d.status] ?? d.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>{formatSize(d.fileSize)}</td>
                  <td style={{ padding: "12px 16px", color: "var(--text-soft)" }}>
                    {new Date(d.createdAt).toLocaleDateString("es-CL")}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <a
                      href={`/api/documents/${d.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: "var(--bg-sunken)",
                        borderRadius: 6,
                        color: "var(--text)",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "6px 10px",
                        textDecoration: "none",
                      }}
                    >
                      Descargar
                    </a>
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
      <label style={{ color: "var(--text-soft)", fontSize: 12, fontWeight: 700 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "var(--bg-elev)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          color: "var(--text)",
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
