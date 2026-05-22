"use client";

import React, { useEffect, useRef, useState } from "react";
import { BinanceSyncDrawer } from "@/modules/integrations/binance/client/BinanceSyncDrawer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Movement {
  id: string;
  type: "BUY" | "SELL" | "DEPOSIT" | "WITHDRAW";
  symbol: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
  executedAt: string;
  deletedAt: string | null;
  deletedReason: string | null;
  suggestedTaxCategory: string;
}

interface FxRate {
  usdToClp: number;
  source: string;
}

interface FormState {
  type: "BUY" | "SELL";
  symbol: string;
  quantity: string;
  priceUsd: string;
  feeUsd: string;
  executedAt: string;
}

interface CsvRow {
  type: string;
  symbol: string;
  quantity: string;
  priceUsd: string;
  feeUsd: string;
  executedAt: string;
}

interface ImportResult {
  imported: number;
  rebuiltEvents: number;
  taxEngineVersion?: string;
  warnings?: Array<{ movementId: string; symbol: string; message: string }>;
}

type InventoryErrorCode =
  | "INSUFFICIENT_INVENTORY"
  | "NEGATIVE_INVENTORY"
  | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowLocalInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

const INITIAL_FORM: FormState = {
  type: "BUY",
  symbol: "",
  quantity: "",
  priceUsd: "",
  feeUsd: "",
  executedAt: nowLocalInput(),
};

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(value: number, decimals = 8) {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
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

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return {
      type: (row["type"] ?? "").toUpperCase(),
      symbol: (row["symbol"] ?? "").toUpperCase(),
      quantity: row["quantity"] ?? "",
      priceUsd: row["priceusd"] ?? row["price_usd"] ?? row["price"] ?? "",
      feeUsd: row["feeusd"] ?? row["fee_usd"] ?? row["fee"] ?? "0",
      executedAt: row["executedat"] ?? row["executed_at"] ?? row["date"] ?? "",
    };
  });
}

// ─── Estilos compartidos ──────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "#64748B",
  marginBottom: "5px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  borderRadius: "8px",
  border: "1px solid rgba(15, 42, 61, 0.15)",
  fontSize: "0.875rem",
  fontFamily: "var(--font-body)",
  color: "#0F2A3D",
  background: "#ffffff",
  boxSizing: "border-box",
  outline: "none",
};

const cellStyle: React.CSSProperties = {
  padding: "0.75rem",
  color: "#475569",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

// ─── CoinLogo ─────────────────────────────────────────────────────────────────

function CoinLogo({ symbol, size = 24 }: { symbol: string; size?: number }) {
  const [error, setError] = useState(false);
  const sym = symbol.toLowerCase().replace(/usdt$|usdc$|busd$|fdusd$/, "");
  if (error) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size < 20 ? "7px" : "9px", fontWeight: 700, color: "#64748B", flexShrink: 0 }}>
        {symbol.slice(0, 3)}
      </div>
    );
  }
  return (
    <img
      src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/128/color/${sym}.png`}
      alt={symbol}
      width={size}
      height={size}
      onError={() => setError(true)}
      style={{ borderRadius: "50%", flexShrink: 0 }}
    />
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ background: "#F1F5F9", borderRadius: "10px", padding: "1rem" }}>
      <p
        style={{
          fontSize: "0.6875rem",
          color: "#64748B",
          margin: "0 0 6px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.5rem",
          fontWeight: 700,
          color: highlight ? "#16A34A" : "#0F2A3D",
          margin: 0,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </div>
  );
}

// ─── InventoryErrorBlock ──────────────────────────────────────────────────────

function InventoryErrorBlock({
  code,
  message,
}: {
  code: InventoryErrorCode;
  message: string;
}) {
  const isNegative = code === "NEGATIVE_INVENTORY";
  return (
    <div
      style={{
        margin: "0 0 1rem",
        padding: "0.875rem 1rem",
        borderRadius: "10px",
        background: isNegative
          ? "rgba(220, 38, 38, 0.06)"
          : "rgba(234, 179, 8, 0.07)",
        border: `1px solid ${
          isNegative ? "rgba(220,38,38,0.2)" : "rgba(234,179,8,0.3)"
        }`,
      }}
    >
      <p
        style={{
          margin: "0 0 4px",
          fontWeight: 700,
          fontSize: "0.8125rem",
          color: isNegative ? "#DC2626" : "#92400E",
        }}
      >
        {isNegative ? "🔴 Inventario negativo detectado" : "⚠️ Inventario insuficiente"}
      </p>
      <p
        style={{
          margin: "0 0 6px",
          fontSize: "0.8125rem",
          color: "#475569",
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>
      <p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}>
        {isNegative
          ? "Corrige la fila indicada en el CSV antes de importar."
          : "Ajusta la cantidad o revisa los movimientos anteriores."}
      </p>
    </div>
  );
}

// ─── CsvImportSection ─────────────────────────────────────────────────────────

function CsvImportSection({ onSuccess }: { onSuccess: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importErrorCode, setImportErrorCode] = useState<InventoryErrorCode>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    setParseError(null);
    setImportError(null);
    setImportErrorCode(null);
    setImportResult(null);
    setRows([]);

    if (!file.name.endsWith(".csv")) {
      setParseError("Solo se aceptan archivos .csv");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed = parseCsv(text);
        if (parsed.length === 0) {
          setParseError("El CSV no contiene filas válidas.");
          return;
        }
        setRows(parsed);
      } catch {
        setParseError("Error al leer el CSV. Revisa el formato.");
      }
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function clearFile() {
    setRows([]);
    setFileName(null);
    setParseError(null);
    setImportError(null);
    setImportErrorCode(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    setImportError(null);
    setImportErrorCode(null);
    setImportResult(null);

    try {
      const movements = rows.map((r) => ({
        type: r.type,
        symbol: r.symbol,
        quantity: Number(r.quantity),
        priceUsd: Number(r.priceUsd),
        feeUsd: Number(r.feeUsd || 0),
        executedAt: r.executedAt
          ? new Date(r.executedAt).toISOString()
          : new Date().toISOString(),
      }));

      const res = await fetch("/api/movements/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movements }),
      });

      const json = await res.json();

      if (!json.ok) {
        const code = json.code as InventoryErrorCode;
        setImportErrorCode(code ?? null);
        setImportError(json.message ?? "Error al importar movimientos.");
        return;
      }

      setImportResult(json.data);
      setRows([]);
      setFileName(null);
      onSuccess();
    } catch {
      setImportError("Error de conexión al importar.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid rgba(15, 42, 61, 0.1)",
        borderRadius: "14px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "0.9375rem",
          color: "#0F2A3D",
          margin: "0 0 0.25rem",
        }}
      >
        Importar CSV
      </p>
      <p style={{ fontSize: "0.8125rem", color: "#94A3B8", margin: "0 0 1.25rem" }}>
        Columnas requeridas:{" "}
        <code
          style={{
            background: "#F1F5F9",
            padding: "1px 6px",
            borderRadius: "4px",
            fontSize: "0.75rem",
          }}
        >
          type, symbol, quantity, priceUsd, feeUsd, executedAt
        </code>
      </p>

      {/* Zona de drop */}
      {rows.length === 0 && !importResult && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "#0F2A3D" : "rgba(15,42,61,0.18)"}`,
            borderRadius: "12px",
            padding: "2.5rem",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "rgba(15,42,61,0.03)" : "#FAFAFA",
            transition: "all 0.15s ease",
            marginBottom: "1rem",
          }}
        >
          <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#0F2A3D", fontSize: "0.9375rem" }}>
            {dragging ? "Suelta el archivo aquí" : "Arrastra tu CSV aquí"}
          </p>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#94A3B8" }}>
            o haz clic para seleccionar archivo
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      )}

      {/* Error de parseo */}
      {parseError && (
        <p
          style={{
            fontSize: "0.8125rem",
            color: "#DC2626",
            margin: "0 0 1rem",
            background: "rgba(220,38,38,0.06)",
            padding: "0.5rem 0.75rem",
            borderRadius: "8px",
            border: "1px solid rgba(220,38,38,0.15)",
          }}
        >
          {parseError}
        </p>
      )}

      {/* Preview de filas */}
      {rows.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#0F2A3D", fontWeight: 600 }}>
              📄 {fileName} —{" "}
              <span style={{ color: "#64748B", fontWeight: 400 }}>
                {rows.length} fila{rows.length !== 1 ? "s" : ""} detectada{rows.length !== 1 ? "s" : ""}
              </span>
            </p>
            <button
              onClick={clearFile}
              style={{
                background: "transparent",
                border: "1px solid rgba(15,42,61,0.15)",
                borderRadius: "6px",
                padding: "3px 10px",
                fontSize: "0.75rem",
                color: "#64748B",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              Limpiar
            </button>
          </div>

          {/* Tabla preview */}
          <div
            style={{
              overflowX: "auto",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              marginBottom: "1rem",
              maxHeight: "260px",
              overflowY: "auto",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead style={{ position: "sticky", top: 0, background: "#F8FAFC" }}>
                <tr>
                  {["#", "Tipo", "Símbolo", "Cantidad", "Precio USD", "Fee USD", "Fecha"].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: "0.5rem 0.75rem",
                        textAlign: "left",
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        color: "#94A3B8",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        borderBottom: "1px solid #E2E8F0",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const isInvalid =
                    !["BUY", "SELL"].includes(r.type) ||
                    !r.symbol ||
                    isNaN(Number(r.quantity)) ||
                    Number(r.quantity) <= 0 ||
                    isNaN(Number(r.priceUsd)) ||
                    Number(r.priceUsd) <= 0;

                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        background: isInvalid ? "rgba(220,38,38,0.04)" : "transparent",
                      }}
                    >
                      <td style={{ ...cellStyle, color: isInvalid ? "#DC2626" : "#94A3B8", fontWeight: 600 }}>
                        {i + 1}
                      </td>
                      <td style={cellStyle}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "1px 8px",
                            borderRadius: "5px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background:
                              r.type === "BUY"
                                ? "rgba(22,163,74,0.1)"
                                : r.type === "SELL"
                                ? "rgba(220,38,38,0.1)"
                                : "rgba(148,163,184,0.15)",
                            color:
                              r.type === "BUY"
                                ? "#16A34A"
                                : r.type === "SELL"
                                ? "#DC2626"
                                : "#94A3B8",
                          }}
                        >
                          {r.type || "—"}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, fontWeight: 600, color: "#0F2A3D", fontFamily: "var(--font-display)" }}>
                        {r.symbol || "—"}
                      </td>
                      <td style={cellStyle}>{r.quantity || "—"}</td>
                      <td style={cellStyle}>{r.priceUsd ? `$${r.priceUsd}` : "—"}</td>
                      <td style={cellStyle}>{r.feeUsd ? `$${r.feeUsd}` : "$0"}</td>
                      <td style={cellStyle}>{r.executedAt || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Error de importación */}
          {importError && (
            <InventoryErrorBlock
              code={importErrorCode}
              message={importError}
            />
          )}

          {/* Botón importar */}
          <button
            onClick={handleImport}
            disabled={importing}
            style={{
              background: importing ? "#94A3B8" : "#0F2A3D",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: importing ? "not-allowed" : "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            {importing ? "Importando y reconstruyendo motor..." : `Importar ${rows.length} movimientos`}
          </button>
        </>
      )}

      {/* Resultado exitoso */}
      {importResult && (
        <div
          style={{
            padding: "1rem",
            borderRadius: "10px",
            background: "rgba(22,163,74,0.06)",
            border: "1px solid rgba(22,163,74,0.2)",
          }}
        >
          <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#16A34A", fontSize: "0.875rem" }}>
            ✅ Importación completada
          </p>
          <p style={{ margin: "0 0 2px", fontSize: "0.8125rem", color: "#475569" }}>
            {importResult.imported} movimiento{importResult.imported !== 1 ? "s" : ""} importado{importResult.imported !== 1 ? "s" : ""}
          </p>
          <p style={{ margin: "0 0 2px", fontSize: "0.8125rem", color: "#475569" }}>
            {importResult.rebuiltEvents} evento{importResult.rebuiltEvents !== 1 ? "s" : ""} tributario{importResult.rebuiltEvents !== 1 ? "s" : ""} reconstruido{importResult.rebuiltEvents !== 1 ? "s" : ""}
          </p>
          {importResult.taxEngineVersion && (
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}>
              Motor v{importResult.taxEngineVersion}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortafolioPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [fx, setFx] = useState<FxRate | null>(null);

  const [showBinance, setShowBinance] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrorCode, setFormErrorCode] = useState<InventoryErrorCode>(null);

  const [anularId, setAnularId] = useState<string | null>(null);
  const [anularReason, setAnularReason] = useState("");
  const [anularLoading, setAnularLoading] = useState(false);
  const [anularError, setAnularError] = useState<string | null>(null);

  async function fetchMovements() {
    try {
      setLoading(true);
      setPageError(null);
      const res = await fetch("/api/movements");
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setMovements(json.data);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMovements();
    fetch("/api/portfolio")
      .then(r => r.json())
      .then(j => { if (j.ok && j.data?.fx) setFx(j.data.fx); })
      .catch(() => {});
  }, []);

  function updateForm(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
    setFormErrorCode(null);
  }

  async function handleSubmit() {
    setFormError(null);
    setFormErrorCode(null);

    if (!form.symbol.trim()) { setFormError("El símbolo es requerido"); return; }
    if (!form.quantity || Number(form.quantity) <= 0) { setFormError("La cantidad debe ser mayor a 0"); return; }
    if (!form.priceUsd || Number(form.priceUsd) <= 0) { setFormError("El precio USD debe ser mayor a 0"); return; }
    if (!form.executedAt) { setFormError("La fecha de operación es requerida"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          symbol: form.symbol.trim().toUpperCase(),
          quantity: Number(form.quantity),
          priceUsd: Number(form.priceUsd),
          feeUsd: Number(form.feeUsd || 0),
          executedAt: new Date(form.executedAt).toISOString(),
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        const code = json.code as InventoryErrorCode;
        setFormErrorCode(code);

        if (code === "INSUFFICIENT_INVENTORY" && json.data) {
          const d = json.data;
          setFormError(
            `No puedes vender ${d.symbol ?? form.symbol.toUpperCase()} en esa fecha. ` +
              `Disponible: ${Number(d.availableQuantity).toFixed(8)} — ` +
              `Solicitado: ${Number(d.requestedQuantity).toFixed(8)}.`
          );
        } else if (code === "NEGATIVE_INVENTORY" && json.data) {
          const d = json.data;
          setFormError(
            `Inventario negativo en ${d.symbol ?? form.symbol.toUpperCase()}. ` +
              `Faltan ${Number(d.missingQuantity ?? 0).toFixed(8)} unidades.`
          );
        } else {
          setFormError(json.message ?? "Error al crear movimiento");
        }
        return;
      }

      setForm({ ...INITIAL_FORM, executedAt: nowLocalInput() });
      setShowForm(false);
      await fetchMovements();
    } catch (err) {
      setFormErrorCode(null);
      setFormError(err instanceof Error ? err.message : "Error al crear movimiento");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAnular() {
    if (!anularId || !anularReason.trim()) {
      setAnularError("El motivo de anulación es requerido");
      return;
    }
    setAnularLoading(true);
    setAnularError(null);
    try {
      const res = await fetch(`/api/movements/${anularId}/anular`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: anularReason.trim() }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setAnularId(null);
      setAnularReason("");
      await fetchMovements();
    } catch (err) {
      setAnularError(err instanceof Error ? err.message : "Error al anular movimiento");
    } finally {
      setAnularLoading(false);
    }
  }

  const active      = movements.filter((m) => !m.deletedAt);
  const buys        = active.filter((m) => m.type === "BUY");
  const sells       = active.filter((m) => m.type === "SELL");
  const deposits    = active.filter((m) => m.type === "DEPOSIT");
  const withdrawals = active.filter((m) => m.type === "WITHDRAW");

  // Total invertido = compras + depósitos (valor histórico en fecha de entrada)
  const totalInvested = [...buys, ...deposits].reduce(
    (acc, m) => acc + m.quantity * m.priceUsd + m.feeUsd, 0,
  );
  const totalProceeds = sells.reduce((acc, m) => acc + (m.quantity * m.priceUsd - m.feeUsd), 0);
  const uniqueAssets  = new Set(active.map((m) => m.symbol)).size;
  const totalInvestedClp = fx ? totalInvested * fx.usdToClp : null;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <style>{`@keyframes ledgera-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "1rem" }}>
          <div style={{ width: 28, height: 28, border: "2px solid rgba(15, 42, 61, 0.12)", borderTopColor: "#0F2A3D", borderRadius: "50%", animation: "ledgera-spin 0.75s linear infinite" }} />
          <p style={{ color: "#94A3B8", fontSize: "0.875rem", margin: 0 }}>Cargando portafolio...</p>
        </div>
      </>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (pageError) {
    return (
      <div style={{ padding: "2rem" }}>
        <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: "12px", padding: "1.25rem 1.5rem" }}>
          <p style={{ color: "#DC2626", fontWeight: 600, margin: "0 0 4px" }}>Error al cargar portafolio</p>
          <p style={{ color: "#64748B", margin: 0, fontSize: "0.875rem" }}>{pageError}</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: "1100px", fontFamily: "var(--font-body)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.375rem", fontWeight: 700, color: "#0F2A3D", margin: "0 0 4px" }}>
            Portafolio
          </h1>
          <p style={{ color: "#94A3B8", margin: 0, fontSize: "0.875rem" }}>
            Registro de movimientos cripto
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          {/* Botón Binance */}
          <button
            onClick={() => setShowBinance(true)}
            style={{
              background: "#1E2026",
              color: "#F3BA2F",
              border: "none",
              borderRadius: "10px",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <img src="/binance-symbol.svg" alt="" width="20" height="20" aria-hidden="true" />
            Binance
          </button>

          {/* Botón importar CSV */}
          <button
            onClick={() => {
              setShowImport(!showImport);
              setShowForm(false);
            }}
            style={{
              background: showImport ? "#F1F5F9" : "transparent",
              color: showImport ? "#64748B" : "#0F2A3D",
              border: "1px solid rgba(15,42,61,0.2)",
              borderRadius: "10px",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            {showImport ? "Cancelar" : "↑ Importar CSV"}
          </button>

          {/* Botón nuevo movimiento */}
          <button
            onClick={() => {
              setShowForm(!showForm);
              setShowImport(false);
              setFormError(null);
              setFormErrorCode(null);
              setForm({ ...INITIAL_FORM, executedAt: nowLocalInput() });
            }}
            style={{
              background: showForm ? "#F1F5F9" : "#0F2A3D",
              color: showForm ? "#64748B" : "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            {showForm ? "Cancelar" : "Movimiento manual"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: "10px", marginBottom: "1.5rem" }}>
        <StatCard label="Compras" value={String(buys.length)} />
        <StatCard label="Depósitos" value={String(deposits.length)} />
        <StatCard label="Ventas" value={String(sells.length)} />
        <StatCard label="Retiros" value={String(withdrawals.length)} />
        <StatCard label="Total invertido" value={formatUsd(totalInvested)} highlight />
        <StatCard label="Dólar hoy" value={fx ? formatClp(fx.usdToClp) : "—"} />
        <StatCard label="Total CLP" value={totalInvestedClp !== null ? formatClp(totalInvestedClp) : "—"} highlight />
      </div>

      {/* Sección importar CSV */}
      {showImport && (
        <CsvImportSection
          onSuccess={() => {
            setShowImport(false);
            fetchMovements();
          }}
        />
      )}

      {/* Formulario nuevo movimiento */}
      {showForm && (
        <div style={{ background: "#ffffff", border: "1px solid rgba(15, 42, 61, 0.1)", borderRadius: "14px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9375rem", color: "#0F2A3D", margin: "0 0 1.25rem" }}>
            Nuevo movimiento
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "1rem" }}>
            {/* Tipo */}
            <div>
              <label style={labelStyle}>Tipo</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {(["BUY", "SELL"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateForm("type", t)}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "8px",
                      border: "1px solid",
                      borderColor: form.type === t ? (t === "BUY" ? "#16A34A" : "#DC2626") : "rgba(15,42,61,0.15)",
                      background: form.type === t ? (t === "BUY" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)") : "transparent",
                      color: form.type === t ? (t === "BUY" ? "#16A34A" : "#DC2626") : "#64748B",
                      fontWeight: form.type === t ? 700 : 400,
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {t === "BUY" ? "Compra" : "Venta"}
                  </button>
                ))}
              </div>
            </div>

            {/* Símbolo */}
            <div>
              <label style={labelStyle}>Símbolo</label>
              <input type="text" placeholder="BTC, ETH..." value={form.symbol} onChange={(e) => updateForm("symbol", e.target.value.toUpperCase())} style={inputStyle} />
            </div>

            {/* Cantidad */}
            <div>
              <label style={labelStyle}>Cantidad</label>
              <input type="number" placeholder="0.00" min="0" step="any" value={form.quantity} onChange={(e) => updateForm("quantity", e.target.value)} style={inputStyle} />
            </div>

            {/* Precio USD */}
            <div>
              <label style={labelStyle}>Precio USD</label>
              <input type="number" placeholder="0.00" min="0" step="any" value={form.priceUsd} onChange={(e) => updateForm("priceUsd", e.target.value)} style={inputStyle} />
            </div>

            {/* Fee USD */}
            <div>
              <label style={labelStyle}>Fee USD (opcional)</label>
              <input type="number" placeholder="0.00" min="0" step="any" value={form.feeUsd} onChange={(e) => updateForm("feeUsd", e.target.value)} style={inputStyle} />
            </div>

            {/* Fecha */}
            <div>
              <label style={labelStyle}>Fecha operación</label>
              <input type="datetime-local" value={form.executedAt} onChange={(e) => updateForm("executedAt", e.target.value)} style={inputStyle} />
            </div>
          </div>

          {form.quantity && form.priceUsd && (
            <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: "0 0 1rem" }}>
              Total operación:{" "}
              <strong style={{ color: "#0F2A3D" }}>{formatUsd(Number(form.quantity) * Number(form.priceUsd))}</strong>
              {form.feeUsd && Number(form.feeUsd) > 0 ? ` + ${formatUsd(Number(form.feeUsd))} fee` : ""}
            </p>
          )}

          {formError && formErrorCode ? (
            <InventoryErrorBlock code={formErrorCode} message={formError} />
          ) : formError ? (
            <p style={{ fontSize: "0.8125rem", color: "#DC2626", margin: "0 0 1rem", background: "rgba(220,38,38,0.06)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid rgba(220,38,38,0.15)" }}>
              {formError}
            </p>
          ) : null}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              background: submitting ? "#94A3B8" : "#0F2A3D",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            {submitting ? (form.type === "SELL" ? "Ejecutando motor FIFO..." : "Guardando...") : `Registrar ${form.type === "BUY" ? "compra" : "venta"}`}
          </button>
        </div>
      )}

      {/* Tabla de movimientos */}
      {movements.length === 0 ? (
        <div style={{ background: "#F8FAFC", border: "1px dashed rgba(15, 42, 61, 0.13)", borderRadius: "12px", padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "#94A3B8", margin: "0 0 4px", fontWeight: 600 }}>Sin movimientos registrados</p>
          <p style={{ color: "#CBD5E1", margin: 0, fontSize: "0.875rem" }}>Agrega tu primer movimiento para que el motor tributario comience a trabajar.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr>
                {["Fecha", "Tipo", "Símbolo", "Cantidad", "Precio USD", "Fee USD", "Total USD", "Total CLP", "Estado", ""].map((col) => (
                  <th key={col} style={{ padding: "0.625rem 0.75rem", textAlign: "left", fontSize: "0.6875rem", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => {
                const isAnulado = Boolean(m.deletedAt);
                const isAnulando = anularId === m.id;
                const totalUsd = m.quantity * m.priceUsd;
                const totalClp = fx ? totalUsd * fx.usdToClp : null;

                const typeMeta: Record<string, { label: string; bg: string; color: string }> = {
                  BUY:      { label: "COMPRA",   bg: "rgba(22,163,74,0.1)",   color: "#16A34A" },
                  SELL:     { label: "VENTA",    bg: "rgba(220,38,38,0.1)",   color: "#DC2626" },
                  DEPOSIT:  { label: "DEPÓSITO", bg: "rgba(59,130,246,0.1)",  color: "#3B82F6" },
                  WITHDRAW: { label: "RETIRO",   bg: "rgba(245,158,11,0.1)",  color: "#D97706" },
                };
                const tm = typeMeta[m.type] ?? typeMeta.BUY;

                return (
                  <React.Fragment key={m.id}>
                    <tr style={{ opacity: isAnulado ? 0.45 : 1, borderBottom: isAnulando ? "none" : "1px solid #F1F5F9" }}>
                      <td style={cellStyle}>{formatDate(m.executedAt)}</td>
                      <td style={cellStyle}>
                        <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, background: tm.bg, color: tm.color }}>
                          {tm.label}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, fontWeight: 600, color: "#0F2A3D" }}>
                        <CoinLogo symbol={m.symbol} size={28} />
                      </td>
                      <td style={cellStyle}>{formatNumber(m.quantity, 8)}</td>
                      <td style={cellStyle}>{m.priceUsd > 0 ? formatUsd(m.priceUsd) : "—"}</td>
                      <td style={cellStyle}>{formatUsd(m.feeUsd)}</td>
                      <td style={{ ...cellStyle, fontWeight: 600, color: "#0F2A3D" }}>{totalUsd > 0 ? formatUsd(totalUsd) : "—"}</td>
                      <td style={{ ...cellStyle, color: "#475569" }}>{totalClp !== null && totalClp > 0 ? formatClp(totalClp) : "—"}</td>
                      <td style={cellStyle}>
                        {isAnulado ? (
                          <span style={{ color: "#94A3B8", fontSize: "0.75rem" }}>Anulado</span>
                        ) : (
                          <span style={{ color: "#16A34A", fontSize: "0.75rem", fontWeight: 600 }}>Activo</span>
                        )}
                      </td>
                      <td style={cellStyle}>
                        {!isAnulado && (
                          <button
                            onClick={() => { setAnularId(isAnulando ? null : m.id); setAnularReason(""); setAnularError(null); }}
                            style={{ background: "transparent", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "6px", color: "#DC2626", fontSize: "0.75rem", padding: "3px 10px", cursor: "pointer", fontFamily: "var(--font-body)" }}
                          >
                            {isAnulando ? "Cancelar" : "Anular"}
                          </button>
                        )}
                      </td>
                    </tr>

                    {isAnulando && (
                      <tr>
                        <td colSpan={10} style={{ padding: "0.75rem", background: "rgba(220,38,38,0.04)", borderBottom: "1px solid #F1F5F9" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            <input
                              type="text"
                              placeholder="Motivo de anulación..."
                              value={anularReason}
                              onChange={(e) => { setAnularReason(e.target.value); setAnularError(null); }}
                              style={{ ...inputStyle, flex: 1, minWidth: "200px", margin: 0 }}
                            />
                            <button
                              onClick={handleAnular}
                              disabled={anularLoading}
                              style={{ background: anularLoading ? "#94A3B8" : "#DC2626", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.8125rem", fontWeight: 600, cursor: anularLoading ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}
                            >
                              {anularLoading ? "Anulando..." : "Confirmar anulación"}
                            </button>
                            {anularError && <span style={{ color: "#DC2626", fontSize: "0.8125rem" }}>{anularError}</span>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showBinance && <BinanceSyncDrawer onClose={() => setShowBinance(false)} />}
    </div>
  );
}