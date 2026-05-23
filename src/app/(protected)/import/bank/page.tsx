"use client";

import { useCallback, useRef, useState } from "react";
import { getSessionToken } from "@/modules/identity/client/authStorage";

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

function fmtDate(raw: string | Date): string {
  return new Date(raw).toLocaleDateString("es-CL", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface PreviewRow {
  occurredAt:  string;
  description: string;
  amountClp:   number;
  direction:   "INFLOW" | "OUTFLOW";
  balanceClp:  number | null;
}

interface ImportResult {
  uploadId:     string;
  totalRows:    number;
  importedRows: number;
  skippedRows:  number;
  needsReview:  boolean;
  preview:      PreviewRow[];
}

// ── Bancos disponibles ────────────────────────────────────────────────────────
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

// ── Componente ────────────────────────────────────────────────────────────────
export default function BankImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [bankName, setBankName] = useState("Santander");
  const [file,     setFile]     = useState<File | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<ImportResult | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  // ── File handlers ─────────────────────────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0] ?? null;
    setFile(f);
    setResult(null);
    setError(null);
  }, []);

  // ── Import ────────────────────────────────────────────────────────────────
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
          "Authorization": token ? `Bearer ${token}` : "",
          "x-csrf-token":  readCsrfCookie(),
        },
        body: form,
      });

      const json = await res.json() as { ok: boolean; message: string; data: ImportResult };

      if (!json.ok) {
        setError(json.message ?? "Error al importar.");
        return;
      }

      setResult(json.data);
    } catch {
      setError("Error de red. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  }

  const canImport = !!file && !loading;
  const ext       = file?.name.split(".").pop()?.toUpperCase() ?? "";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:  "100vh",
      background: "#E8EEF5",
      padding:    "40px 24px",
      fontFamily: "var(--font-body, system-ui, sans-serif)",
    }}>

      {/* Header */}
      <div style={{ maxWidth: "680px", margin: "0 auto 24px" }}>
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

      {/* Card principal */}
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
          <label style={{
            display:       "block",
            fontSize:      "12px",
            fontWeight:    600,
            color:         "#334155",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom:  "8px",
          }}>
            Banco
          </label>
          <select
            value={bankName}
            onChange={e => setBankName(e.target.value)}
            style={{
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
            }}
          >
            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border:        `2px dashed ${file ? "#16A34A" : "#CBD5E1"}`,
            borderRadius:  "12px",
            padding:       "36px 24px",
            textAlign:     "center",
            cursor:        "pointer",
            background:    file ? "rgba(22,163,74,0.03)" : "#F8FAFC",
            marginBottom:  "22px",
            transition:    "border-color 0.15s, background 0.15s",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "10px", lineHeight: 1 }}>
            {file
              ? (ext === "PDF" ? "📕" : ext === "XLSX" || ext === "XLS" ? "📗" : "📄")
              : "📂"}
          </div>

          {file ? (
            <div>
              <p style={{ fontWeight: 600, fontSize: "14px", color: "#16A34A", margin: "0 0 4px" }}>
                {file.name}
              </p>
              <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>
                {(file.size / 1024).toFixed(1)} KB · {ext}
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
            ref={fileRef}
            type="file"
            accept=".pdf,.xlsx,.xls,.csv,.txt"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background:   "rgba(220,38,38,0.07)",
            border:       "1px solid rgba(220,38,38,0.2)",
            borderRadius: "8px",
            padding:      "12px 16px",
            marginBottom: "18px",
            fontSize:     "13px",
            color:        "#DC2626",
          }}>
            {error}
          </div>
        )}

        {/* Botón importar */}
        <button
          onClick={handleImport}
          disabled={!canImport}
          style={{
            width:        "100%",
            height:       "44px",
            background:   canImport ? "#16A34A" : "#E2E8F0",
            color:        canImport ? "#FFFFFF"  : "#94A3B8",
            border:       "none",
            borderRadius: "10px",
            fontSize:     "14px",
            fontWeight:   600,
            cursor:       canImport ? "pointer" : "not-allowed",
            transition:   "background 0.15s",
            letterSpacing: "0.01em",
          }}
        >
          {loading ? "Importando…" : "Importar cartola"}
        </button>
      </div>

      {/* Resultado */}
      {result && (
        <div style={{
          maxWidth:     "680px",
          margin:       "20px auto 0",
          background:   "#FFFFFF",
          border:       "1px solid #E2E8F0",
          borderRadius: "14px",
          padding:      "24px 32px",
        }}>

          {/* Stats */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
            <Stat
              value={result.importedRows}
              label="movimientos importados"
              color="#16A34A"
              bg="rgba(22,163,74,0.08)"
              border="rgba(22,163,74,0.2)"
            />
            {result.skippedRows > 0 && (
              <Stat
                value={result.skippedRows}
                label="duplicados omitidos"
                color="#94A3B8"
                bg="#F1F5F9"
                border="#E2E8F0"
              />
            )}
            {result.needsReview && (
              <div style={{
                background:   "rgba(245,158,11,0.08)",
                border:       "1px solid rgba(245,158,11,0.3)",
                borderRadius: "10px",
                padding:      "12px 20px",
                display:      "flex",
                alignItems:   "center",
                gap:          "8px",
              }}>
                <span style={{ fontSize: "18px" }}>⚠️</span>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#B45309", textTransform: "uppercase", letterSpacing: "0.05em" }}>Revisión manual</div>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>PDF — verificar direcciones</div>
                </div>
              </div>
            )}
          </div>

          {/* Preview table */}
          {result.preview.length > 0 && (
            <>
              <p style={{
                fontSize:      "11px",
                fontWeight:    700,
                color:         "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom:  "10px",
              }}>
                Últimos movimientos detectados
              </p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E2E8F0" }}>
                      {["Fecha", "Descripción", "Monto", "Dirección"].map(h => (
                        <th key={h} style={{
                          padding:       "8px 12px",
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
                      <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "9px 12px", color: "#475569", whiteSpace: "nowrap" }}>
                          {fmtDate(row.occurredAt)}
                        </td>
                        <td style={{
                          padding:      "9px 12px",
                          color:        "#0F2A3D",
                          maxWidth:     "260px",
                          overflow:     "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace:   "nowrap",
                        }}>
                          {row.description}
                        </td>
                        <td style={{
                          padding:    "9px 12px",
                          fontWeight: 600,
                          color:      row.direction === "INFLOW" ? "#16A34A" : "#DC2626",
                          whiteSpace: "nowrap",
                        }}>
                          {row.direction === "INFLOW" ? "+" : "−"}{fmtClp(row.amountClp)}
                        </td>
                        <td style={{ padding: "9px 12px" }}>
                          <span style={{
                            fontSize:     "11px",
                            fontWeight:   700,
                            padding:      "3px 9px",
                            borderRadius: "6px",
                            background:   row.direction === "INFLOW" ? "rgba(22,163,74,0.1)"  : "rgba(220,38,38,0.1)",
                            color:        row.direction === "INFLOW" ? "#16A34A"               : "#DC2626",
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
                <p style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center", marginTop: "12px", marginBottom: 0 }}>
                  Mostrando {result.preview.length} de {result.totalRows} movimientos importados
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────
function Stat({ value, label, color, bg, border }: {
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
