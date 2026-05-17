"use client";

import { useEffect, useMemo, useState } from "react";
import { ui } from "@/styles/design-system";

type DeclarationStatus =
  | "DRAFT"
  | "REVIEW"
  | "CONFIRMED"
  | "EXPORTED"
  | "VOIDED";

type DeclarationItem = {
  id: string;
  taxYear: number;
  declarationType: string;
  status: DeclarationStatus;
  source: string;
  contentHash: string;
  generatedAt: string;
  confirmedAt: string | null;
  voidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type DeclarationsResponse = {
  ok: boolean;
  message: string;
  data: {
    declarations: DeclarationItem[];
  };
};

type VerifyResponse = {
  ok: boolean;
  message: string;
  data: {
    verification: {
      valid: boolean;
      computedHash: string;
      expectedHash: string;
    };
  };
};

type VerificationResult = {
  declarationId: string;
  valid: boolean;
  computedHash: string;
  expectedHash: string;
};

const DECLARATION_TYPES = [
  { value: "DJ_CRYPTO_SUMMARY", label: "Resumen tributario cripto" },
  { value: "DJ_REALIZED_GAINS", label: "Ganancias realizadas" },
  {
    value: "DJ_FOREIGN_EXCHANGE_ACTIVITY",
    label: "Actividad en exchanges extranjeros",
  },
  {
    value: "DJ_TAX_SUPPORTING_LEDGER",
    label: "Libro auxiliar tributario",
  },
];

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  const match = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=")[1] ?? "") : "";
}

async function resolveCsrfToken() {
  await fetch("/api/csrf", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return readCookie("ledgera_csrf");
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("es-CL");
}

function statusLabel(status: DeclarationStatus) {
  switch (status) {
    case "DRAFT":
      return "Borrador";
    case "REVIEW":
      return "En revisión";
    case "CONFIRMED":
      return "Confirmada";
    case "EXPORTED":
      return "Exportada";
    case "VOIDED":
      return "Anulada";
    default:
      return status;
  }
}

function statusClass(status: DeclarationStatus) {
  if (status === "CONFIRMED") return ui.badgeOk;
  if (status === "VOIDED") return ui.badgeRisk;
  if (status === "REVIEW") return ui.badgeWarning;

  return "border border-(--color-border) bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]";
}

function declarationTypeLabel(type: string) {
  return DECLARATION_TYPES.find((item) => item.value === type)?.label ?? type;
}

function declarationTypeDescription(type: string) {
  switch (type) {
    case "DJ_CRYPTO_SUMMARY":
      return "Consolidado anual de operaciones y eventos tributarios cripto.";
    case "DJ_REALIZED_GAINS":
      return "Detalle de ganancias y pérdidas realizadas para soporte tributario.";
    case "DJ_FOREIGN_EXCHANGE_ACTIVITY":
      return "Operaciones realizadas en plataformas internacionales.";
    case "DJ_TAX_SUPPORTING_LEDGER":
      return "Respaldo para auditoría, revisión contable y trazabilidad.";
    default:
      return "Declaración tributaria auditable generada por LEDGERA.";
  }
}

function statusTimeline(status: DeclarationStatus) {
  if (status === "VOIDED") return ["Borrador", "Anulada"];
  if (status === "CONFIRMED") return ["Borrador", "Revisión", "Confirmada"];
  if (status === "EXPORTED") {
    return ["Borrador", "Revisión", "Confirmada", "Exportada"];
  }
  if (status === "REVIEW") return ["Borrador", "Revisión"];

  return ["Borrador"];
}

export default function TaxDeclarationsPage() {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(String(currentYear));
  const [declarationType, setDeclarationType] = useState("DJ_CRYPTO_SUMMARY");
  const [declarations, setDeclarations] = useState<DeclarationItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(
    null,
  );

  const sortedDeclarations = useMemo(() => {
    return [...declarations].sort(
      (a, b) =>
        new Date(b.generatedAt).getTime() -
        new Date(a.generatedAt).getTime(),
    );
  }, [declarations]);

  async function loadDeclarations() {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      const response = await fetch(`/api/tax/declarations?year=${year}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token ?? ""}`,
        },
        credentials: "include",
        cache: "no-store",
      });

      const json = (await response.json()) as DeclarationsResponse;

      if (!response.ok || !json.ok) {
        throw new Error(json.message || "No fue posible cargar declaraciones.");
      }

      setDeclarations(json.data.declarations ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar declaraciones.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDeclarations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateDraft() {
    try {
      setProcessing("generate");
      setMessage(null);
      setError(null);
      setVerification(null);

      const csrfToken = await resolveCsrfToken();
      const token = localStorage.getItem("token");

      const response = await fetch("/api/tax/declarations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token ?? ""}`,
          "Content-Type": "application/json",
          "x-ledgera-csrf": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          year,
          type: declarationType,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json.message || "No fue posible generar el borrador.");
      }

      setMessage(
        json.data?.reused
          ? "Ya existía un borrador activo con el mismo contenido."
          : "Borrador DDJJ generado correctamente.",
      );

      await loadDeclarations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible generar el borrador.",
      );
    } finally {
      setProcessing(null);
    }
  }

  async function updateStatus(id: string, status: DeclarationStatus) {
    try {
      setProcessing(`${id}:${status}`);
      setMessage(null);
      setError(null);
      setVerification(null);

      const csrfToken = await resolveCsrfToken();
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/tax/declarations/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token ?? ""}`,
          "Content-Type": "application/json",
          "x-ledgera-csrf": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(
          json.message || "No fue posible actualizar la declaración.",
        );
      }

      setMessage("Declaración actualizada correctamente.");
      await loadDeclarations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible actualizar la declaración.",
      );
    } finally {
      setProcessing(null);
    }
  }

  async function verifyHash(declaration: DeclarationItem) {
    try {
      setProcessing(`${declaration.id}:verify`);
      setMessage(null);
      setError(null);
      setVerification(null);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `/api/tax/declarations/${declaration.id}/verify`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token ?? ""}`,
          },
          credentials: "include",
          cache: "no-store",
        },
      );

      const json = (await response.json()) as VerifyResponse;

      if (!response.ok || !json.ok) {
        throw new Error(json.message || "No fue posible verificar el hash.");
      }

      setVerification({
        declarationId: declaration.id,
        valid: json.data.verification.valid,
        computedHash: json.data.verification.computedHash,
        expectedHash: json.data.verification.expectedHash,
      });

      setMessage(
        json.data.verification.valid
          ? "Hash verificado correctamente."
          : "La declaración presenta inconsistencias de integridad.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible verificar el hash.",
      );
    } finally {
      setProcessing(null);
    }
  }

  async function downloadCsv(declaration: DeclarationItem) {
    try {
      setProcessing(`${declaration.id}:export`);
      setMessage(null);
      setError(null);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `/api/tax/declarations/${declaration.id}/export`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token ?? ""}`,
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(
          json?.message || "No fue posible exportar la declaración.",
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `ledgera-ddjj-${
        declaration.taxYear
      }-${declaration.declarationType.toLowerCase()}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setMessage("CSV DDJJ descargado correctamente.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible exportar la declaración.",
      );
    } finally {
      setProcessing(null);
    }
  }

  return (
    <section className={ui.page}>
      <div>
        <h1 className={ui.title}>Declaraciones Juradas</h1>
        <p className={ui.subtitle}>
          Gestión interna de borradores tributarios auditables y verificables.
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
            <span className={ui.label}>Tipo de declaración</span>
            <select
              value={declarationType}
              onChange={(event) => setDeclarationType(event.target.value)}
              className="w-full rounded-md border border-(--color-border) bg-white px-3 py-2 text-sm"
            >
              {DECLARATION_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={generateDraft}
            disabled={processing !== null}
            className={ui.buttonPrimary}
          >
            {processing === "generate" ? "Generando..." : "Generar borrador DDJJ"}
          </button>

          <button
            type="button"
            onClick={loadDeclarations}
            disabled={loading || processing !== null}
            className={ui.buttonSecondary}
          >
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </div>
      </div>

      {error && (
        <div className={`${ui.alertRisk} rounded-md p-3 text-sm`}>
          {error}
        </div>
      )}

      {message && (
        <div className={`${ui.alertOk} rounded-md p-3 text-sm`}>
          {message}
        </div>
      )}

      {verification && (
        <div
          className={`${
            verification.valid ? ui.alertOk : ui.alertRisk
          } rounded-md p-3 text-sm space-y-1`}
        >
          <p className="font-medium">
            {verification.valid
              ? "Integridad verificada"
              : "Integridad no verificada"}
          </p>

          <p className="font-mono text-xs break-all">
            Esperado: {verification.expectedHash}
          </p>

          <p className="font-mono text-xs break-all">
            Calculado: {verification.computedHash}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className={`${ui.card} p-5 text-sm text-[var(--color-text-secondary)]`}>
            Cargando declaraciones...
          </div>
        ) : null}

        {!loading && sortedDeclarations.length === 0 ? (
          <div className={`${ui.card} p-5 text-sm text-[var(--color-text-secondary)]`}>
            No hay borradores DDJJ para el año seleccionado.
          </div>
        ) : null}

        {!loading &&
          sortedDeclarations.map((declaration) => {
            const isVoided = declaration.status === "VOIDED";
            const timeline = statusTimeline(declaration.status);

            return (
              <article key={declaration.id} className={`${ui.card} p-5`}>
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                            {declarationTypeLabel(declaration.declarationType)}
                          </h2>

                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClass(
                              declaration.status,
                            )}`}
                          >
                            {statusLabel(declaration.status)}
                          </span>
                        </div>

                        <p className="max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
                          {declarationTypeDescription(declaration.declarationType)}
                        </p>
                      </div>

                      <div className={`${ui.cardSoft} px-3 py-2 lg:w-56`}>
                        <p className="text-xs font-medium text-[var(--color-text-muted)]">
                          Integridad
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                          Registro protegido
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          Verificable contra alteraciones
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className={ui.cardSoft + " p-3"}>
                        <p className="text-xs font-medium text-[var(--color-text-muted)]">
                          Hash
                        </p>
                        <p className="mt-1 font-mono text-xs break-all text-[var(--color-text-secondary)]">
                          {declaration.contentHash.slice(0, 24)}...
                        </p>
                      </div>

                      <div className={ui.cardSoft + " p-3"}>
                        <p className="text-xs font-medium text-[var(--color-text-muted)]">
                          Generada
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                          {formatDate(declaration.generatedAt)}
                        </p>
                      </div>

                      <div className={ui.cardSoft + " p-3"}>
                        <p className="text-xs font-medium text-[var(--color-text-muted)]">
                          Año tributario
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                          {declaration.taxYear}
                        </p>
                      </div>
                    </div>

                    <div className={`${ui.cardSoft} p-3`}>
                      <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">
                        Flujo operacional
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        {timeline.map((step, index) => (
                          <div key={`${declaration.id}-${step}`} className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-medium text-[var(--color-text-light)]">
                              {index + 1}
                            </span>
                            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                              {step}
                            </span>
                            {index < timeline.length - 1 ? (
                              <span className="h-px w-6 bg-[var(--color-border)]" />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-wrap gap-2 xl:w-52 xl:flex-col">
                    {!isVoided ? (
                      <>
                        <button
                          type="button"
                          onClick={() => updateStatus(declaration.id, "CONFIRMED")}
                          disabled={processing !== null}
                          className={ui.buttonPrimary}
                        >
                          Confirmar
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStatus(declaration.id, "REVIEW")}
                          disabled={processing !== null}
                          className={ui.buttonSecondary}
                        >
                          Revisar
                        </button>

                        <button
                          type="button"
                          onClick={() => verifyHash(declaration)}
                          disabled={processing !== null}
                          className={ui.buttonSecondary}
                        >
                          {processing === `${declaration.id}:verify`
                            ? "Verificando..."
                            : "Verificar hash"}
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadCsv(declaration)}
                          disabled={processing !== null}
                          className={ui.buttonSecondary}
                        >
                          CSV
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStatus(declaration.id, "VOIDED")}
                          disabled={processing !== null}
                          className={ui.buttonDanger}
                        >
                          Anular
                        </button>
                      </>
                    ) : (
                      <div className="text-sm text-[var(--color-text-muted)]">
                        Declaración anulada
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
      </div>
    </section>
  );
}
