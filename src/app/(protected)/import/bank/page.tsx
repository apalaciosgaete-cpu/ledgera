"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionToken } from "@/modules/identity/client/authStorage";

type ImportData = {
  uploadId: string;
};

type ApiResponse<T> = {
  ok:      boolean;
  message: string;
  data:    T;
};

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

function fileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf")             return "📕";
  if (ext === "xlsx" || ext === "xls") return "📗";
  return "📄";
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BankImportPage() {
  const router = useRouter();

  const [bankName, setBankName] = useState("Santander");
  const [file,     setFile]     = useState<File | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
    setError(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0] ?? null;
    setFile(f);
    setError(null);
    setError(null);
  }

  async function handleImport() {
    if (!file) return;

    setLoading(true);
    setError(null);
    setError(null);

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

      router.push(`/bank/uploads/${json.data.uploadId}`);
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

    </div>
  );
}

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
