"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PeriodStatus = "OPEN" | "CLOSED" | "REOPENED";

export default function TaxOverviewPage() {
  const currentYear = new Date().getFullYear();

  const [periodStatus, setPeriodStatus] =
    useState<PeriodStatus>("OPEN");
  const [periodMeta, setPeriodMeta] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [showReopen, setShowReopen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  async function fetchStatus() {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      const res = await fetch(
        `/api/tax/periods/status?year=${currentYear}`,
        {
          headers: {
            Authorization: `Bearer ${token ?? ""}`,
          },
        },
      );

      const json = await res.json();

      if (!json.ok) throw new Error(json.message);

      setPeriodStatus(json.data.status);
      setPeriodMeta(json.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error cargando estado del período.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  function getBadgeClass(status: PeriodStatus) {
    if (status === "OPEN") return "bg-gray-100 text-gray-700";
    if (status === "REOPENED") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-700";
  }

  async function closePeriod() {
    try {
      setActionLoading(true);
      setMessage(null);

      const token = localStorage.getItem("token");

      const res = await fetch("/api/tax/periods/close", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token ?? ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year: currentYear,
          closedReason: "Cierre desde interfaz",
        }),
      });

      const json = await res.json();

      if (!json.ok) throw new Error(json.message);

      setMessage("Período cerrado correctamente.");
      await fetchStatus();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Error cerrando período.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function reopenPeriod() {
    try {
      setActionLoading(true);
      setMessage(null);

      const token = localStorage.getItem("token");

      const res = await fetch("/api/tax/periods/reopen", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token ?? ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year: currentYear,
          reopenReason: reopenReason,
        }),
      });

      const json = await res.json();

      if (!json.ok) throw new Error(json.message);

      setMessage("Período reabierto correctamente.");
      setShowReopen(false);
      setReopenReason("");

      await fetchStatus();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Error reabriendo período.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <section className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">
          Resumen tributario
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Control del estado tributario del período {currentYear}.
        </p>

        {/* ESTADO */}
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeClass(
              periodStatus,
            )}`}
          >
            {periodStatus === "OPEN" && "Período abierto"}
            {periodStatus === "CLOSED" && "Período cerrado"}
            {periodStatus === "REOPENED" && "Período reabierto"}
          </span>

          {periodMeta?.closedAt && (
            <span className="text-xs text-gray-500">
              Cierre:{" "}
              {new Date(
                periodMeta.closedAt,
              ).toLocaleString("es-CL")}
            </span>
          )}
        </div>

        {/* ACCIONES */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {(periodStatus === "OPEN" ||
            periodStatus === "REOPENED") && (
            <button
              onClick={closePeriod}
              disabled={actionLoading}
              className="px-4 py-2 text-sm rounded bg-red-600 text-white disabled:opacity-50"
            >
              {actionLoading ? "Procesando..." : "Cerrar período"}
            </button>
          )}

          {periodStatus === "CLOSED" && (
            <button
              onClick={() => setShowReopen(true)}
              className="px-4 py-2 text-sm rounded bg-yellow-500 text-white"
            >
              Reabrir período
            </button>
          )}

          <Link
            href="/tax/audit"
            className="px-4 py-2 text-sm rounded border"
          >
            Ver auditoría
          </Link>
        </div>
      </div>

      {/* REAPERTURA */}
      {showReopen && (
        <div className="border rounded p-4 space-y-3">
          <p className="text-sm font-medium">
            Motivo de reapertura
          </p>

          <input
            type="text"
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            className="w-full border px-3 py-2 rounded text-sm"
            placeholder="Ingrese motivo..."
          />

          <div className="flex gap-2">
            <button
              onClick={reopenPeriod}
              disabled={!reopenReason || actionLoading}
              className="px-4 py-2 text-sm rounded bg-yellow-500 text-white disabled:opacity-50"
            >
              Confirmar reapertura
            </button>

            <button
              onClick={() => setShowReopen(false)}
              className="px-4 py-2 text-sm rounded border"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MENSAJE */}
      {message && (
        <div className="border rounded p-3 text-sm bg-blue-50 text-blue-700">
          {message}
        </div>
      )}

      {/* ESTADOS */}
      {loading && (
        <div className="text-sm">Cargando estado...</div>
      )}

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
    </section>
  );
}