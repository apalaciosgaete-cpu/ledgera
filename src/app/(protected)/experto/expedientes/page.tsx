"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TaxFileListItem = {
  userId: string;
  userEmail: string;
  userName: string;
  status: "HEALTHY" | "ATTENTION_REQUIRED" | "HIGH_RISK" | "CRITICAL";
  riskScore: number | null;
  riskLevel: string | null;
  smartScore: number | null;
  smartLevel: string | null;
  openAlerts: number;
  pendingTasks: number;
  plan: string;
  generatedAt: string;
};

const statusLabel: Record<TaxFileListItem["status"], string> = {
  HEALTHY: "Saludable",
  ATTENTION_REQUIRED: "Atención",
  HIGH_RISK: "Alto riesgo",
  CRITICAL: "Crítico",
};

const statusColor: Record<TaxFileListItem["status"], string> = {
  HEALTHY: "#15803D",
  ATTENTION_REQUIRED: "#B45309",
  HIGH_RISK: "#DC2626",
  CRITICAL: "#991B1B",
};

const statuses = [
  { value: "", label: "Todos" },
  { value: "HEALTHY", label: "Saludable" },
  { value: "ATTENTION_REQUIRED", label: "Atención" },
  { value: "HIGH_RISK", label: "Alto riesgo" },
  { value: "CRITICAL", label: "Crítico" },
];

export default function ExpertTaxFilesPage() {
  const [files, setFiles] = useState<TaxFileListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const params = status ? `?status=${status}` : "";
        const res = await fetch(`/api/tax-files${params}`, { cache: "no-store" });
        const json = await res.json();
        if (!json.ok) throw new Error(json.message || "Error cargando expedientes.");
        setFiles(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [status]);

  return (
    <section style={{ padding: "24px 0" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 850, margin: "0 0 8px" }}>
          Expedientes tributarios
        </h1>
        <p style={{ color: "#64748B", margin: 0 }}>
          Vista unificada del estado tributario de cada usuario.
        </p>
      </header>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <Select label="Estado" value={status} options={statuses} onChange={setStatus} />
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
        <p style={{ color: "#64748B" }}>Cargando expedientes…</p>
      ) : files.length === 0 ? (
        <p style={{ color: "#64748B" }}>Sin expedientes para los filtros seleccionados.</p>
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
                <th style={{ padding: "12px 16px" }}>Estado</th>
                <th style={{ padding: "12px 16px" }}>Riesgo</th>
                <th style={{ padding: "12px 16px" }}>Score</th>
                <th style={{ padding: "12px 16px" }}>Alertas</th>
                <th style={{ padding: "12px 16px" }}>Tareas</th>
                <th style={{ padding: "12px 16px" }}>Plan</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.userId} style={{ borderTop: "1px solid #E2E8F0" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <Link
                      href={`/experto/expedientes/${f.userId}`}
                      style={{
                        color: "#0F2A3D",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      {f.userName || f.userEmail}
                    </Link>
                    <div style={{ color: "#94A3B8", fontSize: 12 }}>{f.userId}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusBadge status={f.status} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {f.riskScore ?? "—"} {f.riskLevel ? `(${f.riskLevel})` : ""}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {f.smartScore ?? "—"} {f.smartLevel ? `(${f.smartLevel})` : ""}
                  </td>
                  <td style={{ padding: "12px 16px" }}>{f.openAlerts}</td>
                  <td style={{ padding: "12px 16px" }}>{f.pendingTasks}</td>
                  <td style={{ padding: "12px 16px" }}>{f.plan}</td>
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

function StatusBadge({ status }: { status: TaxFileListItem["status"] }) {
  return (
    <span
      style={{
        background: statusColor[status] + "15",
        borderRadius: 12,
        color: statusColor[status],
        fontSize: 11,
        fontWeight: 750,
        padding: "4px 10px",
        textTransform: "uppercase",
      }}
    >
      {statusLabel[status]}
    </span>
  );
}
