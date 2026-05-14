"use client";

import { useEffect, useState } from "react";
import AppScreen from "@/shared/components/AppScreen";

type Log = {
  id: string;
  action: string;
  actorEmail: string | null;
  actorId: string | null;
  targetUserEmail: string | null;
  targetUserId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/audit", {
          credentials: "include",
        });

        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.message || "Error de auditoría");
        }

        setLogs(payload.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <AppScreen
      title="Auditoría administrativa"
      description="Trazabilidad operacional de eventos administrativos críticos."
    >
      {loading ? <div>Cargando auditoría...</div> : null}

      {error ? <div>{error}</div> : null}

      {!loading && !error ? (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 1400,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Acción</th>
                <th>Actor</th>
                <th>Target</th>
                <th>IP</th>
                <th>UserAgent</th>
                <th>Metadata</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString("es-CL")}</td>
                  <td>{log.action}</td>
                  <td>
                    <div>{log.actorEmail ?? "-"}</div>
                    <div>{log.actorId ?? "-"}</div>
                  </td>
                  <td>
                    <div>{log.targetUserEmail ?? "-"}</div>
                    <div>{log.targetUserId ?? "-"}</div>
                  </td>
                  <td>{log.ipAddress ?? "-"}</td>
                  <td>{log.userAgent ?? "-"}</td>
                  <td>
                    <pre>
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </AppScreen>
  );
}
