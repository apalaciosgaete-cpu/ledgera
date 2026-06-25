"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseBinanceFile, type ParsedBinanceRow } from "@/modules/integrations/binance/application/parseBinanceFile";
import { getSessionToken } from "@/modules/identity/client/authStorage";

type KindHint = "DEPOSIT" | "WITHDRAWAL" | "";

type PreviewState = {
  rows:   ParsedBinanceRow[];
  format: string;
  errors: string[];
  file:   File;
};

type ImportResult = {
  imported:       number;
  skipped:        number;
  autoConfirmed:  number;
  pendingReview:  number;
  taxRebuilt:     boolean;
  format:         string;
  errors:         string[];
};

function readCsrfCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split("; ").find(c => c.startsWith("ledgera_csrf="));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : "";
}

function isSpreadsheetFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    type.includes("spreadsheet") ||
    type.includes("excel")
  );
}

function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return name.endsWith(".csv") || type.includes("csv") || type === "text/plain";
}

function formatKind(row: ParsedBinanceRow): string {
  if (row.kind === "TRADE") return `${row.side} ${row.pair}`;
  return row.kind;
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("es-CL"); } catch { return iso; }
}

function formatNum(n: number): string {
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 8 }).format(n);
}

export default function BinanceImportPage() {
  const router = useRouter();
  const inputRef   = useRef<HTMLInputElement>(null);
  const [kindHint, setKindHint]     = useState<KindHint>("");
  const [preview,  setPreview]      = useState<PreviewState | null>(null);
  const [loading,  setLoading]      = useState(false);
  const [result,   setResult]       = useState<{ ok: boolean; message: string; data?: ImportResult } | null>(null);
  const [dragOver, setDragOver]     = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const processFile = useCallback((file: File) => {
    setResult(null);
    setRedirecting(false);

    if (isSpreadsheetFile(file)) {
      setPreview({
        rows: [],
        format: "EXCEL",
        errors: [],
        file,
      });
      return;
    }

    if (!isCsvFile(file)) {
      setPreview(null);
      setResult({
        ok: false,
        message: "Formato no soportado. Sube un archivo CSV, XLSX o XLS exportado desde Binance.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const hint = kindHint === "DEPOSIT" ? "DEPOSIT"
                 : kindHint === "WITHDRAWAL" ? "WITHDRAWAL"
                 : undefined;
      const parsed = parseBinanceFile(text, { kindHint: hint });
      setPreview({ ...parsed, file });
    };
    reader.onerror = () => {
      setPreview(null);
      setResult({
        ok: false,
        message: "No fue posible leer el archivo seleccionado.",
      });
    };
    reader.readAsText(file, "utf-8");
  }, [kindHint]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    if (!preview) return;
    setLoading(true);
    setResult(null);
    setRedirecting(false);

    try {
      const form = new FormData();
      form.append("file", preview.file);
      if (kindHint) form.append("kindHint", kindHint);

      const token = getSessionToken() ?? "";
      const csrf  = readCsrfCookie();

      const res = await fetch("/api/integrations/binance/import-file", {
        method:      "POST",
        headers:     { Authorization: `Bearer ${token}`, "x-ledgera-csrf": csrf },
        credentials: "include",
        body:        form,
      });

      const json = await res.json() as { ok: boolean; message: string; data?: ImportResult };
      setResult(json);

      if (json.ok) {
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";

        const processedRows =
          (json.data?.imported ?? 0) +
          (json.data?.skipped ?? 0) +
          (json.data?.autoConfirmed ?? 0) +
          (json.data?.pendingReview ?? 0);

        if (processedRows > 0) {
          setRedirecting(true);
          window.setTimeout(() => {
            router.push("/cryptoactivos");
          }, 900);
        }
      }
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Error al importar." });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setRedirecting(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const previewRows = preview?.rows.slice(0, 10) ?? [];
  const isAmbiguous = preview?.format === "DEPOSIT" || preview?.format === "WITHDRAWAL";
  const previewIsSpreadsheet = preview ? isSpreadsheetFile(preview.file) : false;
  const canImport = Boolean(preview) && (previewRows.length > 0 || previewIsSpreadsheet);

  return (
    <section className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Importar historial de Binance</h1>
        <p className="text-sm text-gray-500 mt-1">
          Sube un archivo CSV o Excel exportado desde Binance. Compatible con historial de operaciones, depósitos y retiros.
        </p>
      </div>

      {/* Kind hint selector — shown before upload */}
      {!preview && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Tipo de archivo (opcional)</label>
          <select
            value={kindHint}
            onChange={e => setKindHint(e.target.value as KindHint)}
            className="block w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Detectar automáticamente</option>
            <option value="DEPOSIT">Historial de depósitos</option>
            <option value="WITHDRAWAL">Historial de retiros</option>
          </select>
          <p className="text-xs text-gray-400">Solo necesario para archivos de depósitos/retiros que comparten el mismo formato.</p>
        </div>
      )}

      {/* Drop zone */}
      {!preview && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            dragOver ? "border-black bg-gray-50" : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <p className="text-sm text-gray-500">Arrastra un archivo CSV o Excel aquí o <span className="underline">haz clic para seleccionar</span></p>
          <p className="text-xs text-gray-400 mt-1">.csv, .xlsx o .xls — máx. 10 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Ambiguous format warning + re-select hint */}
      {preview && isAmbiguous && !kindHint && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          El archivo tiene formato de depósito/retiro. Si es un historial de retiros, selecciona el tipo y vuelve a cargar el archivo.
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Archivo seleccionado</span>
              <span className="ml-2 text-xs text-gray-500">
                {preview.file.name} · {preview.rows.length > 0 ? `${preview.rows.length} filas detectadas · formato ${preview.format}` : `formato ${preview.format}`}
              </span>
            </div>
            <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 underline">
              Cambiar archivo
            </button>
          </div>

          {preview.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 space-y-1">
              {preview.errors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}

          {previewIsSpreadsheet && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              El archivo Excel se procesará en el servidor al confirmar la importación. Si contiene varias hojas, LEDGERA leerá la primera hoja exportada por Binance.
            </div>
          )}

          {previewRows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Fecha</th>
                    <th className="px-3 py-2 text-left font-medium">Tipo</th>
                    <th className="px-3 py-2 text-right font-medium">Cantidad</th>
                    <th className="px-3 py-2 text-right font-medium">Precio / Importe</th>
                    <th className="px-3 py-2 text-right font-medium">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewRows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500">{formatDate(row.date)}</td>
                      <td className="px-3 py-2 font-medium">{formatKind(row)}</td>
                      <td className="px-3 py-2 text-right">
                        {row.kind === "TRADE" ? formatNum(row.quantity) : formatNum(row.amount)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {row.kind === "TRADE" ? `$${formatNum(row.price)}` : `${row.kind === "DEPOSIT" ? "+" : "-"}${formatNum(row.amount)} ${row.coin}`}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-500">
                        {row.kind === "TRADE" ? `${formatNum(row.fee)} ${row.feeAsset}` : formatNum(row.fee)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview && preview.rows.length > 10 && (
                <p className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100">
                  … y {preview.rows.length - 10} filas más
                </p>
              )}
            </div>
          )}

          {canImport && (
            <button
              onClick={handleImport}
              disabled={loading || redirecting}
              className="px-6 py-2 rounded-lg bg-black text-white text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Importando…" : preview.rows.length > 0 ? `Confirmar importación (${preview.rows.length} filas)` : "Confirmar importación"}
            </button>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-xl border p-4 space-y-2 ${result.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <p className={`text-sm font-medium ${result.ok ? "text-green-800" : "text-red-800"}`}>
            {result.message}
          </p>
          {result.ok && result.data && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-green-700 mt-2">
              <span>Importados nuevos: <strong>{result.data.imported}</strong></span>
              <span>Ya existían: <strong>{result.data.skipped}</strong></span>
              <span>Auto-confirmados: <strong>{result.data.autoConfirmed}</strong></span>
              <span>En revisión manual: <strong>{result.data.pendingReview}</strong></span>
              <span>Eventos recalculados: <strong>{result.data.taxRebuilt ? "Sí" : "No"}</strong></span>
            </div>
          )}
          {redirecting && (
            <p className="text-xs text-green-600">
              Redirigiendo a Activos para revisar el resultado importado…
            </p>
          )}
          {result.data?.errors && result.data.errors.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {result.data.errors.slice(0, 5).map((e, i) => (
                <p key={i} className="text-xs text-red-700">{e}</p>
              ))}
              {result.data.errors.length > 5 && (
                <p className="text-xs text-red-500">… y {result.data.errors.length - 5} errores más</p>
              )}
            </div>
          )}
          {result.ok && result.data && result.data.pendingReview > 0 && (
            <p className="text-xs text-green-600 mt-1">
              Los eventos en revisión aparecerán en el panel de Binance para resolución manual.
            </p>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2 text-xs text-gray-500">
        <p className="font-medium text-gray-700">Cómo exportar desde Binance</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Ve a <strong>Cartera → Historial de operaciones</strong> (o Depósitos / Retiros)</li>
          <li>Aplica el filtro de fechas deseado</li>
          <li>Haz clic en <strong>Exportar → CSV o Excel</strong></li>
          <li>Sube el archivo aquí y confirma la importación</li>
        </ol>
        <p className="mt-2">Formatos compatibles: Trade History (A y B), Deposit History, Withdrawal History en CSV, XLSX o XLS.</p>
      </div>
    </section>
  );
}
