"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ui } from "@/styles/design-system";

type TaxCategory =
  | "ORDINARY_INCOME"
  | "CAPITAL_GAIN"
  | "NON_TAXABLE"
  | "UNCLASSIFIED";

type ClassificationSource = "SYSTEM" | "USER" | "ACCOUNTANT" | null;
type TaxHealthStatus = "OK" | "REVIEW" | "RISK";

type TaxHealth = {
  status: TaxHealthStatus;
  score: number;
  issues: Array<{
    type: string;
    count: number;
    message: string;
  }>;
};

type TaxEvent = {
  id: string;
  movementId: string | null;
  eventType: string;
  symbol: string;
  executedAt: string;
  quantity: number;
  feeUsd: number;
  proceedsGrossUsd: number;
  proceedsNetUsd: number;
  costBasisUsd: number;
  realizedPnlUsd: number;
  realizedPnlClp: number;
  effectiveTaxCategory: string | null;
  suggestedTaxCategory?: string | null;
  appliedTaxCategory?: string | null;
  taxClassificationSource?: ClassificationSource;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type CategoryTotal = {
  category: string;
  count: number;
  totalPnlUsd: number;
  totalPnlClp: number;
};

type TaxTotals = {
  totalEvents: number;
  totalQuantity: number;
  totalPnlUsd: number;
  totalPnlClp: number;
  totalProceedsGrossUsd: number;
  totalProceedsNetUsd: number;
  totalCostBasisUsd: number;
  totalFeeUsd: number;
  byCategory: CategoryTotal[];
};

type TaxEventsResponse = {
  ok: boolean;
  message: string;
  data: {
    events: TaxEvent[];
    totals: TaxTotals;
    taxHealth: TaxHealth;
    filters: {
      year: string | null;
      symbol: string | null;
    };
  } | null;
};

type RowStatus = {
  type: "success" | "error" | "saving";
  message: string;
};

const TAX_CATEGORY_OPTIONS: Array<{ value: TaxCategory; label: string }> = [
  { value: "ORDINARY_INCOME", label: "Renta ordinaria" },
  { value: "CAPITAL_GAIN", label: "Mayor valor" },
  { value: "NON_TAXABLE", label: "No afecto" },
  { value: "UNCLASSIFIED", label: "Sin clasificar" },
];

function formatNumber(value: number, decimals = 8) {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatClp(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

function normalizeCategory(value: string | null | undefined): TaxCategory {
  if (
    value === "ORDINARY_INCOME" ||
    value === "CAPITAL_GAIN" ||
    value === "NON_TAXABLE" ||
    value === "UNCLASSIFIED"
  ) {
    return value;
  }

  return "UNCLASSIFIED";
}

function getRowCategory(event: TaxEvent): TaxCategory {
  return normalizeCategory(
    event.appliedTaxCategory ||
      event.effectiveTaxCategory ||
      event.suggestedTaxCategory ||
      "UNCLASSIFIED",
  );
}

function getHealthLabel(status: TaxHealthStatus) {
  if (status === "OK") return "Estado OK";
  if (status === "REVIEW") return "Revisión recomendada";
  return "Riesgo tributario";
}

function getHealthClass(status: TaxHealthStatus) {
  if (status === "OK") return ui.badgeOk;
  if (status === "REVIEW") return ui.badgeWarning;
  return ui.badgeRisk;
}

export default function TaxBookPage() {
  const currentYear = new Date().getFullYear().toString();

  const [events, setEvents] = useState<TaxEvent[]>([]);
  const [totals, setTotals] = useState<TaxTotals | null>(null);
  const [taxHealth, setTaxHealth] = useState<TaxHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    year: currentYear,
    symbol: "",
  });

  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus | null>>(
    {},
  );
  const [savingByMovementId, setSavingByMovementId] = useState<
    Record<string, boolean>
  >({});
  const [toast, setToast] = useState<string | null>(null);

  const toastTimeoutRef = useRef<number | null>(null);
  const fetchDebounceRef = useRef<number | null>(null);

  const healthStatus = taxHealth?.status ?? "REVIEW";
  const isBlocked = healthStatus === "RISK";
  const isWarning = healthStatus === "REVIEW";

  const exportStrictUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.year.trim()) params.set("year", filters.year.trim());
    if (filters.symbol.trim()) {
      params.set("symbol", filters.symbol.trim().toUpperCase());
    }

    const query = params.toString();
    return query
      ? `/api/tax/events/export-strict?${query}`
      : "/api/tax/events/export-strict";
  }, [filters]);

  const exportInformativeUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.year.trim()) params.set("year", filters.year.trim());
    if (filters.symbol.trim()) {
      params.set("symbol", filters.symbol.trim().toUpperCase());
    }

    const query = params.toString();
    return query
      ? `/api/tax/events/export-informative?${query}`
      : "/api/tax/events/export-informative";
  }, [filters]);

  const showToast = useCallback((message: string) => {
    setToast(message);

    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, 1800);
  }, []);

  const fetchEvents = useCallback(
    async (nextFilters?: { year: string; symbol: string }) => {
      const activeFilters = nextFilters ?? filters;

      try {
        setLoading(true);
        setPageError(null);

        const params = new URLSearchParams();

        if (activeFilters.year.trim()) {
          params.set("year", activeFilters.year.trim());
        }

        if (activeFilters.symbol.trim()) {
          params.set("symbol", activeFilters.symbol.trim().toUpperCase());
        }

        const query = params.toString();
        const url = query ? `/api/tax/events?${query}` : "/api/tax/events";

        const response = await fetch(url, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const result = (await response.json()) as TaxEventsResponse;

        if (!response.ok || !result.ok || !result.data) {
          throw new Error(
            result.message || "No fue posible cargar los eventos tributarios.",
          );
        }

        setEvents(result.data.events);
        setTotals(result.data.totals);
        setTaxHealth(result.data.taxHealth);
      } catch (error) {
        console.error("Failed to fetch tax events:", error);
        setPageError(
          error instanceof Error
            ? error.message
            : "No fue posible cargar los eventos tributarios.",
        );
        setEvents([]);
        setTotals(null);
        setTaxHealth(null);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
      if (fetchDebounceRef.current) {
        window.clearTimeout(fetchDebounceRef.current);
      }
    };
  }, []);

  const availableSymbols = useMemo(() => {
    const set = new Set<string>();

    for (const event of events) {
      if (event.symbol) set.add(event.symbol);
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const years = useMemo(() => {
    const thisYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, index) => String(thisYear - index));
  }, []);

  function handleFilterChange(field: "year" | "symbol", value: string) {
    const nextFilters = {
      ...filters,
      [field]: field === "symbol" ? value.toUpperCase() : value,
    };

    setFilters(nextFilters);

    if (fetchDebounceRef.current) {
      window.clearTimeout(fetchDebounceRef.current);
    }

    fetchDebounceRef.current = window.setTimeout(() => {
      fetchEvents(nextFilters);
    }, 250);
  }

  function recalculateTotals(nextEvents: TaxEvent[]): TaxTotals {
    const byCategoryMap = new Map<string, CategoryTotal>();

    let totalQuantity = 0;
    let totalPnlUsd = 0;
    let totalPnlClp = 0;
    let totalProceedsGrossUsd = 0;
    let totalProceedsNetUsd = 0;
    let totalCostBasisUsd = 0;
    let totalFeeUsd = 0;

    for (const event of nextEvents) {
      totalQuantity += event.quantity;
      totalPnlUsd += event.realizedPnlUsd;
      totalPnlClp += event.realizedPnlClp;
      totalProceedsGrossUsd += event.proceedsGrossUsd;
      totalProceedsNetUsd += event.proceedsNetUsd;
      totalCostBasisUsd += event.costBasisUsd;
      totalFeeUsd += event.feeUsd;

      const category = normalizeCategory(
        event.appliedTaxCategory ||
          event.effectiveTaxCategory ||
          event.suggestedTaxCategory ||
          "UNCLASSIFIED",
      );

      const existing = byCategoryMap.get(category);

      if (existing) {
        existing.count += 1;
        existing.totalPnlUsd += event.realizedPnlUsd;
        existing.totalPnlClp += event.realizedPnlClp;
      } else {
        byCategoryMap.set(category, {
          category,
          count: 1,
          totalPnlUsd: event.realizedPnlUsd,
          totalPnlClp: event.realizedPnlClp,
        });
      }
    }

    return {
      totalEvents: nextEvents.length,
      totalQuantity,
      totalPnlUsd,
      totalPnlClp,
      totalProceedsGrossUsd,
      totalProceedsNetUsd,
      totalCostBasisUsd,
      totalFeeUsd,
      byCategory: Array.from(byCategoryMap.values()).sort((a, b) =>
        a.category.localeCompare(b.category),
      ),
    };
  }

  async function handleClassificationChange(
    eventId: string,
    movementId: string | null,
    nextCategory: TaxCategory,
  ) {
    if (!movementId) {
      setRowStatus((current) => ({
        ...current,
        [eventId]: {
          type: "error",
          message: "Este evento no tiene movementId asociado.",
        },
      }));
      return;
    }

    const previousEvents = events;

    const optimisticEvents = previousEvents.map((event) =>
      event.id === eventId
        ? {
            ...event,
            appliedTaxCategory: nextCategory,
            effectiveTaxCategory: nextCategory,
            taxClassificationSource: "USER" as ClassificationSource,
          }
        : event,
    );

    setSavingByMovementId((current) => ({
      ...current,
      [movementId]: true,
    }));

    setRowStatus((current) => ({
      ...current,
      [eventId]: {
        type: "saving",
        message: "Guardando...",
      },
    }));

    setEvents(optimisticEvents);
    setTotals(recalculateTotals(optimisticEvents));

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/tax/classification", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        credentials: "include",
        body: JSON.stringify({
          movementId,
          appliedTaxCategory: nextCategory,
          taxClassificationSource: "USER",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(
          result?.message || "No fue posible actualizar la clasificación.",
        );
      }

      setRowStatus((current) => ({
        ...current,
        [eventId]: {
          type: "success",
          message: "Guardado",
        },
      }));

      showToast("Clasificación tributaria actualizada correctamente");
      await fetchEvents();
    } catch (error) {
      console.error("Failed to update tax classification:", error);

      setEvents(previousEvents);
      setTotals(recalculateTotals(previousEvents));

      setRowStatus((current) => ({
        ...current,
        [eventId]: {
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "No fue posible actualizar la clasificación.",
        },
      }));
    } finally {
      setSavingByMovementId((current) => ({
        ...current,
        [movementId]: false,
      }));

      window.setTimeout(() => {
        setRowStatus((current) => ({
          ...current,
          [eventId]:
            current[eventId]?.type === "success" ? null : current[eventId],
        }));
      }, 1400);
    }
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div className={`fixed right-4 top-4 z-50 rounded-md px-3 py-2 text-sm shadow-sm ${ui.alertOk}`}>
          {toast}
        </div>
      ) : null}

      <section className={`${ui.card} p-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className={ui.title}>Libro tributario</h1>
            <p className={ui.subtitle}>
              Vista formal para revisar eventos, costos FIFO y clasificación
              tributaria.
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-sm font-medium ${getHealthClass(
              healthStatus,
            )}`}
          >
            {getHealthLabel(healthStatus)}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span>Año</span>
              <select
                value={filters.year}
                onChange={(event) =>
                  handleFilterChange("year", event.target.value)
                }
                className="min-w-44 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2563EB]"
              >
                <option value="">Todos</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span>Símbolo</span>
              <select
                value={filters.symbol}
                onChange={(event) =>
                  handleFilterChange("symbol", event.target.value)
                }
                className="min-w-44 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2563EB]"
              >
                <option value="">Todos</option>
                {availableSymbols.map((symbolItem) => (
                  <option key={symbolItem} value={symbolItem}>
                    {symbolItem}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={isBlocked ? "#" : exportInformativeUrl}
              onClick={(event) => {
                if (isBlocked) event.preventDefault();
              }}
              className={
                isBlocked
                  ? "inline-flex h-10 cursor-not-allowed items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-400"
                  : ui.buttonSecondary
              }
            >
              CSV informativo
            </a>

            <a
              href={isBlocked ? "#" : exportStrictUrl}
              onClick={(event) => {
                if (isBlocked) event.preventDefault();
              }}
              className={
                isBlocked
                  ? "inline-flex h-10 cursor-not-allowed items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-400"
                  : ui.buttonPrimary
              }
            >
              CSV contador
            </a>
          </div>
        </div>
      </section>

      {isBlocked && (
        <div className={`rounded-md px-4 py-3 text-sm ${ui.alertRisk}`}>
          Existen inconsistencias tributarias. Debes resolverlas antes de
          exportar o cerrar el período.
        </div>
      )}

      {isWarning && !isBlocked && (
        <div className={`rounded-md px-4 py-3 text-sm ${ui.alertWarning}`}>
          Se detectaron señales que conviene revisar antes de usar estos datos
          como base formal.
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Eventos", totals ? formatNumber(totals.totalEvents, 0) : "0"],
          ["PnL USD", totals ? formatUsd(totals.totalPnlUsd) : formatUsd(0)],
          ["PnL CLP", totals ? formatClp(totals.totalPnlClp) : formatClp(0)],
          ["Fees USD", totals ? formatUsd(totals.totalFeeUsd) : formatUsd(0)],
        ].map(([label, value]) => (
          <article key={label} className={`${ui.card} p-5`}>
            <p className={ui.label}>{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {value}
            </p>
          </article>
        ))}
      </section>

      <section className={`${ui.card} p-5`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Eventos tributarios
            </h2>
            <p className={ui.label}>
              Clasificación tributaria editable por el usuario.
            </p>
          </div>

          {loading ? <span className={ui.label}>Cargando...</span> : null}
        </div>

        {pageError ? (
          <div className={`rounded-md px-3 py-2 text-sm ${ui.alertRisk}`}>
            {pageError}
          </div>
        ) : null}

        {!pageError && !loading && events.length === 0 ? (
          <div className={`${ui.cardSoft} px-4 py-6 text-sm text-slate-600`}>
            No hay eventos tributarios para los filtros seleccionados.
          </div>
        ) : null}

        {!pageError && events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  {[
                    "Fecha",
                    "Símbolo",
                    "Tipo",
                    "Cantidad",
                    "Ingreso neto USD",
                    "Costo FIFO USD",
                    "Resultado USD",
                    "Resultado CLP",
                    "Clasificación",
                  ].map((header) => (
                    <th
                      key={header}
                      className="border-b border-slate-200 px-3 py-3 font-medium"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {events.map((event) => {
                  const currentCategory = getRowCategory(event);
                  const rowKey = event.id;
                  const isSaving = event.movementId
                    ? Boolean(savingByMovementId[event.movementId])
                    : false;
                  const status = rowStatus[rowKey];

                  return (
                    <tr key={rowKey} className="align-top text-sm text-slate-700">
                      <td className="border-b border-slate-100 px-3 py-3">
                        {formatDate(event.executedAt)}
                      </td>

                      <td className="border-b border-slate-100 px-3 py-3 font-medium text-slate-950">
                        {event.symbol}
                      </td>

                      <td className="border-b border-slate-100 px-3 py-3">
                        {event.eventType}
                      </td>

                      <td className="border-b border-slate-100 px-3 py-3">
                        {formatNumber(event.quantity)}
                      </td>

                      <td className="border-b border-slate-100 px-3 py-3">
                        {formatUsd(event.proceedsNetUsd)}
                      </td>

                      <td className="border-b border-slate-100 px-3 py-3">
                        {formatUsd(event.costBasisUsd)}
                      </td>

                      <td className="border-b border-slate-100 px-3 py-3">
                        {formatUsd(event.realizedPnlUsd)}
                      </td>

                      <td className="border-b border-slate-100 px-3 py-3">
                        {formatClp(event.realizedPnlClp)}
                      </td>

                      <td className="border-b border-slate-100 px-3 py-3">
                        <div className="flex min-w-44 flex-col gap-1">
                          <select
                            value={currentCategory}
                            disabled={isSaving || !event.movementId}
                            onChange={(selectEvent) =>
                              handleClassificationChange(
                                event.id,
                                event.movementId,
                                selectEvent.target.value as TaxCategory,
                              )
                            }
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2563EB] disabled:cursor-not-allowed disabled:bg-slate-100"
                          >
                            {TAX_CATEGORY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <div className="min-h-5 text-xs">
                            {status?.type === "saving" ? (
                              <span className="text-slate-500">
                                {status.message}
                              </span>
                            ) : null}

                            {status?.type === "success" ? (
                              <span className="text-[#14532D]">
                                {status.message}
                              </span>
                            ) : null}

                            {status?.type === "error" ? (
                              <span className="text-[#991B1B]">
                                {status.message}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className={`${ui.card} p-5`}>
        <h2 className="text-lg font-semibold text-slate-950">
          Resumen por categoría
        </h2>

        {totals && totals.byCategory.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  {["Categoría", "Eventos", "PnL USD", "PnL CLP"].map(
                    (header) => (
                      <th
                        key={header}
                        className="border-b border-slate-200 px-3 py-3 font-medium"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {totals.byCategory.map((item) => (
                  <tr key={item.category} className="text-sm text-slate-700">
                    <td className="border-b border-slate-100 px-3 py-3">
                      {item.category}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {formatNumber(item.count, 0)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {formatUsd(item.totalPnlUsd)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {formatClp(item.totalPnlClp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={ui.label}>Sin datos para resumir.</p>
        )}
      </section>
    </div>
  );
}