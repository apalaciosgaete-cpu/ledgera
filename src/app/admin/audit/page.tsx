"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppScreen from "@/shared/components/AppScreen";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";

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

type AuditResponse = {
  ok: boolean;
  message: string;
  data: Log[];
};

const ACTION_OPTIONS = [
  "ALL",
  "ADMIN_LOGIN",
  "ADMIN_LOGOUT",
  "USER_SUBSCRIPTION_UPDATED",
  "USER_SUSPENDED",
  "USER_REACTIVATED",
  "USER_DELETED",
];

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-CL");
}

function stringifyMetadata(value: unknown) {
  if (!value) return "-";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function buildCsvValue(value: unknown) {
  const text = String(value ?? "");

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function exportLogsToCsv(logs: Log[]) {
  const rows = [
    [
      "Fecha",
      "Acción",
      "Actor email",
      "Actor ID",
      "Target email",
      "Target ID",
      "IP",
      "User agent",
      "Metadata",
    ],
    ...logs.map((log) => [
      log.createdAt,
      log.action,
      log.actorEmail ?? "",
      log.actorId ?? "",
      log.targetUserEmail ?? "",
      log.targetUserId ?? "",
      log.ipAddress ?? "",
      log.userAgent ?? "",
      stringifyMetadata(log.metadata),
    ]),
  ];

  const csv =
    "\uFEFF" +
    rows.map((row) => row.map(buildCsvValue).join(",")).join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `ledgera-admin-audit-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export default function AdminAuditPage() {
  const router = useRouter();

  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        setError(null);

        const payload =
          await httpClient<AuditResponse>("/api/admin/audit?limit=250");

        setLogs(payload.data ?? []);
      } catch (err) {
        if (isHttpClientError(err)) {
          if (err.status === 401) {
            router.push("/login");
            return;
          }

          if (err.status === 403) {
            setError("Acceso denegado. Se requiere rol administrador.");
            return;
          }

          if (err.status === 429) {
            setError(
              err.retryAfterSeconds
                ? `Demasiadas solicitudes. Intenta nuevamente en ${err.retryAfterSeconds} segundos.`
                : "Demasiadas solicitudes. Intenta nuevamente más tarde.",
            );
            return;
          }

          setError(err.message);
          return;
        }

        setError("Error inesperado al cargar auditoría.");
      } finally {
        setLoading(false);
      }
    }

    void loadLogs();
  }, [router]);

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return logs.filter((log) => {
      const actionMatch = action === "ALL" || log.action === action;

      if (!actionMatch) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchable = [
        log.action,
        log.actorEmail,
        log.actorId,
        log.targetUserEmail,
        log.targetUserId,
        log.ipAddress,
        log.userAgent,
        stringifyMetadata(log.metadata),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [logs, query, action]);

  return (
    <AppScreen
      title="Auditoría administrativa"
      description="Trazabilidad operacional de eventos administrativos críticos."
    >
      <div style={{ display: "grid", gap: 16 }}>
        <section
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por actor, target, IP, user agent o metadata"
              style={{
                minWidth: 340,
                padding: "10px 12px",
                border: "1px solid #CBD5E1",
                borderRadius: 8,
                fontSize: 14,
              }}
            />

            <select
              value={action}
              onChange={(event) => setAction(event.target.value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #CBD5E1",
                borderRadius: 8,
                fontSize: 14,
                background: "#FFFFFF",
              }}
            >
              {ACTION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "Todas las acciones" : option}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => exportLogsToCsv(filteredLogs)}
            disabled={filteredLogs.length === 0}
            style={{
              padding: "10px 14px",
              border: "1px solid #CBD5E1",
              borderRadius: 8,
              background: "#FFFFFF",
              cursor:
                filteredLogs.length === 0 ? "not-allowed" : "pointer",
              fontSize: 14,
            }}
          >
            Exportar CSV
          </button>
        </section>

        <section
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            color: "#475569",
            fontSize: 13,
          }}
        >
          <span>Total cargado: {logs.length}</span>
          <span>Filtrado: {filteredLogs.length}</span>
        </section>

        {loading ? <div>Cargando auditoría...</div> : null}

        {error ? (
          <div
            style={{
              border: "1px solid #FCA5A5",
              background: "#FEF2F2",
              color: "#991B1B",
              padding: 12,
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          <div
            style={{
              overflowX: "auto",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: 1500,
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  {[
                    "Fecha",
                    "Acción",
                    "Actor",
                    "Target",
                    "IP",
                    "User agent",
                    "Metadata",
                  ].map((header) => (
                    <th
                      key={header}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        borderBottom: "1px solid #E2E8F0",
                        color: "#334155",
                        fontWeight: 700,
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: 24,
                        color: "#64748B",
                      }}
                    >
                      No hay registros para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const expanded = expandedId === log.id;

                    return (
                      <tr
                        key={log.id}
                        style={{
                          borderBottom: "1px solid #E2E8F0",
                        }}
                      >
                        <td
                          style={{
                            padding: "12px 14px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDate(log.createdAt)}
                        </td>

                        <td
                          style={{
                            padding: "12px 14px",
                            fontWeight: 700,
                          }}
                        >
                          {log.action}
                        </td>

                        <td style={{ padding: "12px 14px" }}>
                          <div>{log.actorEmail ?? "-"}</div>
                          <div
                            style={{
                              color: "#94A3B8",
                              fontSize: 11,
                            }}
                          >
                            {log.actorId ?? "-"}
                          </div>
                        </td>

                        <td style={{ padding: "12px 14px" }}>
                          <div>{log.targetUserEmail ?? "-"}</div>
                          <div
                            style={{
                              color: "#94A3B8",
                              fontSize: 11,
                            }}
                          >
                            {log.targetUserId ?? "-"}
                          </div>
                        </td>

                        <td
                          style={{
                            padding: "12px 14px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {log.ipAddress ?? "-"}
                        </td>

                        <td
                          style={{
                            padding: "12px 14px",
                            maxWidth: 360,
                          }}
                        >
                          <div
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={log.userAgent ?? undefined}
                          >
                            {log.userAgent ?? "-"}
                          </div>
                        </td>

                        <td
                          style={{
                            padding: "12px 14px",
                            minWidth: 320,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(expanded ? null : log.id)
                            }
                            style={{
                              border: "1px solid #CBD5E1",
                              background: "#FFFFFF",
                              borderRadius: 6,
                              padding: "6px 10px",
                              cursor: "pointer",
                              fontSize: 12,
                              marginBottom: expanded ? 8 : 0,
                            }}
                          >
                            {expanded
                              ? "Ocultar metadata"
                              : "Ver metadata"}
                          </button>

                          {expanded ? (
                            <pre
                              style={{
                                margin: 0,
                                maxWidth: 520,
                                maxHeight: 260,
                                overflow: "auto",
                                whiteSpace: "pre-wrap",
                                background: "#0F172A",
                                color: "#E2E8F0",
                                borderRadius: 8,
                                padding: 12,
                                fontSize: 12,
                              }}
                            >
                              {stringifyMetadata(log.metadata)}
                            </pre>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </AppScreen>
  );
}