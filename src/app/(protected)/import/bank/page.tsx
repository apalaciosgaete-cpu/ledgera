"use client";

import { useState } from "react";
import { getSessionToken } from "@/modules/identity/client/authStorage";

type ImportResult = {
  uploadId:     string;
  duplicate:    boolean;
  totalRows:    number;
  importedRows: number;
  errorRows:    number;
};

type ApiResponse<T> = {
  ok:      boolean;
  message: string;
  data:    T;
};

// ── Preview row shape returned by the API ─────────────────────────────────────
type PreviewRow = {
  occurredAt:  string;
  description: string;
  amountClp:   number;
  direction:   "INFLOW" | "OUTFLOW";
};

type ImportData = ImportResult & { preview: PreviewRow[] };

// ── Bancos ────────────────────────────────────────────────────────────────────
const BANKS = [
  "Banco de Chile",
  "Santander",
  "BCI",
  "Scotiabank",
  "Falabella",
  "MercadoPago",
  "Tenpo",
  "Otro",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function readCsrfCookie(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.split("; ").find(c => c.startsWith("ledgera_csrf="));
  return m ? decodeURIComponent(m.split("=")[1] ?? "") : "";
}

function fmtClp(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    style:                 "currency",
    currency:              "CLP",
    minimumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });
}

function fileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf")             return "📕";
  if (ext === "xlsx" || ext === "xls") return "📗";
  return "📄";
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BankImportPage() {
  const [bankName, setBankName] = useState("Santander");
  const [file,     setFile]     = useState<File | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<ImportData | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setError(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0] ?? null;
    setFile(f);
    setResult(null);
    setError(null);
  }

  async function handleImport() {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append("file",     file);
      form.append("bankName", bankName);

      const token = getSessionToken();
      const res   = await fetch("/api/bank/import", {
        method:      "POST",
        credentials: "include",
        headers: {
          "Authorization":  token ? `Bearer ${token}` : "",
          "x-ledgera-csrf": readCsrfCookie(),
        },
        body: form,
      });

      const text = await res.text();

      let json: ApiResponse<ImportData> | null = null;

      try {
        json = JSON.parse(text) as ApiResponse<ImportData>;
      } catch {
        setError(`Error HTTP ${res.status}: ${text.slice(0, 300)}`);
        return;
      }

      if (!res.ok || !json.ok) {
        setError(json.message ?? `Error HTTP ${res.status}`);
        return;
      }

      setResult(json.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error desconocido al importar.");
    } finally {
      setLoading(false);
    }
  }

  const canImport = !!file && !loading;

  return (
    <div style={{
      minHeight:  "100vh",
      background: "#E8EEF5",
      padding:    "40px 24px",
      fontFamily: "var(--font-body, system-ui, sans-serif)",
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "860px", margin: "0 auto 24px" }}>
        <h1 style={{
          fontSize:   "22px",
          fontWeight: 700,
          color:      "#0F2A3D",
          margin:     "0 0 6px",
          fontFamily: "var(--font-display, system-ui, sans-serif)",
        }}>
          Importación bancaria
        </h1>
        <p style={{ fontSize: "14px", color: "#64748B", margin: 0 }}>
          Conecta tus movimientos fiat con tu actividad crypto.
        </p>
      </div>

      {/* ── Card principal ──────────────────────────────────────────────────── */}
      <div style={{
        maxWidth:     "680px",
        margin:       "0 auto",
        background:   "#FFFFFF",
        border:       "1px solid #E2E8F0",
        borderRadius: "14px",
        padding:      "28px 32px",
      }}>

        {/* Selector banco */}
        <div style={{ marginBottom: "22px" }}>
          <Label>Banco</Label>
          <select
            value={bankName}
            onChange={e => setBankName(e.target.value)}
            style={selectStyle}
          >
            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Drop zone */}
        <label
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          style={{
            display:      "block",
            border:       `2px dashed ${file ? "#16A34A" : "#CBD5E1"}`,
            borderRadius: "12px",
            padding:      "36px 24px",
            textAlign:    "center",
            cursor:       "pointer",
            background:   file ? "rgba(22,163,74,0.03)" : "#F8FAFC",
            marginBottom: "22px",
            transition:   "border-color 0.15s",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "10px", lineHeight: 1 }}>
            {file ? fileIcon(file.name) : "📂"}
          </div>

          {file ? (
            <div>
              <p style={{ fontWeight: 600, fontSize: "14px", color: "#16A34A", margin: "0 0 4px" }}>
                {file.name}
              </p>
              <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>
                {(file.size / 1024).toFixed(1)} KB · {file.name.split(".").pop()?.toUpperCase()}
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontWeight: 600, fontSize: "14px", color: "#334155", margin: "0 0 4px" }}>
                Arrastra tu cartola o selecciónala
              </p>
              <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>
                PDF · XLSX · CSV
              </p>
            </div>
          )}

          <input
            type="file"
            accept=".pdf,.xlsx,.xls,.csv,.txt"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </label>

        {/* Error */}
        {error && (
          <div style={{
            background:   "rgba(239,68,68,0.06)",
            border:       "1px solid rgba(220,38,38,0.2)",
            borderRadius: "8px",
            padding:      "12px 16px",
            marginBottom: "18px",
            fontSize:     "13px",
            color:        "#EF4444",
          }}>
            {error}
          </div>
        )}

        {/* Botón */}
        <button
          onClick={handleImport}
          disabled={!canImport}
          style={{
            width:         "100%",
            height:        "44px",
            background:    canImport ? "#16A34A" : "#E2E8F0",
            color:         canImport ? "#FFFFFF"  : "#94A3B8",
            border:        "none",
            borderRadius:  "10px",
            fontSize:      "14px",
            fontWeight:    600,
            cursor:        canImport ? "pointer" : "not-allowed",
            transition:    "background 0.15s",
            letterSpacing: "0.01em",
          }}
        >
          {loading ? "Importando…" : "Importar cartola"}
        </button>
      </div>

      {/* ── Resultado ───────────────────────────────────────────────────────── */}
      {result && (
        <div style={{
          maxWidth:     "860px",
          margin:       "20px auto 0",
          background:   "#FFFFFF",
          border:       "1px solid #E2E8F0",
          borderRadius: "14px",
          padding:      "24px 32px",
        }}>

          {/* Duplicate banner */}
          {result.duplicate && (
            <div style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "10px",
              background:   "rgba(99,102,241,0.07)",
              border:       "1px solid rgba(99,102,241,0.2)",
              borderRadius: "8px",
              padding:      "12px 16px",
              marginBottom: "20px",
              fontSize:     "13px",
              color:        "#4F46E5",
              fontWeight:   500,
            }}>
              <span style={{ fontSize: "16px" }}>ℹ️</span>
              Este archivo ya fue importado anteriormente. No se duplicaron movimientos.
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
            <StatChip
              value={result.importedRows}
              label="movimientos importados"
              color="#16A34A"
              bg="rgba(22,163,74,0.08)"
              border="rgba(22,163,74,0.2)"
            />
            {result.errorRows > 0 && (
              <StatChip
                value={result.errorRows}
                label="filas con errores"
                color="#EF4444"
                bg="rgba(239,68,68,0.06)"
                border="rgba(239,68,68,0.18)"
              />
            )}
            {result.errorRows === 0 && result.importedRows > 0 && (
              <StatChip
                value={0}
                label="errores"
                color="#94A3B8"
                bg="#F1F5F9"
                border="#E2E8F0"
              />
            )}
          </div>

          {/* Preview table */}
          {result.preview && result.preview.length > 0 && (
            <>
              <p style={{
                fontSize:      "11px",
                fontWeight:    700,
                color:         "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom:  "10px",
                marginTop:     0,
              }}>
                Últimos movimientos detectados
              </p>

              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width:           "100%",
                  borderCollapse:  "collapse",
                  fontSize:        "13px",
                  tableLayout:     "fixed",
                  lineHeight:      1.45,
                }}>
                  <colgroup>
                    <col style={{ width: "140px" }} />
                    <col />
                    <col style={{ width: "160px" }} />
                    <col style={{ width: "140px" }} />
                  </colgroup>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E2E8F0" }}>
                      {["Fecha", "Descripción", "Monto", "Dirección"].map(h => (
                        <th key={h} style={{
                          padding:       "14px 18px",
                          textAlign:     "left",
                          fontSize:      "11px",
                          fontWeight:    700,
                          color:         "#64748B",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          whiteSpace:    "nowrap",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #F1F5F9", height: "56px" }}>
                        <td style={{ padding: "14px 18px", color: "#475569", whiteSpace: "nowrap" }}>
                          {fmtDate(row.occurredAt)}
                        </td>
                        <td style={{
                          padding:      "14px 18px",
                          color:        "#0F2A3D",
                          overflow:     "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace:   "nowrap",
                        }}>
                          {row.description}
                        </td>
                        <td style={{
                          padding:    "14px 18px",
                          fontWeight: 600,
                          color:      row.direction === "INFLOW" ? "#16A34A" : "#EF4444",
                          whiteSpace: "nowrap",
                        }}>
                          {row.direction === "INFLOW" ? "+" : "−"}{fmtClp(row.amountClp)}
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{
                            fontSize:     "11px",
                            fontWeight:   700,
                            padding:      "3px 10px",
                            borderRadius: "6px",
                            background:   row.direction === "INFLOW"
                              ? "rgba(22,163,74,0.1)"
                              : "rgba(239,68,68,0.08)",
                            color: row.direction === "INFLOW" ? "#16A34A" : "#EF4444",
                          }}>
                            {row.direction === "INFLOW" ? "ABONO" : "CARGO"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {result.totalRows > result.preview.length && (
                <p style={{
                  fontSize:   "12px",
                  color:      "#94A3B8",
                  textAlign:  "center",
                  marginTop:  "12px",
                  marginBottom: 0,
                }}>
                  Mostrando {result.preview.length} de {result.totalRows} movimientos
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display:       "block",
      fontSize:      "12px",
      fontWeight:    600,
      color:         "#334155",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      marginBottom:  "8px",
    }}>
      {children}
    </label>
  );
}

function StatChip({ value, label, color, bg, border }: {
  value:  number;
  label:  string;
  color:  string;
  bg:     string;
  border: string;
}) {
  return (
    <div style={{
      background:   bg,
      border:       `1px solid ${border}`,
      borderRadius: "10px",
      padding:      "12px 20px",
      minWidth:     "120px",
    }}>
      <div style={{ fontSize: "26px", fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "3px" }}>{label}</div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width:        "100%",
  height:       "42px",
  border:       "1px solid #E2E8F0",
  borderRadius: "8px",
  padding:      "0 14px",
  fontSize:     "14px",
  fontWeight:   500,
  color:        "#0F2A3D",
  background:   "#F8FAFC",
  cursor:       "pointer",
  outline:      "none",
};
