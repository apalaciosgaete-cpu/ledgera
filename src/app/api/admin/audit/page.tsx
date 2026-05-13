"use client";

import { useEffect, useState } from "react";

type AuditLog = {
  id: string;
  action: string;
  actor_email: string | null;
  target_user_email: string | null;
  metadata: string | null;
  created_at: string;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const response = await fetch("/api/admin/audit");

      const result = await response.json();

      if (result.ok) {
        setLogs(result.data ?? []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white p-6 text-black">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            Auditoría administrativa
          </h1>

          <p className="mt-2 text-sm text-neutral-600">
            Registro de acciones críticas realizadas por administradores.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Acción</th>
                <th className="px-4 py-3 text-left">Actor</th>
                <th className="px-4 py-3 text-left">Objetivo</th>
                <th className="px-4 py-3 text-left">Metadata</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center"
                  >
                    Cargando auditoría...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center"
                  >
                    No existen registros.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-neutral-200"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("es-CL")}
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {log.action}
                    </td>

                    <td className="px-4 py-3">
                      {log.actor_email ?? "-"}
                    </td>

                    <td className="px-4 py-3">
                      {log.target_user_email ?? "-"}
                    </td>

                    <td className="px-4 py-3">
                      <pre className="max-w-105px overflow-x-auto whitespace-pre-wrap text-xs">
                        {log.metadata ?? "-"}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}