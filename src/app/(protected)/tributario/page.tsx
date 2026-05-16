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

type DeclarationMeta = {
  value: string;
  label: string;
  description: string;
};

const DECLARATION_TYPES: DeclarationMeta[] = [
  {
    value: "DJ_CRYPTO_SUMMARY",
    label: "Resumen tributario cripto",
    description:
      "Resumen consolidado de resultados tributarios y actividad cripto.",
  },
  {
    value: "DJ_REALIZED_GAINS",
    label: "Ganancias realizadas",
    description: "Detalle de ganancias y pérdidas realizadas.",
  },
  {
    value: "DJ_FOREIGN_EXCHANGE_ACTIVITY",
    label: "Actividad en exchanges extranjeros",
    description: "Operaciones realizadas en plataformas internacionales.",
  },
  {
    value: "DJ_TAX_SUPPORTING_LEDGER",
    label: "Libro auxiliar tributario",
    description:
      "Respaldo para auditoría, revisión contable y trazabilidad.",
  },
];

function resolveDeclarationMeta(type: string): DeclarationMeta {
  return (
    DECLARATION_TYPES.find((item) => item.value === type) ?? {
      value: type,
      label: "Declaración tributaria",
      description: "Declaración tributaria interna.",
    }
  );
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  const item = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));

  if (!item) return "";

  return decodeURIComponent(item.substring(name.length + 1));
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

  async function verifyIntegrity(declaration: DeclarationItem) {
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
        throw new Error(json.message || "No fue posible verificar integridad.");
      }

      setVerification({
        declarationId: declaration.id,
        valid: json.data.verification.valid,
        computedHash: json.data.verification.computedHash,
        expectedHash: json.data.verification.expectedHash,
      });

      setMessage(
        json.data.verification.valid
          ? "La declaración mantiene integridad y no presenta alteraciones."
          : "La declaración presenta inconsistencias de integridad.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible verificar integridad.",
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
            {processing === "generate"
              ? "Generando..."
              : "Generar borrador DDJJ"}
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
          } rounded-md p-4 text-sm space-y-2`}
        >
          <p className="font-semibold">
            {verification.valid
              ? "Integridad validada correctamente"
              : "Se detectaron inconsistencias de integridad"}
          </p>

          <p className="text-xs text-(--color-text-muted)">
            Esta verificación compara el contenido guardado con su registro
            digital interno para confirmar que no fue alterado.
          </p>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse">
          <thead>
            <tr className="bg-[#0F2A3D] text-white">
              <th className="rounded-tl-2xl px-7 py-5 text-left text-sm font-bold">
                Declaración
              </th>
              <th className="px-7 py-5 text-left text-sm font-bold">
                Estado
              </th>
              <th className="px-7 py-5 text-left text-sm font-bold">
                Integridad
              </th>
              <th className="px-7 py-5 text-left text-sm font-bold">
                Generada
              </th>
              <th className="rounded-tr-2xl px-7 py-5 text-left text-sm font-bold">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-7 py-7 text-sm text-[#64748B]" colSpan={5}>
                  Cargando declaraciones...
                </td>
              </tr>
            ) : null}

            {!loading && sortedDeclarations.length === 0 ? (
              <tr>
                <td className="px-7 py-7 text-sm text-[#64748B]" colSpan={5}>
                  No existen declaraciones para el período seleccionado.
                </td>
              </tr>
            ) : null}

            {!loading &&
              sortedDeclarations.map((declaration) => {
                const meta = resolveDeclarationMeta(declaration.declarationType);

                return (
                  <tr
                    key={declaration.id}
                    className="border-b border-[#E2E8F0] bg-white"
                  >
                    <td className="px-7 py-6 align-middle">
                      <div className="max-w-[320px] space-y-1">
                        <p className="text-sm font-semibold text-[#0F2A3D]">
                          {meta.label}
                        </p>

                        <p className="text-sm leading-relaxed text-[#64748B]">
                          {meta.description}
                        </p>
                      </div>
                    </td>

                    <td className="px-7 py-6 align-middle">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          declaration.status,
                        )}`}
                      >
                        {statusLabel(declaration.status)}
                      </span>
                    </td>

                    <td className="px-7 py-6 align-middle">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[#0F2A3D]">
                          Registro protegido
                        </p>

                        <p className="text-sm leading-relaxed text-[#64748B]">
                          Verificable contra alteraciones
                        </p>
                      </div>
                    </td>

                    <td className="px-7 py-6 align-middle text-sm text-[#0F2A3D]">
                      {formatDate(declaration.generatedAt)}
                    </td>

                    <td className="px-7 py-6 align-middle">
                      {declaration.status !== "VOIDED" ? (
                        <div className="flex flex-nowrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              updateStatus(declaration.id, "REVIEW")
                            }
                            disabled={processing !== null}
                            className={ui.buttonSecondary}
                          >
                            Revisar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateStatus(declaration.id, "CONFIRMED")
                            }
                            disabled={processing !== null}
                            className={ui.buttonPrimary}
                          >
                            Confirmar
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
                            onClick={() => verifyIntegrity(declaration)}
                            disabled={processing !== null}
                            className={ui.buttonSecondary}
                          >
                            {processing === `${declaration.id}:verify`
                              ? "Verificando..."
                              : "Integridad"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateStatus(declaration.id, "VOIDED")
                            }
                            disabled={processing !== null}
                            className={ui.buttonDanger}
                          >
                            Anular
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-[#64748B]">
                          Declaración anulada
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </section>
  );
}