"use client";

import { useEffect, useMemo, useState } from "react";
import { ui } from "@/styles/design-system";

type DeclarationStatus = "DRAFT" | "REVIEW" | "CONFIRMED" | "EXPORTED" | "VOIDED";

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

const DECLARATION_TYPES = [
  {
    value: "DJ_CRYPTO_SUMMARY",
    label: "Resumen cripto",
  },
  {
    value: "DJ_REALIZED_GAINS",
    label: "Ganancias realizadas",
  },
  {
    value: "DJ_FOREIGN_EXCHANGE_ACTIVITY",
    label: "Actividad en exchanges extranjeros",
  },
  {
    value: "DJ_TAX_SUPPORTING_LEDGER",
    label: "Libro auxiliar tributario",
  },
];

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

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

  return "border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]";
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

  const sortedDeclarations = useMemo(() => {
    return [...declarations].sort(
      (a, b) =>
        new Date(b.generatedAt).getTime() -
        new Date(a.generatedAt).getTime(),
    );
  }, [declarations]);

  async function initializeCsrf() {
    await fetch("/api/csrf", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
  }

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
  }, []);

  async function generateDraft() {
    try {
      setProcessing("generate");
      setMessage(null);
      setError(null);

      await initializeCsrf();

      const token = localStorage.getItem("token");

      const response = await fetch("/api/tax/declarations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token ?? ""}`,
          "Content-Type": "application/json",
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

      setMessage("Borrador DDJJ generado correctamente.");
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

      await initializeCsrf();

      const token = localStorage.getItem("token");

      const response = await fetch(`/api/tax/declarations/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token ?? ""}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json.message || "No fue posible actualizar la declaración.");
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
        throw new Error(json?.message || "No fue posible exportar la declaración.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `ledgera-ddjj-${declaration.taxYear}-${declaration.declarationType.toLowerCase()}.csv`;

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
          Genera, revisa y exporta borradores internos auditables para soporte tributario.
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
            <span className={ui.label}>Tipo de declaración</span>
            <select
              value={declarationType}
              onChange={(event) => setDeclarationType(event.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
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
            {processing === "generate" ? "Generando..." : "Generar borrador"}
          </button>

          <button
            type="button"
            onClick={loadDeclarations}
            disabled={loading || processing !== null}
            className={ui.buttonSecondary}
          >
            {loading ? "Cargando..." : "Actualizar listado"}
          </button>
        </div>
      </div>

      {error && <div className={`${ui.alertRisk} rounded-md p-3 text-sm`}>{error}</div>}

      {message && <div className={`${ui.alertOk} rounded-md p-3 text-sm`}>{message}</div>}

      <div className={ui.tableWrapper}>
        <table className={ui.table}>
          <thead className={ui.tableHead}>
            <tr>
              <th className={ui.tableCell}>Año</th>
              <th className={ui.tableCell}>Tipo</th>
              <th className={ui.tableCell}>Estado</th>
              <th className={ui.tableCell}>Hash</th>
              <th className={ui.tableCell}>Generada</th>
              <th className={ui.tableCell}>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr className={ui.tableRow}>
                <td className={ui.tableCell} colSpan={6}>
                  Cargando declaraciones...
                </td>
              </tr>
            ) : null}

            {!loading && sortedDeclarations.length === 0 ? (
              <tr className={ui.tableRow}>
                <td className={ui.tableCell} colSpan={6}>
                  No hay borradores DDJJ para el año seleccionado.
                </td>
              </tr>
            ) : null}

            {!loading &&
              sortedDeclarations.map((declaration) => (
                <tr key={declaration.id} className={ui.tableRow}>
                  <td className={ui.tableCell}>{declaration.taxYear}</td>

                  <td className={ui.tableCell}>
                    <span className="font-medium">
                      {declaration.declarationType}
                    </span>
                  </td>

                  <td className={ui.tableCell}>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClass(
                        declaration.status,
                      )}`}
                    >
                      {statusLabel(declaration.status)}
                    </span>
                  </td>

                  <td className={`${ui.tableCell} font-mono text-xs`}>
                    {declaration.contentHash.slice(0, 16)}...
                  </td>

                  <td className={ui.tableCell}>
                    {formatDate(declaration.generatedAt)}
                  </td>

                  <td className={ui.tableCell}>
                    <div className="flex flex-wrap gap-2">
                      {declaration.status !== "VOIDED" ? (
                        <>
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
                            onClick={() => updateStatus(declaration.id, "VOIDED")}
                            disabled={processing !== null}
                            className={ui.buttonDanger}
                          >
                            Anular
                          </button>
                        </>
                      ) : (
                        <span className="text-sm text-[var(--color-text-muted)]">
                          Sin acciones
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}