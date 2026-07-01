"use client";

import { useEffect, useRef, useState } from "react";

type DocumentItem = {
  id: string;
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

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, tax: 0, pendingReview: 0, last30Days: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      if (type) params.set("type", type);

      const [docsRes, metricsRes] = await Promise.all([
        fetch(`/api/documents?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/documents/metrics", { cache: "no-store" }),
      ]);

      const docsJson = await docsRes.json();
      const metricsJson = await metricsRes.json();

      if (!docsJson.ok) throw new Error(docsJson.message || "Error cargando documentos.");
      if (!metricsJson.ok) throw new Error(metricsJson.message || "Error cargando métricas.");

      setDocuments(docsJson.data ?? []);
      setMetrics(metricsJson.data ?? { total: 0, tax: 0, pendingReview: 0, last30Days: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [category, status, type]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (!formData.get("file") || (formData.get("file") as File).size === 0) {
      setError("Debes seleccionar un archivo.");
      return;
    }

    try {
      setUploading(true);
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Error subiendo documento.");
      form.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setUploading(false);
    }
  }

  async function handleArchive(id: string) {
    setError("");
    try {
      const res = await fetch(`/api/documents/${id}/archive`, { method: "POST" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Error archivando documento.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este documento? Se marcará como eliminado.")) return;
    setError("");
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Error eliminando documento.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    }
  }

  function formatSize(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  }

  return (
    <section style={{ maxWidth: 1000, width: "100%" }}>
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
          Centro Documental
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
          Tus documentos tributarios
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          Almacena, organiza y descarga toda la documentación de tu expediente.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <MetricCard label="Total documentos" value={metrics.total} />
        <MetricCard label="Documentos tributarios" value={metrics.tax} />
        <MetricCard label="Pendientes de revisión" value={metrics.pendingReview} />
        <MetricCard label="Últimos 30 días" value={metrics.last30Days} />
      </div>

      <div
        style={{
          background: "var(--bg-elev)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>Subir documento</h2>
        <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label style={{ color: "var(--text-soft)", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>
                Archivo
              </label>
              <input
                ref={fileRef}
                type="file"
                name="file"
                required
                style={{ width: "100%" }}
              />
            </div>
            <Select label="Categoría" name="category" options={categories.filter((c) => c.value)} defaultValue="TAX" />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label style={{ color: "var(--text-soft)", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>
                Nombre
              </label>
              <input
                type="text"
                name="name"
                placeholder="Nombre descriptivo"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label style={{ color: "var(--text-soft)", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>
                Etiquetas
              </label>
              <input
                type="text"
                name="tags"
                placeholder="separadas por comas"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 14,
                }}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={uploading}
            style={{
              alignSelf: "flex-start",
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
            {uploading ? "Subiendo…" : "Subir documento"}
          </button>
        </form>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <Select label="Categoría" value={category} options={categories} onChange={setCategory} />
        <Select label="Estado" value={status} options={statuses} onChange={setStatus} />
        <Select label="Tipo" value={type} options={types} onChange={setType} />
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
        <p style={{ color: "var(--text-soft)" }}>No hay documentos para los filtros seleccionados.</p>
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
                    <div style={{ display: "flex", gap: 8 }}>
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
                      {d.status === "ACTIVE" && (
                        <button
                          onClick={() => handleArchive(d.id)}
                          style={{
                            background: "rgba(232,184,75,0.14)",
                            border: "none",
                            borderRadius: 6,
                            color: "var(--warn)",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 700,
                            padding: "6px 10px",
                          }}
                        >
                          Archivar
                        </button>
                      )}
                      {d.status !== "DELETED" && (
                        <button
                          onClick={() => handleDelete(d.id)}
                          style={{
                            background: "rgba(196,99,74,0.14)",
                            border: "none",
                            borderRadius: 6,
                            color: "var(--loss)",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 700,
                            padding: "6px 10px",
                          }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
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

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ color: "var(--text-soft)", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{label}</div>
      <div style={{ color: "var(--text)", fontSize: "1.75rem", fontWeight: 850 }}>{value}</div>
    </div>
  );
}

function Select({
  label,
  name,
  value,
  options,
  onChange,
  defaultValue,
}: {
  label: string;
  name?: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
  defaultValue?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 160 }}>
      <label style={{ color: "var(--text-soft)", fontSize: 12, fontWeight: 700 }}>{label}</label>
      <select
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
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
