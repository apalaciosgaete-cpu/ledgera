"use client";

import { useEffect, useMemo, useState } from "react";

type SummaryRow = {
  year: number;
  symbol: string;
  eventsCount: number;
  quantitySold: number;
  proceedsNetUsd: number;
  costBasisUsd: number;
  feeUsd: number;
  realizedPnlUsd: number;
  proceedsNetClp: number;
  costBasisClp: number;
  feeClp: number;
  realizedPnlClp: number;
};

type SummaryResponse = {
  ok: boolean;
  message?: string;
  data?: {
    usdClp: number;
    rows: SummaryRow[];
    totals: {
      eventsCount: number;
      quantitySold: number;
      proceedsNetUsd: number;
      costBasisUsd: number;
      feeUsd: number;
      realizedPnlUsd: number;
      proceedsNetClp: number;
      costBasisClp: number;
      feeClp: number;
      realizedPnlClp: number;
    };
  };
};

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatClp(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function buildQuery(year: string, symbol: string) {
  const params = new URLSearchParams();

  if (year) params.set("year", year);
  if (symbol) params.set("symbol", symbol.toUpperCase());

  const query = params.toString();
  return query ? `?${query}` : "";
}
console.log("RENDER TAX SUMMARY");
export default function TaxSummaryPage() {
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [totals, setTotals] = useState({
    eventsCount: 0,
    quantitySold: 0,
    proceedsNetUsd: 0,
    costBasisUsd: 0,
    feeUsd: 0,
    realizedPnlUsd: 0,
    proceedsNetClp: 0,
    costBasisClp: 0,
    feeClp: 0,
    realizedPnlClp: 0,
  });

  const [year, setYear] = useState("");
  const [symbol, setSymbol] = useState("");

  const [appliedYear, setAppliedYear] = useState("");
  const [appliedSymbol, setAppliedSymbol] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSummary(filters?: { year?: string; symbol?: string }) {
    try {
      setLoading(true);
      setError("");

      const query = buildQuery(
        filters?.year ?? appliedYear,
        filters?.symbol ?? appliedSymbol
      );

      const res = await fetch(`/api/tax/summary${query}`);
      const json = (await res.json()) as SummaryResponse;

      if (!res.ok || !json.ok || !json.data) {
        throw new Error(json.message ?? "Error al obtener resumen");
      }

      setRows(json.data.rows);
      setTotals(json.data.totals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSummary({ year: "", symbol: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = async () => {
    const sym = symbol.trim().toUpperCase();

    setAppliedYear(year);
    setAppliedSymbol(sym);

    await loadSummary({
      year,
      symbol: sym,
    });
  };

  const handleClear = async () => {
    setYear("");
    setSymbol("");

    setAppliedYear("");
    setAppliedSymbol("");

    await loadSummary({
      year: "",
      symbol: "",
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Resumen tributario</h1>
        <p className="text-sm text-gray-600">
          Agregado anual por activo (base para declaración)
        </p>
      </div>

      <div className="grid gap-4 border rounded-lg p-4 md:grid-cols-3">
        <input
          placeholder="Año (ej: 2026)"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />

        <input
          placeholder="Símbolo (BTC)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="border rounded px-3 py-2 text-sm uppercase"
        />

        <div className="flex gap-2">
          <button
            onClick={() => void handleApply()}
            className="border px-4 py-2 rounded text-sm"
          >
            Aplicar
          </button>

          <button
            onClick={() => void handleClear()}
            className="border px-4 py-2 rounded text-sm"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="border rounded p-4">
          <div className="text-sm text-gray-500">P/L total USD</div>
          <div className="text-xl font-semibold">
            {formatUsd(totals.realizedPnlUsd)}
          </div>
        </div>

        <div className="border rounded p-4">
          <div className="text-sm text-gray-500">P/L total CLP</div>
          <div className="text-xl font-semibold">
            {formatClp(totals.realizedPnlClp)}
          </div>
        </div>
      </div>

      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2">Año</th>
                <th className="px-4 py-2">Símbolo</th>
                <th className="px-4 py-2">Eventos</th>
                <th className="px-4 py-2">Cantidad</th>
                <th className="px-4 py-2">Proceeds USD</th>
                <th className="px-4 py-2">Costo USD</th>
                <th className="px-4 py-2">Fee USD</th>
                <th className="px-4 py-2">P/L USD</th>
                <th className="px-4 py-2">P/L CLP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2">{row.year}</td>
                  <td className="px-4 py-2">{row.symbol}</td>
                  <td className="px-4 py-2">{row.eventsCount}</td>
                  <td className="px-4 py-2">
                    {formatNumber(row.quantitySold, 8)}
                  </td>
                  <td className="px-4 py-2">
                    {formatUsd(row.proceedsNetUsd)}
                  </td>
                  <td className="px-4 py-2">
                    {formatUsd(row.costBasisUsd)}
                  </td>
                  <td className="px-4 py-2">{formatUsd(row.feeUsd)}</td>
                  <td className="px-4 py-2 font-medium">
                    {formatUsd(row.realizedPnlUsd)}
                  </td>
                  <td className="px-4 py-2 font-medium">
                    {formatClp(row.realizedPnlClp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div>No hay datos para los filtros seleccionados</div>
      )}
    </div>
  );
}