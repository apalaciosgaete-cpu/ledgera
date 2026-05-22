"use client";

import { useCallback, useEffect, useState } from "react";
import { getSessionToken } from "@/modules/identity/client/authStorage";

type ConnStatus = {
  connected:      boolean;
  apiKeyHint?:    string;
  lastSyncAt?:    string | null;
  lastSyncStatus?: string | null;
};

type ApiResponse<T> = { ok: boolean; message: string; data: T };

function readCsrfCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split("; ").find(c => c.startsWith("ledgera_csrf="));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : "";
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const token = getSessionToken() ?? "";
  const csrf  = readCsrfCookie();
  const res   = await fetch(url, {
    ...init,
    headers: {
      Authorization:     `Bearer ${token}`,
      "x-ledgera-csrf":  csrf,
      ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  return res.json() as Promise<ApiResponse<T>>;
}

export default function BinanceTaxConnectPage() {
  const [status,   setStatus]   = useState<ConnStatus | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [apiKey,   setApiKey]   = useState("");
  const [secret,   setSecret]   = useState("");
  const [saving,   setSaving]   = useState(false);
  const [result,   setResult]   = useState<{ ok: boolean; message: string } | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      // Ensure CSRF cookie is set before any POST
      await fetch("/api/csrf", { credentials: "include", cache: "no-store" });
      const res = await apiFetch<ConnStatus>("/api/integrations/binance/tax/connect");
      if (res.ok) setStatus(res.data);
      else setStatus({ connected: false });
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim() || !secret.trim()) return;
    setSaving(true);
    setResult(null);
    try {
      const res = await apiFetch<ConnStatus>("/api/integrations/binance/tax/connect", {
        method: "POST",
        body:   JSON.stringify({ apiKey: apiKey.trim(), apiSecret: secret.trim() }),
      });
      setResult({ ok: res.ok, message: res.message });
      if (res.ok) {
        setStatus(res.data ?? { connected: true });
        setApiKey("");
        setSecret("");
      }
    } catch {
      setResult({ ok: false, message: "Error de red al conectar." });
    } finally {
      setSaving(false);
    }
  }

  const isConnected = status?.connected === true;

  return (
    <section className="p-6 max-w-xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <a href="/portafolio" className="text-xs text-gray-400 hover:text-gray-600">
          ← Volver al portafolio
        </a>
        <h1 className="text-2xl font-semibold mt-2">API tributaria Binance</h1>
        <p className="text-sm text-gray-500 mt-1">
          Conecta tu API Tax Report de Binance para acceder al historial tributario completo multi-año.
        </p>
      </div>

      {/* Estado actual */}
      {!loading && (
        <div className={`rounded-xl border p-4 flex items-center justify-between ${
          isConnected ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
        }`}>
          <div>
            <p className={`text-sm font-semibold ${isConnected ? "text-green-800" : "text-amber-800"}`}>
              {isConnected ? "API tributaria conectada" : "No conectada"}
            </p>
            {isConnected && status?.apiKeyHint && (
              <p className="text-xs text-green-600 mt-0.5">Clave …{status.apiKeyHint}</p>
            )}
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            isConnected ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}>
            {isConnected ? "Activa" : "Pendiente"}
          </span>
        </div>
      )}

      {/* Resultado de guardado */}
      {result && (
        <div className={`rounded-xl border p-4 text-sm ${
          result.ok ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {result.message}
          {result.ok && (
            <div className="mt-3">
              <a href="/portafolio" className="inline-block px-4 py-2 rounded-lg bg-black text-white text-sm font-medium">
                Volver al portafolio
              </a>
            </div>
          )}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">
            {isConnected ? "Actualizar credenciales" : "Ingresar credenciales"}
          </h2>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Ingresa tu API Key de Tax Report"
              autoComplete="off"
              spellCheck={false}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Secret Key
            </label>
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="Ingresa tu Secret Key de Tax Report"
              autoComplete="new-password"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
            />
            <p className="text-xs text-gray-400">El Secret no se mostrará una vez guardado.</p>
          </div>

          <button
            type="submit"
            disabled={saving || !apiKey.trim() || !secret.trim()}
            className="w-full py-2.5 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-40"
          >
            {saving ? "Verificando y guardando…" : isConnected ? "Actualizar API tributaria" : "Conectar API tributaria"}
          </button>
        </div>
      </form>

      {/* Instrucciones */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2 text-xs text-gray-500">
        <p className="font-medium text-gray-700">Cómo obtener la API Tax Report en Binance</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Ve a <strong>Gestión de API</strong> en tu cuenta Binance</li>
          <li>Crea una nueva API Key con permiso <strong>Read Only</strong></li>
          <li>Activa el permiso <strong>Tax Report</strong> (o equivalente en tu región)</li>
          <li>Copia el API Key y Secret aquí antes de cerrar la pantalla</li>
        </ol>
        <p className="mt-2 text-gray-400">
          Esta API es independiente de tu API Spot. Puedes tener ambas activas simultáneamente.
        </p>
      </div>

    </section>
  );
}
