"use client";

import { useEffect, useMemo, useState } from "react";
import { ui } from "@/styles/design-system";

type AuditAction =
  | "DECLARATION_CREATED"
  | "DECLARATION_REVIEWED"
  | "DECLARATION_CONFIRMED"
  | "DECLARATION_VOIDED"
  | "DECLARATION_EXPORTED"
  | "DECLARATION_INTEGRITY_VERIFIED";

type AuditLog = {
  id: string;
  userId: string;
  declarationId: string;
  action: AuditAction;
  actorId: string | null;
  actorEmail: string | null;
  taxYear: number;
  declarationType: string;
  statusFrom: string | null;
  statusTo: string | null;
  contentHash: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: string | null;
  createdAt: string;
};

type AuditResponse = {
  ok: boolean;
  message: string;
  data: {
    logs: AuditLog[];
  };
};

const AUDIT_ACTIONS: { value: AuditAction; label: string }[] = [
  { value: "DECLARATION_CREATED", label: "Creación" },
  { value: "DECLARATION_REVIEWED", label: "Revisión" },
  { value: "DECLARATION_CONFIRMED", label: "Confirmación" },
  { value: "DECLARATION_VOIDED", label: "Anulación" },
  { value: "DECLARATION_EXPORTED", label: "Exportación" },
  { value: "DECLARATION_INTEGRITY_VERIFIED", label: "Verificación" },
];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("es-CL");
}

function parseMetadata(value: string | null): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }

    return null;
  } catch {
    return null;
  }
}

function actionLabel(action: AuditAction) {
  return AUDIT_ACTIONS.find((item) => item.value === action)?.label ?? action;
}

function actionBadge(action: AuditAction) {
  if (
    action === "DECLARATION_CONFIRMED" ||
    action === "DECLARATION_EXPORTED"
  ) {
    return ui.badgeOk;
  }

  if (action === "DECLARATION_VOIDED") {
    return ui.badgeRisk;
  }

  if (
    action === "DECLARATION_REVIEWED" ||
    action === "DECLARATION_INTEGRITY_VERIFIED"
  ) {
    return ui.badgeWarning;
  }

  return "border border-(--color-border) bg-[var(--color-surface-alt)] text-(--color-text-secondary)";
}

function declarationTypeLabel(type: string) {
  switch (type) {
    case "DJ_CRYPTO_SUMMARY":
      return "Resumen cripto";
    case "DJ_REALIZED_GAINS":
      return "Ganancias realizadas";
    case "DJ_FOREIGN_EXCHANGE_ACTIVITY":
      return "Actividad en exchanges extranjeros";
    case "DJ_TAX_SUPPORTING_LEDGER":
      return "Libro auxiliar tributario";
    default:
      return type;
  }
}

export default function TaxDeclarationsAuditPage() {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(String(currentYear));
  const [action, setAction] = useState("");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortedLogs = useMemo(() => {
    return [...logs].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [logs]);

  async function loadAuditLogs() {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const searchParams = new URLSearchParams();

      if (year.trim()) {
        searchParams.set("year", year.trim());
      }

      if (action) {
        searchParams.set("action", action);
      }

      const response = await fetch(
        `/api/tax/declarations/audit?${searchParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token ?? ""}`,
          },
          credentials: "include",
          cache: "no-store",
        },
      );

      const json = (await response.json()) as AuditResponse;

      if (!response.ok || !json.ok) {
        throw new Error(json.message || "No fue posible cargar auditoría DDJJ.");
      }

      setLogs(json.data.logs ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar auditoría DDJJ.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className={ui.page}>
      <div>
        <h1 className={ui.title}>Auditoría DDJJ</h1>
        <p className={ui.subtitle}>
          Registro operacional de declaraciones juradas, verificaciones,
          exportaciones y cambios de estado.
        </p>
      </div>

      <div className={`${ui.card} p-4 space-y-4`}>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className={ui.label}>Año tributario</span>
            <input
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="w-full rounded-md border border-(--color-border) bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className={ui.label}>Acción</span>
            <select
              value={action}
              onChange={(event) => setAction(event.target.value)}
              className="w-full rounded-md border border-(--color-border) bg-white px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {AUDIT_ACTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={loadAuditLogs}
          disabled={loading}
          className={ui.buttonPrimary}
        >
          {loading ? "Cargando..." : "Actualizar auditoría"}
        </button>
      </div>

      {error ? (
        <div className={`${ui.alertRisk} rounded-md p-3 text-sm`}>
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        {loading ? (
          <div className={`${ui.card} p-5 text-sm text-(--color-text-secondary)`}>
            Cargando auditoría DDJJ...
          </div>
        ) : null}

        {!loading && sortedLogs.length === 0 ? (
          <div className={`${ui.card} p-5 text-sm text-(--color-text-secondary)`}>
            No existen registros de auditoría para los filtros seleccionados.
          </div>
        ) : null}

        {!loading &&
          sortedLogs.map((log) => {
            const metadata = parseMetadata(log.metadata);

            return (
              <article key={log.id} className={`${ui.card} p-5`}>
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-(--color-text-primary)">
                          {declarationTypeLabel(log.declarationType)}
                        </h2>

                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${actionBadge(
                            log.action,
                          )}`}
                        >
                          {actionLabel(log.action)}
                        </span>
                      </div>

                      <p className="text-sm text-(--color-text-secondary)">
                        Declaración: {log.declarationId}
                      </p>
                    </div>

                    <div className={`${ui.cardSoft} px-3 py-2 lg:w-60`}>
                      <p className="text-xs font-medium text-(--color-text-muted)">
                        Fecha
                      </p>
                      <p className="mt-1 text-sm text-(--color-text-primary)">
                        {formatDate(log.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
                    <div className={`${ui.cardSoft} p-3`}>
                      <p className="text-xs font-medium text-(--color-text-muted)">
                        Usuario
                      </p>
                      <p className="mt-1 text-sm break-all text-(--color-text-secondary)">
                        {log.actorEmail ?? "—"}
                      </p>
                    </div>

                    <div className={`${ui.cardSoft} p-3`}>
                      <p className="text-xs font-medium text-(--color-text-muted)">
                        IP
                      </p>
                      <p className="mt-1 text-sm break-all text-(--color-text-secondary)">
                        {log.ipAddress ?? "—"}
                      </p>
                    </div>

                    <div className={`${ui.cardSoft} p-3`}>
                      <p className="text-xs font-medium text-(--color-text-muted)">
                        Estado previo
                      </p>
                      <p className="mt-1 text-sm text-(--color-text-secondary)">
                        {log.statusFrom ?? "—"}
                      </p>
                    </div>

                    <div className={`${ui.cardSoft} p-3`}>
                      <p className="text-xs font-medium text-(--color-text-muted)">
                        Estado nuevo
                      </p>
                      <p className="mt-1 text-sm text-(--color-text-secondary)">
                        {log.statusTo ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className={`${ui.cardSoft} p-3 space-y-2`}>
                    <div>
                      <p className="text-xs font-medium text-(--color-text-muted)">
                        Hash
                      </p>
                      <p className="mt-1 font-mono text-xs break-all text-(--color-text-secondary)">
                        {log.contentHash ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-(--color-text-muted)">
                        User-Agent
                      </p>
                      <p className="mt-1 text-xs break-all text-(--color-text-secondary)">
                        {log.userAgent ?? "—"}
                      </p>
                    </div>
                  </div>

                  {metadata ? (
                    <div className={`${ui.cardSoft} p-3`}>
                      <p className="mb-2 text-xs font-medium text-(--color-text-muted)">
                        Metadata operacional
                      </p>
                      <pre className="overflow-x-auto rounded-md bg-black/5 p-3 text-xs text-(--color-text-secondary)">
                        {JSON.stringify(metadata, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
      </div>
    </section>
  );
}