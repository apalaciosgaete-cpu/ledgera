"use client";

import { useCallback, useRef, useState } from "react";
import { getSessionToken } from "@/modules/identity/client/authStorage";
import type { ColMapping } from "@/modules/banking/domain/bankTypes";

// ── Helpers ───────────────────────────────────────────────────────────────────
function readCsrfCookie(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.split("; ").find(c => c.startsWith("ledgera_csrf="));
  return m ? decodeURIComponent(m.split("=")[1] ?? "") : "";
}

function fmtClp(n: number): string {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

const FILE_ACCEPT = ".csv,.txt,.xlsx,.xls,.pdf";

const KNOWN_BANKS = [
  "BancoEstado", "BancoBCI", "BancoSantander", "BancoChile",
  "BancoFalabella", "BancoItau", "BancoScotia", "BancoSecurity",
  "BancoRipley", "BancoConsorcio",
];

// ── Types ─────────────────────────────────────────────────────────────────────
type WizardStep = "upload" | "map" | "preview" | "result";
type FileType   = "CSV" | "XLSX" | "PDF";

interface DetectResult {
  fileType:         FileType;
  headers:          string[];
  suggestedMapping: Partial<ColMapping>;
  separator:        string;
  sampleRows:       string[][];
  needsMapping:     boolean;
  needsReview:      boolean;
  errors:           string[];
  pdfRows?:         PreviewRow[];
  pdfTotal?:        number;
}

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
  errorRows:    number;
  needsReview:  boolean;
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh", background: "#E8EEF5", padding: "32px 24px",
    fontFamily: "var(--font-body, system-ui, sans-serif)",
  } as React.CSSProperties,
  card: {
    background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px",
    padding: "28px 32px", maxWidth: "820px", margin: "0 auto",
  } as React.CSSProperties,
  title: {
    fontSize: "20px", fontWeight: 700, color: "#0F2A3D", marginBottom: "4px",
    fontFamily: "var(--font-display, system-ui, sans-serif)",
  } as React.CSSProperties,
  sub: { fontSize: "13px", color: "#64748B", marginBottom: "28px", marginTop: 0 } as React.CSSProperties,
  label: {
    display: "block", fontSize: "12px", fontWeight: 600, color: "#334155",
    marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em",
  } as React.CSSProperties,
  input: {
    width: "100%", height: "38px", border: "1px solid #E2E8F0", borderRadius: "8px",
    padding: "0 12px", fontSize: "13px", color: "#0F2A3D", background: "#F8FAFC",
    outline: "none", boxSizing: "border-box",
  } as React.CSSProperties,
  select: {
    width: "100%", height: "38px", border: "1px solid #E2E8F0", borderRadius: "8px",
    padding: "0 12px", fontSize: "13px", color: "#0F2A3D", background: "#F8FAFC",
    outline: "none", cursor: "pointer", boxSizing: "border-box",
  } as React.CSSProperties,
  btnPrimary: {
    height: "40px", padding: "0 24px", background: "#16A34A", color: "#FFFFFF",
    border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
  } as React.CSSProperties,
  btnSecondary: {
    height: "40px", padding: "0 20px", background: "transparent", color: "#64748B",
    border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
    cursor: "pointer",
  } as React.CSSProperties,
  error: {
    background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)",
    borderRadius: "8px", padding: "12px 16px", color: "#DC2626", fontSize: "13px",
    marginBottom: "16px",
  } as React.CSSProperties,
};

// ── Stepper ───────────────────────────────────────────────────────────────────
const STEPS: { id: WizardStep; label: string }[] = [
  { id: "upload",  label: "Subir archivo" },
  { id: "map",     label: "Mapear columnas" },
  { id: "preview", label: "Vista previa" },
  { id: "result",  label: "Resultado" },
];

function Stepper({ current }: { current: WizardStep }) {
  const idx = STEPS.findIndex(s => s.id === current);
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "32px" }}>
      {STEPS.map((s, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: done ? "#16A34A" : active ? "#0F2A3D" : "#E2E8F0",
                color: done || active ? "#FFF" : "#94A3B8",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 700, flexShrink: 0,
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: "10px", color: active ? "#0F2A3D" : "#94A3B8", fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: "1px", background: done ? "#16A34A" : "#E2E8F0", margin: "0 8px", marginBottom: "16px" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── SelectCol ─────────────────────────────────────────────────────────────────
function SelectCol({ label, required, value, onChange, headers, hint }: {
  label: string; required?: boolean; value: string | null | undefined;
  onChange: (v: string | null) => void; headers: string[]; hint?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={S.label}>{label}{required && <span style={{ color: "#DC2626" }}> *</span>}</label>
      {hint && <span style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "2px" }}>{hint}</span>}
      <select style={S.select} value={value ?? ""} onChange={e => onChange(e.target.value || null)}>
        <option value="">— No incluido —</option>
        {headers.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
    </div>
  );
}

// ── PreviewTable ──────────────────────────────────────────────────────────────
function PreviewTable({ rows }: { rows: PreviewRow[] }) {
  return (
    <div style={{ overflowX: "auto", marginBottom: "20px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #E2E8F0" }}>
            {["Fecha", "Descripción", "Dir.", "Monto (CLP)", "Saldo"].map(h => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
              <td style={{ padding: "8px 12px", color: "#475569", whiteSpace: "nowrap" }}>{fmtDate(r.occurredAt)}</td>
              <td style={{ padding: "8px 12px", color: "#0F2A3D", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</td>
              <td style={{ padding: "8px 12px" }}>
                <span style={{
                  fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px",
                  background: r.direction === "INFLOW" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                  color: r.direction === "INFLOW" ? "#16A34A" : "#DC2626",
                }}>
                  {r.direction === "INFLOW" ? "ABONO" : "CARGO"}
                </span>
              </td>
              <td style={{ padding: "8px 12px", fontWeight: 600, color: r.direction === "INFLOW" ? "#16A34A" : "#DC2626", whiteSpace: "nowrap" }}>
                {r.direction === "INFLOW" ? "+" : "−"}{fmtClp(r.amountClp)}
              </td>
              <td style={{ padding: "8px 12px", color: "#64748B", whiteSpace: "nowrap" }}>
                {r.balanceClp != null ? fmtClp(r.balanceClp) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── FileTypeBadge ─────────────────────────────────────────────────────────────
function FileTypeBadge({ type }: { type: FileType }) {
  const cfg: Record<FileType, { bg: string; color: string }> = {
    CSV:  { bg: "rgba(59,130,246,0.1)",  color: "#2563EB" },
    XLSX: { bg: "rgba(22,163,74,0.1)",   color: "#16A34A" },
    PDF:  { bg: "rgba(220,38,38,0.1)",   color: "#DC2626" },
  };
  const { bg, color } = cfg[type];
  return (
    <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: bg, color }}>
      {type}
    </span>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function BankImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [step,         setStep]         = useState<WizardStep>("upload");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const [file,         setFile]         = useState<File | null>(null);
  const [bankName,     setBankName]     = useState("");
  const [customBank,   setCustomBank]   = useState("");

  const [detect,       setDetect]       = useState<DetectResult | null>(null);
  const [mapping,      setMapping]      = useState<Partial<ColMapping>>({});
  const [saveTemplate, setSaveTemplate] = useState(true);

  const [preview,      setPreview]      = useState<{ rows: PreviewRow[]; total: number; errors: string[] } | null>(null);
  const [result,       setResult]       = useState<ImportResult | null>(null);

  const effectiveBankName = bankName === "__custom__" ? customBank : bankName;

  // ── File pick ────────────────────────────────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setError(null); }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setError(null); }
  }, []);

  // ── Build FormData helper ────────────────────────────────────────────────────
  function buildForm(extra: Record<string, string>): FormData {
    const fd = new FormData();
    fd.append("file",     file!);
    fd.append("bankName", effectiveBankName);
    for (const [k, v] of Object.entries(extra)) fd.append(k, v);
    return fd;
  }

  async function apiFetch(form: FormData) {
    const token = getSessionToken();
    const res = await fetch("/api/bank/import", {
      method: "POST",
      headers: {
        "Authorization": token ? `Bearer ${token}` : "",
        "x-csrf-token":  readCsrfCookie(),
      },
      body: form,
    });
    return res.json() as Promise<{ ok: boolean; message: string; data: unknown }>;
  }

  // ── Step 1 → detect ──────────────────────────────────────────────────────────
  async function handleDetect() {
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const res = await apiFetch(buildForm({ mode: "detect" }));
      if (!res.ok) { setError(res.message); return; }
      const d = res.data as DetectResult;
      setDetect(d);
      if (!bankName && d.fileType) { /* keep as is */ }
      setMapping(d.suggestedMapping);

      // PDF no necesita mapeo — ir directo a preview
      if (d.fileType === "PDF") {
        setPreview({ rows: d.pdfRows ?? [], total: d.pdfTotal ?? 0, errors: d.errors });
        setStep("preview");
      } else {
        setStep("map");
      }
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2 → preview ─────────────────────────────────────────────────────────
  async function handlePreview() {
    if (!mapping.colDate || !mapping.colDesc) { setError("Debes mapear Fecha y Descripción."); return; }
    setLoading(true); setError(null);
    try {
      const res = await apiFetch(buildForm({ mode: "preview", mapping: JSON.stringify(mapping) }));
      if (!res.ok) { setError(res.message); return; }
      const d = res.data as { rows: PreviewRow[]; total: number; errors: string[] };
      setPreview(d);
      setStep("preview");
    } catch {
      setError("Error al generar vista previa.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3 → import ──────────────────────────────────────────────────────────
  async function handleImport() {
    if (!effectiveBankName) { setError("Debes indicar el nombre del banco."); return; }
    setLoading(true); setError(null);
    try {
      const extra: Record<string, string> = {
        mode:         "import",
        saveTemplate: saveTemplate ? "true" : "false",
      };
      if (detect?.fileType !== "PDF") {
        extra.mapping = JSON.stringify(mapping);
      }
      const res = await apiFetch(buildForm(extra));
      if (!res.ok) { setError(res.message); return; }
      setResult(res.data as ImportResult);
      setStep("result");
    } catch {
      setError("Error al importar.");
    } finally {
      setLoading(false);
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────────
  function handleReset() {
    setStep("upload"); setFile(null); setBankName(""); setCustomBank("");
    setDetect(null); setMapping({}); setPreview(null); setResult(null); setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.card}>
        <h1 style={S.title}>Importar cartola bancaria</h1>
        <p style={S.sub}>Sube tu cartola en PDF, Excel o CSV — se detecta automáticamente.</p>

        <Stepper current={step} />

        {error && <div style={S.error}>{error}</div>}

        {/* ── STEP 1: UPLOAD ──────────────────────────────────────────────── */}
        {step === "upload" && (
          <div>
            <div
              onDragOver={e => e.preventDefault()} onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${file ? "#16A34A" : "#CBD5E1"}`, borderRadius: "12px",
                padding: "40px 24px", textAlign: "center", cursor: "pointer",
                background: file ? "rgba(22,163,74,0.04)" : "#F8FAFC",
                marginBottom: "20px", transition: "border-color 0.15s",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                {file ? (file.name.endsWith(".pdf") ? "📕" : file.name.match(/\.xlsx?/) ? "📗" : "📄") : "📁"}
              </div>
              {file ? (
                <div>
                  <p style={{ color: "#16A34A", fontWeight: 600, fontSize: "14px", margin: "0 0 4px" }}>{file.name}</p>
                  <p style={{ color: "#64748B", fontSize: "12px", margin: 0 }}>{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <>
                  <p style={{ color: "#334155", fontWeight: 600, fontSize: "14px", margin: "0 0 4px" }}>
                    Arrastra aquí o haz clic para seleccionar
                  </p>
                  <p style={{ color: "#94A3B8", fontSize: "12px", margin: 0 }}>
                    PDF · Excel (.xlsx) · CSV — extractos bancarios chilenos
                  </p>
                </>
              )}
              <input ref={fileRef} type="file" accept={FILE_ACCEPT} onChange={handleFileChange} style={{ display: "none" }} />
            </div>

            {/* Banco */}
            <div style={{ marginBottom: "20px" }}>
              <label style={S.label}>Banco</label>
              <select style={S.select} value={bankName} onChange={e => { setBankName(e.target.value); setError(null); }}>
                <option value="">— Autodetectar —</option>
                {KNOWN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                <option value="__custom__">Otro banco…</option>
              </select>
            </div>

            {bankName === "__custom__" && (
              <div style={{ marginBottom: "20px" }}>
                <label style={S.label}>Nombre del banco <span style={{ color: "#DC2626" }}>*</span></label>
                <input style={S.input} type="text" value={customBank} onChange={e => setCustomBank(e.target.value)} placeholder="Ej: BancoXYZ" />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                style={{ ...S.btnPrimary, opacity: !file || loading ? 0.5 : 1 }}
                disabled={!file || loading}
                onClick={handleDetect}
              >
                {loading ? "Analizando…" : "Analizar archivo →"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: MAP (solo CSV/XLSX) ─────────────────────────────────── */}
        {step === "map" && detect && detect.fileType !== "PDF" && (
          <div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", background: "#F1F5F9", borderRadius: "8px", padding: "12px 16px", marginBottom: "24px", fontSize: "13px", color: "#475569" }}>
              <FileTypeBadge type={detect.fileType} />
              <span>{detect.headers.length} columnas · </span>
              <strong style={{ color: "#0F2A3D" }}>{effectiveBankName || "Banco"}</strong>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={S.label}>Nombre del banco <span style={{ color: "#DC2626" }}>*</span></label>
              <input style={S.input} type="text" value={effectiveBankName} onChange={e => {
                if (bankName === "__custom__") setCustomBank(e.target.value);
                else { setBankName("__custom__"); setCustomBank(e.target.value); }
              }} placeholder="Nombre para guardar el template" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <SelectCol label="Fecha"        required value={mapping.colDate}    onChange={v => setMapping(m => ({ ...m, colDate:    v ?? undefined }))} headers={detect.headers} hint="Columna con la fecha del movimiento" />
              <SelectCol label="Descripción"  required value={mapping.colDesc}    onChange={v => setMapping(m => ({ ...m, colDesc:    v ?? undefined }))} headers={detect.headers} hint="Glosa, concepto o descripción" />
              <SelectCol label="Monto único"           value={mapping.colAmount}  onChange={v => setMapping(m => ({ ...m, colAmount:  v ?? undefined }))} headers={detect.headers} hint="Un único monto (negativo=cargo)" />
              <SelectCol label="Cargo / Débito"        value={mapping.colDebit}   onChange={v => setMapping(m => ({ ...m, colDebit:   v ?? undefined }))} headers={detect.headers} hint="Solo egresos" />
              <SelectCol label="Abono / Crédito"       value={mapping.colCredit}  onChange={v => setMapping(m => ({ ...m, colCredit:  v ?? undefined }))} headers={detect.headers} hint="Solo ingresos" />
              <SelectCol label="Saldo"                 value={mapping.colBalance} onChange={v => setMapping(m => ({ ...m, colBalance: v ?? undefined }))} headers={detect.headers} hint="Saldo al cierre" />
            </div>

            {/* Sample rows */}
            {detect.sampleRows.length > 0 && (
              <div style={{ marginBottom: "20px", overflowX: "auto" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Muestra del archivo</p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <thead>
                    <tr>
                      {detect.headers.map(h => (
                        <th key={h} style={{ padding: "4px 8px", background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#64748B", fontWeight: 600, whiteSpace: "nowrap", textAlign: "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detect.sampleRows.slice(0, 3).map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} style={{ padding: "4px 8px", border: "1px solid #F1F5F9", color: "#475569", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
              <input id="save-tpl" type="checkbox" checked={saveTemplate} onChange={e => setSaveTemplate(e.target.checked)} style={{ cursor: "pointer" }} />
              <label htmlFor="save-tpl" style={{ fontSize: "13px", color: "#475569", cursor: "pointer" }}>
                Recordar mapeo para <strong>{effectiveBankName || "este banco"}</strong>
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button style={S.btnSecondary} onClick={() => setStep("upload")}>← Volver</button>
              <button
                style={{ ...S.btnPrimary, opacity: (!mapping.colDate || !mapping.colDesc || loading) ? 0.5 : 1 }}
                disabled={!mapping.colDate || !mapping.colDesc || loading}
                onClick={handlePreview}
              >
                {loading ? "Generando…" : "Vista previa →"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: PREVIEW ─────────────────────────────────────────────── */}
        {step === "preview" && preview && (
          <div>
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
              <div style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: "8px", padding: "10px 16px" }}>
                <div style={{ fontSize: "11px", color: "#16A34A", fontWeight: 600, textTransform: "uppercase" }}>Total filas</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#0F2A3D" }}>{preview.total}</div>
              </div>
              {detect?.needsReview && (
                <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "8px", padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>⚠️</span>
                  <div>
                    <div style={{ fontSize: "11px", color: "#B45309", fontWeight: 600, textTransform: "uppercase" }}>Requiere revisión</div>
                    <div style={{ fontSize: "12px", color: "#64748B" }}>PDF — direcciones inferidas</div>
                  </div>
                </div>
              )}
              {detect && <div style={{ display: "flex", alignItems: "center" }}><FileTypeBadge type={detect.fileType} /></div>}
            </div>

            {preview.errors.length > 0 && (
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#92400E", margin: "0 0 6px" }}>Filas con advertencias ({preview.errors.length}):</p>
                {preview.errors.slice(0, 5).map((e, i) => <p key={i} style={{ fontSize: "12px", color: "#B45309", margin: "2px 0" }}>• {e}</p>)}
              </div>
            )}

            <PreviewTable rows={preview.rows.slice(0, 20)} />

            {preview.rows.length > 20 && (
              <p style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center", marginBottom: "16px" }}>
                Mostrando 20 de {preview.total} filas. Se importarán todas.
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button style={S.btnSecondary} onClick={() => setStep(detect?.fileType === "PDF" ? "upload" : "map")}>← Volver</button>
              <button style={{ ...S.btnPrimary, opacity: loading ? 0.5 : 1 }} disabled={loading} onClick={handleImport}>
                {loading ? "Importando…" : `Importar ${preview.total} movimientos`}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: RESULT ──────────────────────────────────────────────── */}
        {step === "result" && result && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>
              {result.needsReview ? "🔍" : result.importedRows > 0 ? "✅" : "ℹ️"}
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0F2A3D", marginBottom: "8px" }}>
              {result.needsReview ? "Importado — requiere revisión" : result.importedRows > 0 ? "¡Importación completada!" : "Sin movimientos nuevos"}
            </h2>
            {result.needsReview && (
              <p style={{ fontSize: "13px", color: "#B45309", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "8px", padding: "10px 16px", marginBottom: "16px", display: "inline-block" }}>
                Los movimientos PDF necesitan revisión manual de dirección (ingreso/egreso)
              </p>
            )}
            <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "24px" }}>Banco: <strong>{effectiveBankName}</strong></p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "32px", flexWrap: "wrap" }}>
              <div style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: "10px", padding: "14px 24px", minWidth: "110px" }}>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#16A34A" }}>{result.importedRows}</div>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>Importados</div>
              </div>
              <div style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "14px 24px", minWidth: "110px" }}>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#94A3B8" }}>{result.skippedRows}</div>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>Duplicados</div>
              </div>
              {result.errorRows > 0 && (
                <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px", padding: "14px 24px", minWidth: "110px" }}>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: "#B45309" }}>{result.errorRows}</div>
                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>Con errores</div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button style={S.btnSecondary} onClick={handleReset}>Importar otro archivo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
