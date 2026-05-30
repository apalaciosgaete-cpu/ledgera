"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ui } from "@/styles/design-system";
import { httpClient } from "@/shared/http/httpClient";

type Movement = {
  id: string;
  type: string;
  symbol: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
  executedAt: string;
  deletedAt?: string | null;
  deletedReason?: string | null;
};

type MovementsResponse = {
  ok: boolean;
  message: string;
  data: Movement[] | null;
};

type AnnulMovementResponse = {
  ok: boolean;
  message: string;
  data?: { id?: string } | null;
};

type TypeFilter = "ALL" | "BUY" | "SELL";
type StatusFilter = "ALL" | "ACTIVE" | "DELETED";

function formatUsd(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: 8,
  }).format(value || 0);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function normalizeSymbol(value: string | null) {
  return String(value ?? "").trim().toUpperCase();
}

function MovementTypeBadge({ type }: { type: string }) {
  if (type === "BUY") {
    return (
      <span className={`rounded px-2 py-1 text-xs font-medium ${ui.badgeOk}`}>
        Compra
      </span>
    );
  }
  if (type === "SELL") {
    return (
      <span className={`rounded px-2 py-1 text-xs font-medium ${ui.badgeRisk}`}>
        Venta
      </span>
    );
  }
  return (
    <span className="rounded border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
      {type}
    </span>
  );
}

function MovementStatusBadge({ movement }: { movement: Movement }) {
  if (movement.deletedAt) {
    return (
      <span className="rounded border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
        Anulado
      </span>
    );
  }
  return (
    <span className="rounded bg-[#2563EB]/10 px-2 py-1 text-xs font-medium text-[#1D4ED8]">
      Activo
    </span>
  );
}

function MovementsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const symbolParam = normalizeSymbol(searchParams.get("symbol"));

  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [annullingId, setAnnullingId] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [symbolFilter, setSymbolFilter] = useState(symbolParam);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  async function fetchMovements() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/portfolio/movements", {
        cache: "no-store",
        credentials: "include",
      });
      const json: MovementsResponse = await res.json();
      if (!json.ok || !json.data) {
        setMessage(json.message || "No fue posible cargar movimientos.");
        setMovements([]);
        return;
      }
      setMovements(json.data);
    } catch (error) {
      console.error("MOVEMENTS PAGE ERROR:", error);
      setMessage("Error cargando movimientos.");
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchMovements();
  }, []);

  useEffect(() => {
    if (!symbolParam) return;
    setSymbolFilter(symbolParam);
    setStatusFilter("ACTIVE");
  }, [symbolParam]);

  useEffect(() => {
    if (!highlightId) return;
    const timeout = setTimeout(() => {
      const el = document.getElementById(`row-${highlightId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
    return () => clearTimeout(timeout);
  }, [highlightId, movements]);

  const activeMovements = useMemo(
    () => movements.filter((m) => !m.deletedAt),
    [movements],
  );

  const deletedMovements = useMemo(
    () => movements.filter((m) => m.deletedAt),
    [movements],
  );

  const availableSymbols = useMemo(
    () => Array.from(new Set(movements.map((m) => normalizeSymbol(m.symbol)).filter(Boolean))).sort(),
    [movements],
  );

  const filteredMovements = useMemo(() => {
    return movements
      .filter((movement) => {
        if (typeFilter !== "ALL" && movement.type !== typeFilter) return false;
        if (statusFilter === "ACTIVE" && movement.deletedAt) return false;
        if (statusFilter === "DELETED" && !movement.deletedAt) return false;
        if (symbolFilter && normalizeSymbol(movement.symbol) !== normalizeSymbol(symbolFilter)) return false;
        const movementTime = new Date(movement.executedAt).getTime();
        if (dateFrom) {
          const fromTime = new Date(dateFrom).getTime();
          if (!Number.isNaN(fromTime) && movementTime < fromTime) return false;
        }
        if (dateTo) {
          const toTime = new Date(dateTo).getTime();
          if (!Number.isNaN(toTime) && movementTime > toTime) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
  }, [movements, typeFilter, statusFilter, symbolFilter, dateFrom, dateTo]);

  const highlightedMovement = useMemo(() => {
    if (!highlightId) return null;
    return movements.find((m) => m.id === highlightId) || null;
  }, [highlightId, movements]);

  const totals = useMemo(() => {
    return activeMovements.reduce(
      (acc, movement) => {
        if (movement.type === "BUY") acc.buyCount += 1;
        if (movement.type === "SELL") acc.sellCount += 1;
        acc.totalFeeUsd += movement.feeUsd || 0;
        acc.totalNotionalUsd += movement.quantity * movement.priceUsd;
        return acc;
      },
      { buyCount: 0, sellCount: 0, totalFeeUsd: 0, totalNotionalUsd: 0 },
    );
  }, [activeMovements]);

  function clearFilters() {
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setSymbolFilter("");
    setDateFrom("");
    setDateTo("");
    setActionMessage(null);
    router.replace("/movements");
  }

  async function annulMovement(movement: Movement) {
    if (movement.deletedAt || annullingId) return;

    const reason = window.prompt(
      `Indica el motivo de anulación para el movimiento ${movement.symbol} del ${formatDate(movement.executedAt)}.`,
    );

    const normalizedReason = String(reason ?? "").trim();
    if (!normalizedReason) {
      setActionMessage("Anulación cancelada. El motivo es obligatorio.");
      return;
    }

    const confirmed = window.confirm(
      "Esta acción anulará el movimiento y recalculará el motor tributario. ¿Deseas continuar?",
    );

    if (!confirmed) {
      setActionMessage("Anulación cancelada.");
      return;
    }

    setAnnullingId(movement.id);
    setActionMessage(null);

    try {
      const response = await httpClient<AnnulMovementResponse>(`/api/portfolio/movements/${movement.id}`, {
        method: "DELETE",
        body: { reason: normalizedReason },
      });

      setActionMessage(response.message || "Movimiento anulado correctamente.");
      await fetchMovements();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "No fue posible anular el movimiento.");
    } finally {
      setAnnullingId(null);
    }
  }

  return (
    <section className={ui.page}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className={ui.title}>Movimientos</h1>
          <p className={ui.label}>
            Registro operativo que actúa como fuente de verdad para portafolio,
            eventos tributarios y reportes.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => router.push("/portafolio")} className={ui.buttonSecondary}>
            Ver portafolio
          </button>
          <button type="button" onClick={() => router.push("/tributario")} className={ui.buttonSecondary}>
            Revisión tributaria
          </button>
        </div>
      </div>

      {message && (
        <div className={`rounded p-4 text-sm ${ui.alertRisk}`}>{message}</div>
      )}

      {actionMessage && (
        <div className={`rounded p-4 text-sm ${ui.alertWarning}`}>{actionMessage}</div>
      )}

      {symbolParam && (
        <div className={`rounded p-4 text-sm ${ui.alertWarning}`}>
          Viendo movimientos del activo <span className="font-medium">{symbolParam}</span>.
        </div>
      )}

      {highlightId && (
        <div className={`rounded p-4 text-sm ${ui.alertWarning}`}>
          {highlightedMovement ? (
            <p>
              Movimiento destacado:{" "}
              <span className="font-medium">
                {highlightedMovement.symbol} · {formatDate(highlightedMovement.executedAt)}
              </span>
            </p>
          ) : (
            <p>Movimiento no encontrado en el listado actual.</p>
          )}
        </div>
      )}

      {loading ? (
        <div className={`${ui.card} p-4 text-sm text-slate-600`}>Cargando movimientos...</div>
      ) : movements.length === 0 ? (
        <div className={`${ui.card} space-y-4 p-6`}>
          <p className="font-medium text-slate-950">No hay movimientos registrados.</p>
          <p className="mt-1 text-sm text-slate-600">
            Agrega movimientos desde Portafolio para comenzar.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className={`${ui.card} p-4`}>
              <p className={ui.label}>Activos</p>
              <p className="text-2xl font-semibold text-slate-950">{activeMovements.length}</p>
            </div>
            <div className={`${ui.card} p-4`}>
              <p className={ui.label}>Compras</p>
              <p className="text-2xl font-semibold text-[#14532D]">{totals.buyCount}</p>
            </div>
            <div className={`${ui.card} p-4`}>
              <p className={ui.label}>Ventas</p>
              <p className="text-2xl font-semibold text-[#991B1B]">{totals.sellCount}</p>
            </div>
            <div className={`${ui.card} p-4`}>
              <p className={ui.label}>Anulados</p>
              <p className="text-2xl font-semibold text-slate-950">{deletedMovements.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className={`${ui.card} p-4`}>
              <p className={ui.label}>Volumen bruto USD</p>
              <p className="text-2xl font-semibold text-slate-950">{formatUsd(totals.totalNotionalUsd)}</p>
            </div>
            <div className={`${ui.card} p-4`}>
              <p className={ui.label}>Fees USD</p>
              <p className="text-2xl font-semibold text-slate-950">{formatUsd(totals.totalFeeUsd)}</p>
            </div>
          </div>

          <div className={`${ui.card} space-y-4 p-4`}>
            <h2 className="text-lg font-semibold text-slate-950">Filtros</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">Tipo</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                  <option value="ALL">Todos</option>
                  <option value="BUY">Compra</option>
                  <option value="SELL">Venta</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">Estado</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                  <option value="ALL">Todos</option>
                  <option value="ACTIVE">Activos</option>
                  <option value="DELETED">Anulados</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">Activo</label>
                <select value={symbolFilter} onChange={(e) => setSymbolFilter(e.target.value)} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                  <option value="">Todos</option>
                  {availableSymbols.map((symbol) => (
                    <option key={symbol} value={symbol}>{symbol}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">Desde</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">Hasta</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={clearFilters} className={ui.buttonSecondary}>Limpiar filtros</button>
              <p className={ui.label}>Mostrando {filteredMovements.length} de {movements.length} movimientos.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-950">Listado de movimientos</h2>
            {filteredMovements.length === 0 ? (
              <div className={`${ui.card} p-4 text-sm text-slate-600`}>
                No hay movimientos que coincidan con los filtros aplicados.
              </div>
            ) : (
              <div className="overflow-auto rounded border border-slate-200 bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-left text-slate-700">
                    <tr>
                      <th className="p-2">Fecha</th>
                      <th className="p-2">Tipo</th>
                      <th className="p-2">Activo</th>
                      <th className="p-2">Cantidad</th>
                      <th className="p-2">Precio USD</th>
                      <th className="p-2">Fee USD</th>
                      <th className="p-2">Estado</th>
                      <th className="p-2">Motivo anulación</th>
                      <th className="p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovements.map((movement) => {
                      const isHighlighted = movement.id === highlightId;
                      const isAnnulling = annullingId === movement.id;
                      return (
                        <tr
                          key={movement.id}
                          id={`row-${movement.id}`}
                          className={`border-t border-slate-200 ${movement.deletedAt ? "bg-slate-50 text-slate-500" : ""} ${isHighlighted ? "border-l-4 border-[#D97706] bg-[#F59E0B20]" : ""}`}
                        >
                          <td className="p-2">{formatDate(movement.executedAt)}</td>
                          <td className="p-2"><MovementTypeBadge type={movement.type} /></td>
                          <td className="p-2 font-medium text-slate-950">{movement.symbol}</td>
                          <td className="p-2">{formatNumber(movement.quantity)}</td>
                          <td className="p-2">{formatUsd(movement.priceUsd)}</td>
                          <td className="p-2">{formatUsd(movement.feeUsd)}</td>
                          <td className="p-2"><MovementStatusBadge movement={movement} /></td>
                          <td className="p-2">{movement.deletedReason || "-"}</td>
                          <td className="p-2">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => router.push(`/movements?highlight=${movement.id}`)}
                                className={`${ui.buttonSecondary} px-3 py-1 text-xs`}
                              >
                                Destacar
                              </button>
                              {!movement.deletedAt && (
                                <button
                                  type="button"
                                  onClick={() => void annulMovement(movement)}
                                  disabled={Boolean(annullingId)}
                                  className={`${ui.buttonSecondary} px-3 py-1 text-xs ${isAnnulling ? "opacity-60" : ""}`}
                                >
                                  {isAnnulling ? "Anulando..." : "Anular"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default function MovementsPageWrapper() {
  return (
    <Suspense fallback={null}>
      <MovementsPage />
    </Suspense>
  );
}
