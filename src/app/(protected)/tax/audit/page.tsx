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
  previousHash: string | null;
  currentHash: string | null;
  createdAt: string;
};

type IntegrityStatus = "OK" | "RISK" | "CRITICAL" | "LEGACY_UNVERIFIABLE";

type IntegrityIssue = {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "LEGACY";
  description: string;
  data: Record<string, unknown>;
};

type IntegrityResult = {
  status: IntegrityStatus;
  timestamp: string;
  issues: IntegrityIssue[];
  summary: {
    total_audit_logs: number;
    chain_verified_logs: number;
    broken_chains: number;
    orphaned_records: number;
    legacy_unverifiable_records: number;
  };
};

type AuditResponse = {
  ok: boolean;
  message: string;
  data: {
    logs: AuditLog[];
  };
};

type IntegrityResponse = {
  ok: boolean;
  message: string;
  data: IntegrityResult;
};

const ACTIONS: { value: AuditAction; label: string }[] = [
  { value: "DECLARATION_CREATED", label: "Creación" },
  { value: "DECLARATION_REVIEWED", label: "Revisión" },
  { value: "DECLARATION_CONFIRMED", label: "Confirmación" },
  { value: "DECLARATION_VOIDED", label: "Anulación" },
  { value: "DECLARATION_EXPORTED", label: "Exportación" },
  { value: "DECLARATION_INTEGRITY_VERIFIED", label: "Verificación" },
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-CL");
}

function parseMetadata(value: string | null) {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function actionLabel(action: AuditAction) {
  return ACTIONS.find((item) => item.value === action)?.label ?? action;
}

function actionBadge(action: AuditAction) {
  if (
    action === "DECLARATION_CONFIRMED" ||
    action === "DECLARATION_EXPORTED"
  ) {
    return ui.badgeOk;
  }

  if (action === "DECLARATION_VOIDED") return ui.badgeRisk;

  if (
    action === "DECLARATION_REVIEWED" ||
    action === "DECLARATION_INTEGRITY_VERIFIED"
  ) {
    return ui.badgeWarning;
  }

  return "border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]";
}

function integrityBadge(status: IntegrityStatus) {
  if (status === "OK") return ui.badgeOk;
  if (status === "LEGACY_UNVERIFIABLE") return ui.badgeWarning;
  return ui.badgeRisk;
}

function integrityLabel(status: IntegrityStatus) {
  switch (status) {
    case "OK":
      return "Integridad OK";
    case "LEGACY_UNVERIFIABLE":
      return "Legacy no verificable";
    case "RISK":
      return "Riesgo";
    case "CRITICAL":
      return "Critico";
  }
}

function issueLabel(issue: IntegrityIssue) {
  if (issue.type === "LEGACY_UNVERIFIABLE") {
    return "DDJJ legacy sin cadena criptografica";
  }

  if (issue.type === "BROKEN_DECLARATION_CHAIN") {
    return "Cadena DDJJ rota";
  }

  if (issue.type === "ORPHANED_DECLARATION") {
    return "DDJJ sin auditoria";
  }

  return issue.type;
}

function declarationTypeLabel(type: string) {
  switch (type) {
    case "DJ_CRYPTO_SUMMARY":
      return "Resumen cripto";
    case "DJ_REALIZED_GAINS":
      return "Ganancias realizadas";
    case "DJ_FOREIGN_EXCHANGE_ACTIVITY":
      return "Actividad exchanges";
    case "DJ_TAX_SUPPORTING_LEDGER":
      return "Libro auxiliar";
    default:
      return type;
  }
}

export default function TaxDeclarationsAuditPage() {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(String(currentYear));
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [integrity, setIntegrity] = useState<IntegrityResult | null>(null);

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

      if (year) searchParams.set("year", year);
      if (action) searchParams.set("action", action);

      const [response, integrityResponse] = await Promise.all([
        fetch(`/api/tax/declarations/audit?${searchParams.toString()}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token ?? ""}`,
          },
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/tax/audit/integrity", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token ?? ""}`,
          },
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const json = (await response.json()) as AuditResponse;
      const integrityJson =
        (await integrityResponse.json()) as IntegrityResponse;

      if (!response.ok || !json.ok) {
        throw new Error(json.message || "No fue posible cargar auditoría.");
      }

      if (!integrityResponse.ok || !integrityJson.ok) {
        throw new Error(
          integrityJson.message || "No fue posible cargar integridad.",
        );
      }

      setLogs(json.data.logs ?? []);
      setIntegrity(integrityJson.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar auditoría.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadAuditLogs);
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
              className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className={ui.label}>Acción</span>

            <select
              value={action}
              onChange={(event) => setAction(event.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
            >
              <option value="">Todas</option>

              {ACTIONS.map((item) => (
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

      {integrity ? (
        <div className={`${ui.card} p-5 space-y-4`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Integridad DDJJ
                </h2>

                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${integrityBadge(
                    integrity.status,
                  )}`}
                >
                  {integrityLabel(integrity.status)}
                </span>
              </div>

              <p className="text-sm text-[var(--color-text-secondary)]">
                {integrity.status === "LEGACY_UNVERIFIABLE"
                  ? "Hay evidencia historica anterior al protocolo de cadena; se conserva sin marcarla como corrupcion."
                  : "Estado calculado desde hash DDJJ, cadena de auditoria y registros relacionados."}
              </p>
            </div>

            <div className={`${ui.cardSoft} px-3 py-2 md:w-64`}>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">
                Ultima verificacion
              </p>

              <p className="mt-1 text-sm text-[var(--color-text-primary)]">
                {formatDate(integrity.timestamp)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className={`${ui.cardSoft} p-3`}>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">
                Eventos auditoria
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-primary)]">
                {integrity.summary.total_audit_logs}
              </p>
            </div>

            <div className={`${ui.cardSoft} p-3`}>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">
                Cadenas rotas
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-primary)]">
                {integrity.summary.broken_chains}
              </p>
            </div>

            <div className={`${ui.cardSoft} p-3`}>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">
                Huerfanos
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-primary)]">
                {integrity.summary.orphaned_records}
              </p>
            </div>

            <div className={`${ui.cardSoft} p-3`}>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">
                Legacy no verificable
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-primary)]">
                {integrity.summary.legacy_unverifiable_records}
              </p>
            </div>
          </div>

          {integrity.issues.length > 0 ? (
            <div className="space-y-2">
              {integrity.issues.slice(0, 5).map((issue, index) => (
                <div
                  key={`${issue.type}-${index}`}
                  className={`${ui.cardSoft} flex flex-col gap-1 p-3 text-sm md:flex-row md:items-center md:justify-between`}
                >
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {issueLabel(issue)}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {issue.severity}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className={`${ui.alertRisk} rounded-md p-3 text-sm`}>
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        {loading ? (
          <div
            className={`${ui.card} p-5 text-sm text-[var(--color-text-secondary)]`}
          >
            Cargando auditoría DDJJ...
          </div>
        ) : null}

        {!loading && sortedLogs.length === 0 ? (
          <div
            className={`${ui.card} p-5 text-sm text-[var(--color-text-secondary)]`}
          >
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
                        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                          {declarationTypeLabel(log.declarationType)}
                        </h2>

                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${actionBadge(
                            log.action,
                          )}`}
                        >
                          {actionLabel(log.action)}
                        </span>

                        {!log.currentHash ? (
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${ui.badgeWarning}`}
                          >
                            Legacy
                          </span>
                        ) : null}
                      </div>

                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Declaración: {log.declarationId}
                      </p>
                    </div>

                    <div className={`${ui.cardSoft} px-3 py-2 lg:w-60`}>
                      <p className="text-xs font-medium text-[var(--color-text-muted)]">
                        Fecha
                      </p>

                      <p className="mt-1 text-sm text-[var(--color-text-primary)]">
                        {formatDate(log.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
                    <div className={`${ui.cardSoft} p-3`}>
                      <p className="text-xs font-medium text-[var(--color-text-muted)]">
                        Usuario
                      </p>

                      <p className="mt-1 text-sm break-all text-[var(--color-text-secondary)]">
                        {log.actorEmail ?? "—"}
                      </p>
                    </div>

                    <div className={`${ui.cardSoft} p-3`}>
                      <p className="text-xs font-medium text-[var(--color-text-muted)]">
                        IP
                      </p>

                      <p className="mt-1 text-sm break-all text-[var(--color-text-secondary)]">
                        {log.ipAddress ?? "—"}
                      </p>
                    </div>

                    <div className={`${ui.cardSoft} p-3`}>
                      <p className="text-xs font-medium text-[var(--color-text-muted)]">
                        Estado previo
                      </p>

                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {log.statusFrom ?? "—"}
                      </p>
                    </div>

                    <div className={`${ui.cardSoft} p-3`}>
                      <p className="text-xs font-medium text-[var(--color-text-muted)]">
                        Estado nuevo
                      </p>

                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {log.statusTo ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className={`${ui.cardSoft} p-3 space-y-2`}>
                    <div>
                      <p className="text-xs font-medium text-[var(--color-text-muted)]">
                        Hash
                      </p>

                      <p className="mt-1 font-mono text-xs break-all text-[var(--color-text-secondary)]">
                        {log.contentHash ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-[var(--color-text-muted)]">
                        User-Agent
                      </p>

                      <p className="mt-1 text-xs break-all text-[var(--color-text-secondary)]">
                        {log.userAgent ?? "—"}
                      </p>
                    </div>
                  </div>

                  {metadata ? (
                    <div className={`${ui.cardSoft} p-3`}>
                      <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">
                        Metadata operacional
                      </p>

                      <pre className="overflow-x-auto rounded-md bg-black/5 p-3 text-xs text-[var(--color-text-secondary)]">
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
