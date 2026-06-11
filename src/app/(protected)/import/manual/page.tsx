"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type MovementType = "BUY" | "SELL";

type FormState = {
  type: MovementType;
  symbol: string;
  quantity: string;
  priceUsd: string;
  feeUsd: string;
  executedAt: string;
};

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T | null;
};

type InventoryPreviewData = {
  symbol: string;
  executedAt: string;
  availableQuantity: number;
};

const INITIAL_FORM: FormState = {
  type: "BUY",
  symbol: "",
  quantity: "",
  priceUsd: "",
  feeUsd: "",
  executedAt: "",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: 8,
  }).format(value);
}

function getToken() {
  return localStorage.getItem("token") ?? "";
}

async function readJson<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error("La respuesta del servidor no es JSON.");
  }

  return (await response.json()) as ApiResponse<T>;
}

export default function ManualImportPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [inventoryPreview, setInventoryPreview] = useState<number | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  const normalizedSymbol = form.symbol.trim().toUpperCase();

  const requestedQuantity = useMemo(() => {
    const value = Number(form.quantity);
    return Number.isFinite(value) ? value : 0;
  }, [form.quantity]);

  const exceedsAvailableInventory =
    form.type === "SELL" &&
    inventoryPreview !== null &&
    requestedQuantity > inventoryPreview;

  const canSubmit =
    !loading &&
    !rebuilding &&
    Boolean(normalizedSymbol) &&
    requestedQuantity > 0 &&
    Number(form.priceUsd) > 0 &&
    Number(form.feeUsd || 0) >= 0 &&
    Boolean(form.executedAt) &&
    !exceedsAvailableInventory;

  function updateField<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setMessage(null);
    setError(null);
  }

  async function fetchInventoryPreview(symbol: string, executedAt: string) {
    if (!symbol || !executedAt) {
      setInventoryPreview(null);
      return;
    }

    setInventoryLoading(true);

    try {
      const response = await fetch("/api/portfolio/inventory-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        credentials: "include",
        body: JSON.stringify({
          symbol: symbol.trim().toUpperCase(),
          executedAt: new Date(executedAt).toISOString(),
        }),
      });

      const result = await readJson<InventoryPreviewData>(response);

      if (!response.ok || !result.ok || !result.data) {
        setInventoryPreview(null);
        return;
      }

      setInventoryPreview(result.data.availableQuantity);
    } catch {
      setInventoryPreview(null);
    } finally {
      setInventoryLoading(false);
    }
  }

  useEffect(() => {
    if (form.type !== "SELL") {
      setInventoryPreview(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      fetchInventoryPreview(form.symbol, form.executedAt);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [form.symbol, form.executedAt, form.type]);

  function validateForm() {
    if (!normalizedSymbol) return "El símbolo es obligatorio.";
    if (requestedQuantity <= 0) return "Cantidad inválida.";
    if (Number(form.priceUsd) <= 0) return "Precio inválido.";
    if (Number(form.feeUsd || 0) < 0) return "Fee inválido.";
    if (!form.executedAt) return "Fecha obligatoria.";

    if (exceedsAvailableInventory) {
      return "La cantidad supera el inventario disponible a esa fecha.";
    }

    return null;
  }

  async function rebuildTaxEvents() {
    setRebuilding(true);

    try {
      const response = await fetch("/api/tax/events/rebuild", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        credentials: "include",
      });

      const result = await readJson<unknown>(response);

      if (!response.ok || !result.ok) {
        throw new Error(
          result.message || "No fue posible recalcular eventos tributarios.",
        );
      }
    } finally {
      setRebuilding(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(null);
    setError(null);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/portfolio/movements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        credentials: "include",
        body: JSON.stringify({
          type: form.type,
          symbol: normalizedSymbol,
          quantity: requestedQuantity,
          priceUsd: Number(form.priceUsd),
          feeUsd: Number(form.feeUsd || 0),
          executedAt: new Date(form.executedAt).toISOString(),
        }),
      });

      const result = await readJson<unknown>(response);

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Error al crear movimiento.");
      }

      await rebuildTaxEvents();

      setMessage(
        "Movimiento creado correctamente. Eventos tributarios recalculados.",
      );

      setForm(INITIAL_FORM);
      setInventoryPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Ingreso manual</h1>
        <p className="mt-1 text-sm text-gray-500">
          Registra compras o ventas. Cada movimiento alimenta portafolio,
          eventos tributarios y reportes.
        </p>
      </div>

      <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
        No ingreses saldos manuales. LEDGERA reconstruye inventario, costo FIFO
        y resultado tributario desde movimientos.
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Tipo</span>
            <select
              value={form.type}
              onChange={(event) =>
                updateField("type", event.target.value as MovementType)
              }
              className="w-full rounded-lg border p-2"
            >
              <option value="BUY">Compra</option>
              <option value="SELL">Venta</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span>Símbolo</span>
            <input
              value={form.symbol}
              onChange={(event) => updateField("symbol", event.target.value)}
              placeholder="Ej: BTC"
              className="w-full rounded-lg border p-2 uppercase"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span>Cantidad</span>
            <input
              type="number"
              step="any"
              value={form.quantity}
              onChange={(event) => updateField("quantity", event.target.value)}
              className="w-full rounded-lg border p-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span>Precio USD</span>
            <input
              type="number"
              step="any"
              value={form.priceUsd}
              onChange={(event) => updateField("priceUsd", event.target.value)}
              className="w-full rounded-lg border p-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span>Fee USD</span>
            <input
              type="number"
              step="any"
              value={form.feeUsd}
              onChange={(event) => updateField("feeUsd", event.target.value)}
              className="w-full rounded-lg border p-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span>Fecha</span>
            <input
              type="datetime-local"
              value={form.executedAt}
              onChange={(event) =>
                updateField("executedAt", event.target.value)
              }
              className="w-full rounded-lg border p-2"
            />
          </label>
        </div>

        {form.type === "SELL" && (
          <div className="mt-4 rounded-lg border bg-gray-50 p-3 text-sm">
            <p className="font-medium">Inventario disponible</p>
            <p className="mt-1 text-gray-600">
              {inventoryLoading
                ? "Calculando inventario..."
                : inventoryPreview !== null
                  ? `${formatNumber(inventoryPreview)} ${normalizedSymbol}`
                  : "Completa símbolo y fecha para calcular disponibilidad."}
            </p>

            {exceedsAvailableInventory && (
              <p className="mt-2 text-red-600">
                La venta supera el inventario disponible. No se puede guardar.
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Guardando..."
              : rebuilding
                ? "Recalculando..."
                : "Guardar movimiento"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/movements")}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Ver movimientos
          </button>

          <button
            type="button"
            onClick={() => router.push("/portfolio")}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Ver portafolio
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <p>{message}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/experto/operaciones")}
              className="rounded border px-3 py-2 text-xs font-medium"
            >
              Revisar tributación
            </button>

            <button
              type="button"
              onClick={() => router.push("/portfolio")}
              className="rounded border px-3 py-2 text-xs font-medium"
            >
              Ver portafolio
            </button>
          </div>
        </div>
      )}
    </section>
  );
}