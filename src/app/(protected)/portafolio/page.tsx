"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
  source: string;
}

interface FxRate { usdToClp: number; source: string }

interface Stats { buys: number; sells: number; deposits: number; withdrawals: number }

interface FormState {
  type: "BUY" | "SELL";
  symbol: string; quantity: string; priceUsd: string; feeUsd: string; executedAt: string;
}

interface CsvRow {
  type: string; symbol: string; quantity: string;
  priceUsd: string; feeUsd: string; executedAt: string;
}

interface ImportResult {
  imported: number; rebuiltEvents: number;
  taxEngineVersion?: string;
  warnings?: Array<{ movementId: string; symbol: string; message: string }>;
}

type InventoryErrorCode = "INSUFFICIENT_INVENTORY" | "NEGATIVE_INVENTORY" | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowLocalInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

const INITIAL_FORM: FormState = { type: "BUY", symbol: "", quantity: "", priceUsd: "", feeUsd: "", executedAt: nowLocalInput() };

function formatUsd(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}
function formatDate(v: string) {
  return new Date(v).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatNumber(v: number, d = 8) {
  return new Intl.NumberFormat("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: d }).format(v);
}
function formatClp(v: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(v);
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return {
      type:      (row["type"] ?? "").toUpperCase(),
      symbol:    (row["symbol"] ?? "").toUpperCase(),
      quantity:  row["quantity"] ?? "",
      priceUsd:  row["priceusd"] ?? row["price_usd"] ?? row["price"] ?? "",
      feeUsd:    row["feeusd"]   ?? row["fee_usd"]   ?? row["fee"]   ?? "0",
      executedAt: row["executedat"] ?? row["executed_at"] ?? row["date"] ?? "",
    };
  });
}

// ─── Visual constants ─────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; bg: string; color: string }> = {
  BUY:      { label: "COMPRA",   bg: "rgba(22,163,74,0.1)",   color: "#16A34A" },
  SELL:     { label: "VENTA",    bg: "rgba(220,38,38,0.1)",   color: "#DC2626" },
  DEPOSIT:  { label: "DEPÓSITO", bg: "rgba(59,130,246,0.1)",  color: "#2563EB" },
  WITHDRAW: { label: "RETIRO",   bg: "rgba(245,158,11,0.1)",  color: "#D97706" },
};

const SOURCE_META: Record<string, { label: string; bg: string; color: string }> = {
  BINANCE:     { label: "Binance",     bg: "rgba(240,185,11,0.12)", color: "#B45309" },
  BINANCE_TAX: { label: "Binance Tax", bg: "rgba(99,102,241,0.1)",  color: "#4F46E5" },
  MANUAL:      { label: "Manual",      bg: "#F1F5F9",               color: "#64748B" },
  BANK:        { label: "Banco",       bg: "rgba(15,42,61,0.08)",   color: "#0F2A3D" },
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748B",
  marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.5rem 0.75rem", borderRadius: "8px",
  border: "1px solid #E2E8F0", fontSize: "0.875rem",
  fontFamily: "var(--font-body)", color: "#0F2A3D", background: "#ffffff",
  boxSizing: "border-box", outline: "none",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, width: "auto", minWidth: "120px", cursor: "pointer",
  paddingRight: "2rem",
};

const cellStyle: React.CSSProperties = {
  padding: "0.75rem", color: "#475569", verticalAlign: "middle", whiteSpace: "nowrap",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

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
      alt={symbol} width={size} height={size}
      onError={() => setError(true)}
      style={{ borderRadius: "50%", flexShrink: 0 }}
    />
  );
}

function StatCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ background: "#F1F5F9", borderRadius: "10px", padding: "1rem" }}>
      <p style={{ fontSize: "0.6875rem", color: "#64748B", margin: "0 0 6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: highlight ? "#16A34A" : "#0F2A3D", margin: 0, lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}

function InventoryErrorBlock({ code, message }: { code: InventoryErrorCode; message: string }) {
  const isNegative = code === "NEGATIVE_INVENTORY";
  return (
    <div style={{ margin: "0 0 1rem", padding: "0.875rem 1rem", borderRadius: "10px", background: isNegative ? "rgba(220,38,38,0.06)" : "rgba(234,179,8,0.07)", border: `1px solid ${isNegative ? "rgba(220,38,38,0.2)" : "rgba(234,179,8,0.3)"}` }}>
      <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "0.8125rem", color: isNegative ? "#DC2626" : "#92400E" }}>
        {isNegative ? "🔴 Inventario negativo detectado" : "⚠️ Inventario insuficiente"}
      </p>
      <p style={{ margin: "0 0 6px", fontSize: "0.8125rem", color: "#475569", lineHeight: 1.5 }}>{message}</p>
      <p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}>
        {isNegative ? "Corrige la fila indicada en el CSV antes de importar." : "Ajusta la cantidad o revisa los movimientos anteriores."}
      </p>
    </div>
  );
}

// ─── CSV Import ───────────────────────────────────────────────────────────────

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
    setParseError(null); setImportError(null); setImportErrorCode(null); setImportResult(null); setRows([]);
    if (!file.name.endsWith(".csv")) { setParseError("Solo se aceptan archivos .csv"); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseCsv(e.target?.result as string);
        if (parsed.length === 0) { setParseError("El CSV no contiene filas válidas."); return; }
        setRows(parsed);
      } catch { setParseError("Error al leer el CSV. Revisa el formato."); }
    };
    reader.readAsText(file);
  }

  function clearFile() {
    setRows([]); setFileName(null); setParseError(null); setImportError(null);
    setImportErrorCode(null); setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true); setImportError(null); setImportErrorCode(null); setImportResult(null);
    try {
      const res = await fetch("/api/movements/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movements: rows.map(r => ({ type: r.type, symbol: r.symbol, quantity: Number(r.quantity), priceUsd: Number(r.priceUsd), feeUsd: Number(r.feeUsd || 0), executedAt: r.executedAt ? new Date(r.executedAt).toISOString() : new Date().toISOString() })) }),
      });
      const json = await res.json();
      if (!json.ok) { setImportErrorCode((json.code as InventoryErrorCode) ?? null); setImportError(json.message ?? "Error al importar movimientos."); return; }
      setImportResult(json.data);
      setRows([]); setFileName(null);
      onSuccess();
    } catch { setImportError("Error de conexión al importar."); }
    finally { setImporting(false); }
  }

  return (
    <div style={{ background: "#ffffff", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "1.5rem", marginBottom: "1.5rem" }}>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9375rem", color: "#0F2A3D", margin: "0 0 0.25rem" }}>Importar CSV</p>
      <p style={{ fontSize: "0.8125rem", color: "#94A3B8", margin: "0 0 1.25rem" }}>
        Columnas: <code style={{ background: "#F1F5F9", padding: "1px 6px", borderRadius: "4px", fontSize: "0.75rem" }}>type, symbol, quantity, priceUsd, feeUsd, executedAt</code>
      </p>

      {rows.length === 0 && !importResult && (
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => fileInputRef.current?.click()}
          style={{ border: `2px dashed ${dragging ? "#0F2A3D" : "#E2E8F0"}`, borderRadius: "12px", padding: "2.5rem", textAlign: "center", cursor: "pointer", background: dragging ? "rgba(15,42,61,0.03)" : "#FAFAFA", transition: "all 0.15s", marginBottom: "1rem" }}>
          <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#0F2A3D", fontSize: "0.9375rem" }}>{dragging ? "Suelta el archivo aquí" : "Arrastra tu CSV aquí"}</p>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#94A3B8" }}>o haz clic para seleccionar archivo</p>
          <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      )}

      {parseError && <p style={{ fontSize: "0.8125rem", color: "#DC2626", margin: "0 0 1rem", background: "rgba(220,38,38,0.06)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid rgba(220,38,38,0.15)" }}>{parseError}</p>}

      {rows.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#0F2A3D", fontWeight: 600 }}>📄 {fileName} — <span style={{ color: "#64748B", fontWeight: 400 }}>{rows.length} filas</span></p>
            <button onClick={clearFile} style={{ background: "transparent", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "3px 10px", fontSize: "0.75rem", color: "#64748B", cursor: "pointer", fontFamily: "var(--font-body)" }}>Limpiar</button>
          </div>
          <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid #E2E8F0", marginBottom: "1rem", maxHeight: "260px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead style={{ position: "sticky", top: 0, background: "#F8FAFC" }}>
                <tr>{["#","Tipo","Símbolo","Cantidad","Precio USD","Fee USD","Fecha"].map(col => (<th key={col} style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontSize: "0.6875rem", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>{col}</th>))}</tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const invalid = !["BUY","SELL"].includes(r.type) || !r.symbol || isNaN(Number(r.quantity)) || Number(r.quantity) <= 0 || isNaN(Number(r.priceUsd)) || Number(r.priceUsd) <= 0;
                  const tm = TYPE_META[r.type];
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #F1F5F9", background: invalid ? "rgba(220,38,38,0.04)" : "transparent" }}>
                      <td style={{ ...cellStyle, color: invalid ? "#DC2626" : "#94A3B8", fontWeight: 600 }}>{i+1}</td>
                      <td style={cellStyle}><span style={{ display: "inline-block", padding: "1px 8px", borderRadius: "5px", fontSize: "0.75rem", fontWeight: 700, background: tm?.bg ?? "#F1F5F9", color: tm?.color ?? "#64748B" }}>{r.type || "—"}</span></td>
                      <td style={{ ...cellStyle, fontWeight: 600, color: "#0F2A3D" }}>{r.symbol || "—"}</td>
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
          {importError && <InventoryErrorBlock code={importErrorCode} message={importError} />}
          <button onClick={handleImport} disabled={importing} style={{ background: importing ? "#94A3B8" : "#0F2A3D", color: "#fff", border: "none", borderRadius: "10px", padding: "0.625rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: importing ? "not-allowed" : "pointer", fontFamily: "var(--font-body)" }}>
            {importing ? "Importando..." : `Importar ${rows.length} movimientos`}
          </button>
        </>
      )}

      {importResult && (
        <div style={{ padding: "1rem", borderRadius: "10px", background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)" }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#16A34A", fontSize: "0.875rem" }}>✅ Importación completada</p>
          <p style={{ margin: "0 0 2px", fontSize: "0.8125rem", color: "#475569" }}>{importResult.imported} movimiento{importResult.imported !== 1 ? "s" : ""} importado{importResult.imported !== 1 ? "s" : ""}</p>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#475569" }}>{importResult.rebuiltEvents} evento{importResult.rebuiltEvents !== 1 ? "s" : ""} tributario{importResult.rebuiltEvents !== 1 ? "s" : ""} reconstruido{importResult.rebuiltEvents !== 1 ? "s" : ""}</p>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LIMIT = 200;

export default function PortafolioPage() {
  const [movements,  setMovements]  = useState<Movement[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats,      setStats]      = useState<Stats>({ buys: 0, sells: 0, deposits: 0, withdrawals: 0 });
  const [loading,    setLoading]    = useState(true);
  const [pageError,  setPageError]  = useState<string | null>(null);
  const [fx,         setFx]         = useState<FxRate | null>(null);

  // Filter state
  const [filterType,   setFilterType]   = useState("");
  const [filterSymbol, setFilterSymbol] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterSort,   setFilterSort]   = useState("executedAt:desc");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);

  // UI state
  const [showBinance, setShowBinance] = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [showImport,  setShowImport]  = useState(false);
  const [form, setForm]               = useState<FormState>(INITIAL_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState<string | null>(null);
  const [formErrorCode, setFormErrorCode] = useState<InventoryErrorCode>(null);
  const [anularId,    setAnularId]    = useState<string | null>(null);
  const [anularReason, setAnularReason] = useState("");
  const [anularLoading, setAnularLoading] = useState(false);
  const [anularError, setAnularError] = useState<string | null>(null);

  // Build URL for fetch
  const buildUrl = useCallback((overrides: { page?: number } = {}) => {
    const [sort, order] = filterSort.split(":");
    const url = new URL("/api/movements", window.location.origin);
    if (filterType)   url.searchParams.set("type",   filterType);
    if (filterSymbol) url.searchParams.set("symbol", filterSymbol);
    if (filterSource) url.searchParams.set("source", filterSource);
    if (sort)         url.searchParams.set("sort",   sort);
    if (order)        url.searchParams.set("order",  order);
    if (searchQuery)  url.searchParams.set("search", searchQuery);
    url.searchParams.set("page",  String(overrides.page ?? page));
    url.searchParams.set("limit", String(LIMIT));
    return url.toString();
  }, [filterType, filterSymbol, filterSource, filterSort, searchQuery, page]);

  const fetchMovements = useCallback(async (resetPage = false) => {
    try {
      setLoading(true);
      setPageError(null);
      const targetPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);

      const [sort, order] = filterSort.split(":");
      const url = new URL("/api/movements", window.location.origin);
      if (filterType)   url.searchParams.set("type",   filterType);
      if (filterSymbol) url.searchParams.set("symbol", filterSymbol);
      if (filterSource) url.searchParams.set("source", filterSource);
      if (sort)         url.searchParams.set("sort",   sort);
      if (order)        url.searchParams.set("order",  order);
      if (searchQuery)  url.searchParams.set("search", searchQuery);
      url.searchParams.set("page",  String(targetPage));
      url.searchParams.set("limit", String(LIMIT));

      const res  = await fetch(url.toString());
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);

      setMovements(json.data.movements);
      setTotal(json.data.total);
      setTotalPages(json.data.totalPages);
      setStats(json.data.stats);

      // Build symbol list from unfiltered data (first load only)
      if (!filterType && !filterSymbol && !filterSource && !searchQuery) {
        const syms = [...new Set<string>((json.data.movements as Movement[]).map(m => m.symbol))].sort();
        setAvailableSymbols(syms);
      }
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  }, [filterType, filterSymbol, filterSource, filterSort, searchQuery, page]);

  useEffect(() => { void fetchMovements(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch("/api/portfolio")
      .then(r => r.json())
      .then(j => { if (j.ok && j.data?.fx) setFx(j.data.fx); })
      .catch(() => {});
  }, []);

  // Filter change → reset to page 1
  useEffect(() => {
    void fetchMovements(true);
  }, [filterType, filterSymbol, filterSource, filterSort]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search debounce
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleSearchChange(v: string) {
    setSearchQuery(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => void fetchMovements(true), 350);
  }

  function updateForm(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormError(null); setFormErrorCode(null);
  }

  async function handleSubmit() {
    setFormError(null); setFormErrorCode(null);
    if (!form.symbol.trim())                           { setFormError("El símbolo es requerido"); return; }
    if (!form.quantity || Number(form.quantity) <= 0)  { setFormError("La cantidad debe ser mayor a 0"); return; }
    if (!form.priceUsd || Number(form.priceUsd) <= 0)  { setFormError("El precio USD debe ser mayor a 0"); return; }
    if (!form.executedAt)                              { setFormError("La fecha es requerida"); return; }
    setSubmitting(true);
    try {
      const res  = await fetch("/api/movements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: form.type, symbol: form.symbol.trim().toUpperCase(), quantity: Number(form.quantity), priceUsd: Number(form.priceUsd), feeUsd: Number(form.feeUsd || 0), executedAt: new Date(form.executedAt).toISOString() }) });
      const json = await res.json();
      if (!json.ok) {
        const code = json.code as InventoryErrorCode;
        setFormErrorCode(code);
        if (code === "INSUFFICIENT_INVENTORY" && json.data) {
          const d = json.data;
          setFormError(`No puedes vender ${d.symbol ?? form.symbol.toUpperCase()} en esa fecha. Disponible: ${Number(d.availableQuantity).toFixed(8)} — Solicitado: ${Number(d.requestedQuantity).toFixed(8)}.`);
        } else if (code === "NEGATIVE_INVENTORY" && json.data) {
          const d = json.data;
          setFormError(`Inventario negativo en ${d.symbol ?? form.symbol.toUpperCase()}. Faltan ${Number(d.missingQuantity ?? 0).toFixed(8)} unidades.`);
        } else {
          setFormError(json.message ?? "Error al crear movimiento");
        }
        return;
      }
      setForm({ ...INITIAL_FORM, executedAt: nowLocalInput() });
      setShowForm(false);
      await fetchMovements(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al crear movimiento");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAnular() {
    if (!anularId || !anularReason.trim()) { setAnularError("El motivo de anulación es requerido"); return; }
    setAnularLoading(true); setAnularError(null);
    try {
      const res  = await fetch(`/api/movements/${anularId}/anular`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: anularReason.trim() }) });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setAnularId(null); setAnularReason("");
      await fetchMovements(true);
    } catch (err) {
      setAnularError(err instanceof Error ? err.message : "Error al anular movimiento");
    } finally {
      setAnularLoading(false);
    }
  }

  const totalInvested = movements
    .filter(m => !m.deletedAt && (m.type === "BUY" || m.type === "DEPOSIT"))
    .reduce((acc, m) => acc + m.quantity * m.priceUsd + m.feeUsd, 0);
  const totalInvestedClp = fx ? totalInvested * fx.usdToClp : null;

  const hasFilters = !!(filterType || filterSymbol || filterSource || searchQuery);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading && movements.length === 0) {
    return (
      <>
        <style>{`@keyframes ledgera-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "1rem" }}>
          <div style={{ width: 28, height: 28, border: "2px solid #E2E8F0", borderTopColor: "#0F2A3D", borderRadius: "50%", animation: "ledgera-spin 0.75s linear infinite" }} />
          <p style={{ color: "#94A3B8", fontSize: "0.875rem", margin: 0 }}>Cargando portafolio...</p>
        </div>
      </>
    );
  }

  if (pageError) {
    return (
      <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: "12px", padding: "1.25rem 1.5rem" }}>
        <p style={{ color: "#DC2626", fontWeight: 600, margin: "0 0 4px" }}>Error al cargar portafolio</p>
        <p style={{ color: "#64748B", margin: 0, fontSize: "0.875rem" }}>{pageError}</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: "1200px", fontFamily: "var(--font-body)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.375rem", fontWeight: 700, color: "#0F2A3D", margin: "0 0 4px" }}>Portafolio</h1>
          <p style={{ color: "#94A3B8", margin: 0, fontSize: "0.875rem" }}>Registro de movimientos cripto</p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button onClick={() => setShowBinance(true)} style={{ background: "#1E2026", color: "#F3BA2F", border: "none", borderRadius: "10px", padding: "0.625rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: "8px" }}>
            <img src="/binance-symbol.svg" alt="" width="20" height="20" aria-hidden="true" />
            Binance
          </button>
          <button onClick={() => { setShowImport(!showImport); setShowForm(false); }} style={{ background: showImport ? "#F1F5F9" : "transparent", color: showImport ? "#64748B" : "#0F2A3D", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "0.625rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>
            {showImport ? "Cancelar" : "↑ Importar CSV"}
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowImport(false); setFormError(null); setFormErrorCode(null); setForm({ ...INITIAL_FORM, executedAt: nowLocalInput() }); }} style={{ background: showForm ? "#F1F5F9" : "#0F2A3D", color: showForm ? "#64748B" : "#fff", border: "none", borderRadius: "10px", padding: "0.625rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>
            {showForm ? "Cancelar" : "Movimiento manual"}
          </button>
        </div>
      </div>

      {/* Stats — always show total portfolio counts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "1.5rem" }}>
        <StatCard label="Compras"        value={String(stats.buys)} />
        <StatCard label="Depósitos"      value={String(stats.deposits)} />
        <StatCard label="Ventas"         value={String(stats.sells)} />
        <StatCard label="Retiros"        value={String(stats.withdrawals)} />
        <StatCard label="Total invertido" value={formatUsd(totalInvested)} highlight />
        <StatCard label="Dólar hoy"      value={fx ? formatClp(fx.usdToClp) : "—"} />
        <StatCard label="Total CLP"      value={totalInvestedClp !== null ? formatClp(totalInvestedClp) : "—"} highlight />
      </div>

      {/* CSV Import */}
      {showImport && <CsvImportSection onSuccess={() => { setShowImport(false); void fetchMovements(true); }} />}

      {/* Manual form */}
      {showForm && (
        <div style={{ background: "#ffffff", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9375rem", color: "#0F2A3D", margin: "0 0 1.25rem" }}>Nuevo movimiento</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "1rem" }}>
            <div>
              <label style={labelStyle}>Tipo</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {(["BUY","SELL"] as const).map(t => (
                  <button key={t} onClick={() => updateForm("type", t)} style={{ flex: 1, padding: "0.5rem", borderRadius: "8px", border: "1px solid", borderColor: form.type === t ? (t === "BUY" ? "#16A34A" : "#DC2626") : "#E2E8F0", background: form.type === t ? (t === "BUY" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)") : "transparent", color: form.type === t ? (t === "BUY" ? "#16A34A" : "#DC2626") : "#64748B", fontWeight: form.type === t ? 700 : 400, fontSize: "0.875rem", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                    {t === "BUY" ? "Compra" : "Venta"}
                  </button>
                ))}
              </div>
            </div>
            <div><label style={labelStyle}>Símbolo</label><input type="text" placeholder="BTC, ETH..." value={form.symbol} onChange={e => updateForm("symbol", e.target.value.toUpperCase())} style={inputStyle} /></div>
            <div><label style={labelStyle}>Cantidad</label><input type="number" placeholder="0.00" min="0" step="any" value={form.quantity} onChange={e => updateForm("quantity", e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Precio USD</label><input type="number" placeholder="0.00" min="0" step="any" value={form.priceUsd} onChange={e => updateForm("priceUsd", e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Fee USD</label><input type="number" placeholder="0.00" min="0" step="any" value={form.feeUsd} onChange={e => updateForm("feeUsd", e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Fecha</label><input type="datetime-local" value={form.executedAt} onChange={e => updateForm("executedAt", e.target.value)} style={inputStyle} /></div>
          </div>
          {form.quantity && form.priceUsd && (
            <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: "0 0 1rem" }}>
              Total: <strong style={{ color: "#0F2A3D" }}>{formatUsd(Number(form.quantity) * Number(form.priceUsd))}</strong>
              {form.feeUsd && Number(form.feeUsd) > 0 ? ` + ${formatUsd(Number(form.feeUsd))} fee` : ""}
            </p>
          )}
          {formError && formErrorCode ? <InventoryErrorBlock code={formErrorCode} message={formError} /> : formError ? <p style={{ fontSize: "0.8125rem", color: "#DC2626", margin: "0 0 1rem", background: "rgba(220,38,38,0.06)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid rgba(220,38,38,0.15)" }}>{formError}</p> : null}
          <button onClick={handleSubmit} disabled={submitting} style={{ background: submitting ? "#94A3B8" : "#0F2A3D", color: "#fff", border: "none", borderRadius: "10px", padding: "0.625rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "var(--font-body)" }}>
            {submitting ? (form.type === "SELL" ? "Ejecutando motor FIFO..." : "Guardando...") : `Registrar ${form.type === "BUY" ? "compra" : "venta"}`}
          </button>
        </div>
      )}

      {/* ── Filter bar ─────────────────────────────────────────────────────────── */}
      <div style={{ background: "#ffffff", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "0.875rem 1rem", marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Buscar activo…"
          value={searchQuery}
          onChange={e => handleSearchChange(e.target.value)}
          style={{ ...inputStyle, width: "160px", padding: "0.4375rem 0.75rem" }}
        />

        {/* Type */}
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selectStyle}>
          <option value="">Tipo</option>
          <option value="BUY">Compra</option>
          <option value="SELL">Venta</option>
          <option value="DEPOSIT">Depósito</option>
          <option value="WITHDRAW">Retiro</option>
        </select>

        {/* Asset */}
        <select value={filterSymbol} onChange={e => setFilterSymbol(e.target.value)} style={selectStyle}>
          <option value="">Activo</option>
          {availableSymbols.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Origin */}
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={selectStyle}>
          <option value="">Origen</option>
          <option value="BINANCE">Binance</option>
          <option value="BINANCE_TAX">Binance Tax</option>
          <option value="MANUAL">Manual</option>
          <option value="BANK">Banco</option>
        </select>

        {/* Sort */}
        <select value={filterSort} onChange={e => setFilterSort(e.target.value)} style={selectStyle}>
          <option value="executedAt:desc">Más reciente</option>
          <option value="executedAt:asc">Más antiguo</option>
          <option value="priceUsd:desc">Mayor USD</option>
          <option value="priceUsd:asc">Menor USD</option>
          <option value="quantity:desc">Mayor cantidad</option>
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={() => { setFilterType(""); setFilterSymbol(""); setFilterSource(""); setSearchQuery(""); setFilterSort("executedAt:desc"); }}
            style={{ background: "transparent", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "0.4375rem 0.875rem", fontSize: "0.8125rem", color: "#64748B", cursor: "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}
          >
            Limpiar filtros ×
          </button>
        )}

        {/* Count */}
        <span style={{ marginLeft: "auto", fontSize: "0.8125rem", color: "#94A3B8", whiteSpace: "nowrap" }}>
          {loading ? "…" : `${total} resultado${total !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      {movements.length === 0 && !loading ? (
        <div style={{ background: "#F8FAFC", border: "1px dashed #E2E8F0", borderRadius: "12px", padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "#94A3B8", margin: "0 0 4px", fontWeight: 600 }}>
            {hasFilters ? "Sin resultados para los filtros aplicados" : "Sin movimientos registrados"}
          </p>
          <p style={{ color: "#CBD5E1", margin: 0, fontSize: "0.875rem" }}>
            {hasFilters ? "Intenta con otros filtros." : "Agrega tu primer movimiento para que el motor tributario comience a trabajar."}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto", background: "#ffffff", border: "1px solid #E2E8F0", borderRadius: "12px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Fecha","Tipo","Activo","Cantidad","Total USD","Total CLP","Origen","Estado",""].map(col => (
                  <th key={col} style={{ padding: "0.625rem 0.875rem", textAlign: "left", fontSize: "0.6875rem", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.map(m => {
                const isAnulado  = Boolean(m.deletedAt);
                const isAnulando = anularId === m.id;
                const totalUsd   = m.quantity * m.priceUsd;
                const totalClp   = fx ? totalUsd * fx.usdToClp : null;
                const tm         = TYPE_META[m.type]   ?? TYPE_META["BUY"];
                const sm         = SOURCE_META[m.source] ?? SOURCE_META["MANUAL"];

                return (
                  <React.Fragment key={m.id}>
                    <tr style={{ opacity: isAnulado ? 0.45 : 1, borderBottom: isAnulando ? "none" : "1px solid #F1F5F9" }}>
                      <td style={{ ...cellStyle, fontSize: "0.8125rem" }}>{formatDate(m.executedAt)}</td>
                      <td style={cellStyle}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, background: tm.bg, color: tm.color }}>
                          {tm.label}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, fontWeight: 700, color: "#0F2A3D", fontFamily: "var(--font-display)" }}>
                        {m.symbol}
                      </td>
                      <td style={{ ...cellStyle, fontSize: "0.75rem", color: "#64748B" }}>{formatNumber(m.quantity, 8)}</td>
                      <td style={{ ...cellStyle, fontWeight: 600, color: "#0F2A3D" }}>{totalUsd > 0 ? formatUsd(totalUsd) : "—"}</td>
                      <td style={{ ...cellStyle, color: "#475569" }}>{totalClp !== null && totalClp > 0 ? formatClp(totalClp) : "—"}</td>
                      <td style={cellStyle}>
                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "5px", fontSize: "0.6875rem", fontWeight: 600, background: sm.bg, color: sm.color, whiteSpace: "nowrap" }}>
                          {sm.label}
                        </span>
                      </td>
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
                            style={{ background: "transparent", border: "1px solid rgba(220,38,38,0.25)", borderRadius: "6px", color: "#DC2626", fontSize: "0.75rem", padding: "3px 10px", cursor: "pointer", fontFamily: "var(--font-body)" }}
                          >
                            {isAnulando ? "Cancelar" : "Anular"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isAnulando && (
                      <tr>
                        <td colSpan={9} style={{ padding: "0.75rem", background: "rgba(220,38,38,0.04)", borderBottom: "1px solid #F1F5F9" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            <input type="text" placeholder="Motivo de anulación..." value={anularReason} onChange={e => { setAnularReason(e.target.value); setAnularError(null); }} style={{ ...inputStyle, flex: 1, minWidth: "200px", margin: 0 }} />
                            <button onClick={handleAnular} disabled={anularLoading} style={{ background: anularLoading ? "#94A3B8" : "#DC2626", color: "#fff", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.8125rem", fontWeight: 600, cursor: anularLoading ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>
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

      {/* ── Pagination ─────────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "1.25rem" }}>
          <button
            onClick={() => { setPage(p => Math.max(1, p - 1)); void buildUrl({ page: Math.max(1, page - 1) }); }}
            disabled={page <= 1}
            style={{ background: page <= 1 ? "#F1F5F9" : "#0F2A3D", color: page <= 1 ? "#CBD5E1" : "#fff", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 600, cursor: page <= 1 ? "default" : "pointer", fontFamily: "var(--font-body)" }}
          >‹ Anterior</button>
          <span style={{ fontSize: "0.875rem", color: "#64748B" }}>Página {page} de {totalPages} — {total} movimientos</span>
          <button
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); void buildUrl({ page: Math.min(totalPages, page + 1) }); }}
            disabled={page >= totalPages}
            style={{ background: page >= totalPages ? "#F1F5F9" : "#0F2A3D", color: page >= totalPages ? "#CBD5E1" : "#fff", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 600, cursor: page >= totalPages ? "default" : "pointer", fontFamily: "var(--font-body)" }}
          >Siguiente ›</button>
        </div>
      )}

      {/* Drawer Binance */}
      {showBinance && (
        <BinanceSyncDrawer
          onClose={() => setShowBinance(false)}
          onSyncComplete={() => void fetchMovements(true)}
        />
      )}
    </div>
  );
}
