"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { getSessionToken } from "@/modules/identity/client/authStorage";

type UploadKind = "PDF" | "Excel";
type UploadStatus = "UPLOADING" | "UPLOADED" | "STAGED" | "ERROR";

type IntakeResponse = {
  ok: boolean;
  message: string;
  data?: {
    redirectTo?: string | null;
    status?: string;
    stagingTarget?: string;
    imported?: number;
    skipped?: number;
    errors?: string[];
  };
};

type UploadedFile = {
  id: string;
  name: string;
  size: number;
  kind: UploadKind;
  status: UploadStatus;
  message?: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readCsrfCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split("; ").find((c) => c.startsWith("ledgera_csrf="));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : "";
}

function statusLabel(status: UploadStatus): string {
  if (status === "UPLOADING") return "Subiendo";
  if (status === "STAGED") return "En revisión";
  if (status === "ERROR") return "Error";
  return "Registrado";
}

export default function DocumentacionOrigenFondosPage() {
  const router = useRouter();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  function updateFile(id: string, patch: Partial<UploadedFile>) {
    setFiles((current) => current.map((file) => file.id === id ? { ...file, ...patch } : file));
  }

  async function uploadFile(kind: UploadKind, file: File, id: string) {
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("sourceHint", "DOCUMENTACION");
      form.append("documentKind", kind === "Excel" ? "SPREADSHEET" : "PDF");

      const token = getSessionToken() ?? "";
      const csrf = readCsrfCookie();
      const headers: Record<string, string> = { "x-ledgera-csrf": csrf };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch("/api/intake/files", {
        method: "POST",
        headers,
        credentials: "include",
        cache: "no-store",
        body: form,
      });

      const payload = await response.json() as IntakeResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || `HTTP ${response.status}`);
      }

      const staged = payload.data?.stagingTarget === "EXCHANGE" || payload.data?.status === "STAGED";
      updateFile(id, {
        status: staged ? "STAGED" : "UPLOADED",
        message: payload.message,
      });

      if (payload.data?.redirectTo) {
        window.setTimeout(() => router.push(payload.data?.redirectTo ?? "/importaciones"), 900);
      }
    } catch (error) {
      updateFile(id, {
        status: "ERROR",
        message: error instanceof Error ? error.message : "No fue posible subir el archivo.",
      });
    }
  }

  function addFiles(kind: UploadKind, fileList: FileList | null) {
    if (!fileList) return;

    const selectedFiles = Array.from(fileList);
    const incoming = selectedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      name: file.name,
      size: file.size,
      kind,
      status: "UPLOADING" as UploadStatus,
    }));

    setFiles((current) => [...incoming, ...current]);

    selectedFiles.forEach((file, index) => {
      const entry = incoming[index];
      if (entry) void uploadFile(kind, file, entry.id);
    });
  }

  return (
    <main style={{ height: "calc(100vh - 100px)", overflow: "hidden", display: "grid", gap: 14, gridTemplateRows: "auto 1fr auto" }}>
      <section>
        <button onClick={() => router.push("/origen-fondos")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-soft)", fontSize: 13, fontFamily: fonts.body, padding: 0, marginBottom: 8 }}>← Volver a Origen de Fondos</button>
        <h1 style={{ color: "var(--text)", fontSize: "clamp(1.35rem,2.4vw,1.72rem)", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>Documentación</h1>
        <p style={{ color: "var(--text)", fontSize: 13, lineHeight: 1.3, margin: 0, fontFamily: fonts.body }}>Sube archivos PDF o Excel para respaldar origen de fondos.</p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 14, alignContent: "start" }}>
        <button type="button" onClick={() => pdfInputRef.current?.click()} style={{ minHeight: 170, borderRadius: 22, border: "1px solid var(--border)", background: "var(--bg-elev)", color: "var(--text)", cursor: "pointer", padding: 22, textAlign: "center", boxShadow: "0 10px 22px rgba(15,42,61,0.05)", fontFamily: fonts.body, display: "grid", placeItems: "center", gap: 10 }}>
          <span style={{ fontSize: 42, lineHeight: 1 }}>📄</span>
          <strong style={{ display: "block", fontSize: 18, fontWeight: 900 }}>Subir PDF</strong>
          <span style={{ display: "block", color: "var(--text)", fontSize: 13.5 }}>Cartolas, certificados, contratos o respaldos en PDF.</span>
        </button>

        <button type="button" onClick={() => excelInputRef.current?.click()} style={{ minHeight: 170, borderRadius: 22, border: "1px solid var(--border)", background: "var(--bg-elev)", color: "var(--text)", cursor: "pointer", padding: 22, textAlign: "center", boxShadow: "0 10px 22px rgba(15,42,61,0.05)", fontFamily: fonts.body, display: "grid", placeItems: "center", gap: 10 }}>
          <span style={{ fontSize: 42, lineHeight: 1 }}>📊</span>
          <strong style={{ display: "block", fontSize: 18, fontWeight: 900 }}>Subir Excel</strong>
          <span style={{ display: "block", color: "var(--text)", fontSize: 13.5 }}>Movimientos, conciliaciones, reportes o planillas XLS/XLSX.</span>
        </button>

        <input ref={pdfInputRef} type="file" accept="application/pdf,.pdf" multiple hidden onChange={(event) => addFiles("PDF", event.target.files)} />
        <input ref={excelInputRef} type="file" accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" multiple hidden onChange={(event) => addFiles("Excel", event.target.files)} />
      </section>

      <section style={{ border: "1px solid var(--accent-soft)", borderRadius: 18, background: "var(--bg-elev)", padding: 14, minHeight: 110, overflow: "hidden", fontFamily: fonts.body }}>
        <strong style={{ display: "block", color: "var(--text)", fontSize: 15, fontWeight: 900, marginBottom: 10 }}>Archivos seleccionados</strong>
        {files.length === 0 ? (
          <p style={{ color: "var(--text-soft)", fontSize: 13, margin: 0 }}>Aún no hay archivos seleccionados.</p>
        ) : (
          <div style={{ display: "grid", gap: 8, maxHeight: 140, overflow: "auto" }}>
            {files.map((file) => (
              <div key={file.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, border: "1px solid var(--border)", borderRadius: 12, padding: "8px 10px", color: "var(--text)", fontSize: 13 }}>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.kind} · {file.name}</span>
                <span style={{ color: file.status === "ERROR" ? "var(--loss)" : "var(--text-soft)", flexShrink: 0 }}>{statusLabel(file.status)} · {formatBytes(file.size)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
