"use client";

import { useEffect, useState } from "react";

type AuditLog = {
  id: string;
  year: number;
  action: string;
  reason: string | null;
  actorId: string | null;
  actorEmail: string | null;
  metadata: any;
  createdAt: string;
};

type Snapshot = {
  id: string;
  contentHash: string;
  createdAt: string;
};

export default function TaxAuditPage() {
  const currentYear = new Date().getFullYear();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);
  const [verifyingHash, setVerifyingHash] = useState<string | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      const [auditRes, snapshotRes] = await Promise.all([
        fetch(`/api/tax/periods/audit?year=${currentYear}`, {
          headers: { Authorization: `Bearer ${token ?? ""}` },
        }),
        fetch(`/api/tax/periods/snapshots?year=${currentYear}`, {
          headers: { Authorization: `Bearer ${token ?? ""}` },
        }),
      ]);

      const auditJson = await auditRes.json();
      const snapshotJson = await snapshotRes.json();

      if (!auditJson.ok) throw new Error(auditJson.message);
      if (!snapshotJson.ok) throw new Error(snapshotJson.message);

      setLogs(auditJson.data.logs ?? []);
      setSnapshots(snapshotJson.data.snapshots ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error cargando auditoría.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function verifySnapshot(hash: string) {
    try {
      setVerifyingHash(hash);
      setVerifyResult(null);

      const token = localStorage.getItem("token");

      const res = await fetch(
        `/api/tax/periods/snapshots/verify?hash=${hash}`,
        {
          headers: {
            Authorization: `Bearer ${token ?? ""}`,
          },
        },
      );

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.message || "No válido");
      }

      setVerifyResult("Snapshot válido e íntegro.");
    } catch (err) {
      setVerifyResult(
        err instanceof Error
          ? err.message
          : "Error verificando snapshot.",
      );
    } finally {
      setVerifyingHash(null);
    }
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("es-CL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function getActionLabel(action: string) {
    if (action === "CLOSE") return "Cierre";
    if (action === "REOPEN") return "Reapertura";
    return action;
  }

  return (
    <section className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Auditoría de período tributario
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Historial de cierres, reaperturas y snapshots del período{" "}
          {currentYear}.
        </p>
      </div>

      {loading && (
        <div className="border p-4 rounded text-sm">
          Cargando auditoría...
        </div>
      )}

      {error && (
        <div className="border p-4 rounded bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* LOGS */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Historial de eventos</h2>

            {logs.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay eventos registrados.
              </p>
            ) : (
              <div className="border rounded overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Fecha</th>
                      <th className="p-2 text-left">Acción</th>
                      <th className="p-2 text-left">Motivo</th>
                      <th className="p-2 text-left">Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-t">
                        <td className="p-2">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="p-2">
                          {getActionLabel(log.action)}
                        </td>
                        <td className="p-2">{log.reason ?? "-"}</td>
                        <td className="p-2">
                          {log.actorEmail ?? "Sistema"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SNAPSHOTS */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Snapshots de cierre</h2>

            {snapshots.length === 0 ? (
              <p className="text-sm text-gray-500">
                No existen snapshots para este período.
              </p>
            ) : (
              <div className="border rounded overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Fecha</th>
                      <th className="p-2 text-left">Hash</th>
                      <th className="p-2 text-left">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.map((snap) => (
                      <tr key={snap.id} className="border-t">
                        <td className="p-2">
                          {formatDate(snap.createdAt)}
                        </td>
                        <td className="p-2 break-all text-xs">
                          {snap.contentHash}
                        </td>
                        <td className="p-2">
                          <button
                            className="px-3 py-1 border rounded text-xs disabled:opacity-50"
                            onClick={() =>
                              verifySnapshot(snap.contentHash)
                            }
                            disabled={verifyingHash === snap.contentHash}
                          >
                            {verifyingHash === snap.contentHash
                              ? "Verificando..."
                              : "Verificar"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {verifyResult && (
              <div className="border rounded p-3 text-sm bg-blue-50 text-blue-700">
                {verifyResult}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}