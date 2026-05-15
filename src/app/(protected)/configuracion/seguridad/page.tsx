"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  httpClient,
  isHttpClientError,
} from "@/shared/http/httpClient";

type SessionItem = {
  id: string;
  tokenPreview: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

type SessionsResponse = {
  ok: boolean;
  data: SessionItem[];
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function SeguridadPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const secondarySessionsCount = useMemo(() => {
    return sessions.filter(
      (session) => !session.isCurrent,
    ).length;
  }, [sessions]);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await httpClient("/api/csrf", {
        method: "GET",
      });

      const response =
        await httpClient<SessionsResponse>(
          "/api/sessions",
          {
            method: "GET",
            auth: true,
          },
        );

      setSessions(response.data ?? []);
    } catch (err) {
      console.error(err);

      if (isHttpClientError(err)) {
        setError(err.message);
      } else {
        setError(
          "No fue posible obtener las sesiones activas.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  async function closeSession(sessionId: string) {
    try {
      setProcessingId(sessionId);
      setMessage(null);
      setError(null);

      await httpClient(
        `/api/sessions/${sessionId}`,
        {
          method: "DELETE",
          auth: true,
        },
      );

      setSessions((current) =>
        current.filter(
          (session) => session.id !== sessionId,
        ),
      );

      setMessage(
        "Sesión cerrada correctamente.",
      );
    } catch (err) {
      console.error(err);

      if (isHttpClientError(err)) {
        setError(err.message);
      } else {
        setError(
          "No fue posible cerrar la sesión.",
        );
      }
    } finally {
      setProcessingId(null);
    }
  }

  async function closeOtherSessions() {
    try {
      setProcessingId("ALL");
      setMessage(null);
      setError(null);

      await httpClient("/api/sessions", {
        method: "DELETE",
        auth: true,
      });

      setSessions((current) =>
        current.filter(
          (session) => session.isCurrent,
        ),
      );

      setMessage(
        "Las otras sesiones fueron cerradas correctamente.",
      );
    } catch (err) {
      console.error(err);

      if (isHttpClientError(err)) {
        setError(err.message);
      } else {
        setError(
          "No fue posible cerrar las otras sesiones.",
        );
      }
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0B1020",
        color: "#F8FAFC",
        padding: "48px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gap: "24px",
        }}
      >
        <header>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            Seguridad y sesiones
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#94A3B8",
            }}
          >
            Administra sesiones activas y accesos
            secundarios de tu cuenta LEDGERA.
          </p>
        </header>

        <section
          style={{
            border: "1px solid #1E293B",
            background: "#020617",
            borderRadius: "18px",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                }}
              >
                Sesiones activas
              </h2>

              <p
                style={{
                  marginTop: "6px",
                  color: "#94A3B8",
                  fontSize: "14px",
                }}
              >
                Puedes cerrar sesiones secundarias si
                detectas accesos no autorizados.
              </p>
            </div>

            <button
              type="button"
              onClick={closeOtherSessions}
              disabled={
                secondarySessionsCount === 0 ||
                processingId === "ALL"
              }
              style={{
                border:
                  "1px solid rgba(239,68,68,0.45)",
                background:
                  "rgba(239,68,68,0.12)",
                color: "#FCA5A5",
                borderRadius: "12px",
                padding: "10px 14px",
                cursor:
                  secondarySessionsCount === 0 ||
                  processingId === "ALL"
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  secondarySessionsCount === 0 ||
                  processingId === "ALL"
                    ? 0.6
                    : 1,
              }}
            >
              {processingId === "ALL"
                ? "Cerrando sesiones..."
                : "Cerrar otras sesiones"}
            </button>
          </div>

          {message ? (
            <div
              style={{
                marginTop: "16px",
                border:
                  "1px solid rgba(16,185,129,0.35)",
                background:
                  "rgba(16,185,129,0.12)",
                color: "#A7F3D0",
                borderRadius: "12px",
                padding: "12px 14px",
              }}
            >
              {message}
            </div>
          ) : null}

          {error ? (
            <div
              style={{
                marginTop: "16px",
                border:
                  "1px solid rgba(239,68,68,0.35)",
                background:
                  "rgba(239,68,68,0.12)",
                color: "#FCA5A5",
                borderRadius: "12px",
                padding: "12px 14px",
              }}
            >
              {error}
            </div>
          ) : null}

          {loading ? (
            <div
              style={{
                marginTop: "24px",
                color: "#94A3B8",
              }}
            >
              Cargando sesiones activas...
            </div>
          ) : null}

          {!loading && sessions.length > 0 ? (
            <div
              style={{
                marginTop: "24px",
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      color: "#94A3B8",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "12px" }}>
                      Sesión
                    </th>

                    <th style={{ padding: "12px" }}>
                      Creada
                    </th>

                    <th style={{ padding: "12px" }}>
                      Expira
                    </th>

                    <th style={{ padding: "12px" }}>
                      Estado
                    </th>

                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                      }}
                    >
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sessions.map((session) => (
                    <tr
                      key={session.id}
                      style={{
                        borderTop:
                          "1px solid #1E293B",
                      }}
                    >
                      <td
                        style={{
                          padding: "14px 12px",
                          fontFamily: "monospace",
                          fontSize: "12px",
                        }}
                      >
                        {session.tokenPreview}
                      </td>

                      <td
                        style={{
                          padding: "14px 12px",
                        }}
                      >
                        {formatDate(
                          session.createdAt,
                        )}
                      </td>

                      <td
                        style={{
                          padding: "14px 12px",
                        }}
                      >
                        {formatDate(
                          session.expiresAt,
                        )}
                      </td>

                      <td
                        style={{
                          padding: "14px 12px",
                        }}
                      >
                        {session.isCurrent
                          ? "Actual"
                          : "Secundaria"}
                      </td>

                      <td
                        style={{
                          padding: "14px 12px",
                          textAlign: "right",
                        }}
                      >
                        {!session.isCurrent ? (
                          <button
                            type="button"
                            onClick={() =>
                              closeSession(
                                session.id,
                              )
                            }
                            disabled={
                              processingId ===
                              session.id
                            }
                            style={{
                              border:
                                "1px solid rgba(239,68,68,0.45)",
                              background:
                                "rgba(239,68,68,0.12)",
                              color: "#FCA5A5",
                              borderRadius: "10px",
                              padding:
                                "8px 12px",
                              cursor:
                                processingId ===
                                session.id
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                processingId ===
                                session.id
                                  ? 0.6
                                  : 1,
                            }}
                          >
                            {processingId ===
                            session.id
                              ? "Cerrando..."
                              : "Cerrar"}
                          </button>
                        ) : (
                          <span
                            style={{
                              color: "#94A3B8",
                              fontSize: "12px",
                            }}
                          >
                            Sesión actual
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {!loading &&
          sessions.length === 0 ? (
            <div
              style={{
                marginTop: "24px",
                color: "#94A3B8",
              }}
            >
              No existen sesiones activas.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}