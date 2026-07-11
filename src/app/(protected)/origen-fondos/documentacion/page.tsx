"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { getSessionToken } from "@/modules/identity/client/authStorage";

type UploadKind = "PDF" | "Planilla";
type UploadStatus = "PENDING" | "UPLOADING" | "UPLOADED" | "STAGED" | "REVIEW" | "ERROR";
type DocumentCategory = "CARTOLA" | "CERTIFICADO" | "CONTRATO" | "COMPROBANTE" | "HISTORIAL" | "CONCILIACION" | "OTRO";
type RelatedSource = "" | "BANCO" | "EXCHANGE" | "WALLET" | "OTRA";

type IntakeResponse = {
  ok: boolean;
  message: string;
  data?: {
    documentId?: string;
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
  file: File;
  name: string;
  size: number;
  kind: UploadKind;
  status: UploadStatus;
  category: DocumentCategory;
  relatedSource: RelatedSource;
  period: string;
  description: string;
  message?: string;
  errors?: string[];
  redirectTo?: string | null;
  validationError?: string;
};

const MAX_FILES = 20;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".pdf", ".xls", ".xlsx", ".csv"];

const DOCUMENT_CATEGORIES: Array<{ value: DocumentCategory; label: string }> = [
  { value: "CARTOLA", label: "Cartola" },
  { value: "CERTIFICADO", label: "Certificado" },
  { value: "CONTRATO", label: "Contrato" },
  { value: "COMPROBANTE", label: "Comprobante" },
  { value: "HISTORIAL", label: "Historial" },
  { value: "CONCILIACION", label: "Conciliación" },
  { value: "OTRO", label: "Otro" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readCsrfCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split("; ").find((cookie) => cookie.startsWith("ledgera_csrf="));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : "";
}

function statusLabel(status: UploadStatus): string {
  if (status === "PENDING") return "Pendiente";
  if (status === "UPLOADING") return "Subiendo";
  if (status === "STAGED") return "En revisión";
  if (status === "REVIEW") return "Revisar";
  if (status === "ERROR") return "Error";
  return "Registrado";
}

function validateFile(file: File, kind: UploadKind): string | undefined {
  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  const allowedForKind = kind === "PDF" ? [".pdf"] : [".xls", ".xlsx", ".csv"];

  if (!ACCEPTED_EXTENSIONS.includes(extension) || !allowedForKind.includes(extension)) {
    return kind === "PDF"
      ? "Formato no compatible. Selecciona un archivo PDF."
      : "Formato no compatible. Selecciona un archivo XLS, XLSX o CSV.";
  }

  if (file.size === 0) return "El archivo está vacío.";
  if (file.size > MAX_FILE_SIZE_BYTES) return "El archivo supera el máximo de 50 MB.";
  return undefined;
}

function DocumentIcon() {
  return (
    <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path d="M7 3.75h6.4L18 8.35v11.9H7V3.75Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M13 3.75v4.8h4.8M9.5 12h6M9.5 15.5h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpreadsheetIcon() {
  return (
    <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 9h16M9 4v16M14.5 9v11" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export default function DocumentacionOrigenFondosPage() {
  const router = useRouter();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const spreadsheetInputRef = useRef<HTMLInputElement>(null);
  const abortControllersRef = useRef(new Map<string, AbortController>());
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  function updateFile(id: string, patch: Partial<UploadedFile>) {
    setFiles((current) => current.map((file) => file.id === id ? { ...file, ...patch } : file));
  }

  async function uploadFile(entry: UploadedFile) {
    if (entry.validationError || entry.status === "UPLOADING") return;

    const controller = new AbortController();
    abortControllersRef.current.set(entry.id, controller);
    updateFile(entry.id, { status: "UPLOADING", message: undefined, errors: undefined, redirectTo: null });

    try {
      const form = new FormData();
      form.append("file", entry.file);
      form.append("sourceHint", "DOCUMENTACION");
      form.append("documentKind", entry.kind === "Planilla" ? "SPREADSHEET" : "PDF");
      form.append("documentCategory", entry.category);
      if (entry.relatedSource) form.append("relatedSource", entry.relatedSource);
      if (entry.period.trim()) form.append("period", entry.period.trim());
      if (entry.description.trim()) form.append("description", entry.description.trim());

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
        signal: controller.signal,
      });

      const payload = await response.json() as IntakeResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.message || `HTTP ${response.status}`);

      const staged = payload.data?.stagingTarget === "EXCHANGE" || payload.data?.status === "STAGED";
      const hasWarnings = Boolean(payload.data?.errors?.length);
      updateFile(entry.id, {
        status: staged ? "STAGED" : hasWarnings ? "REVIEW" : "UPLOADED",
        message: payload.message,
        errors: payload.data?.errors ?? [],
        redirectTo: payload.data?.redirectTo ?? null,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        updateFile(entry.id, { status: "PENDING", message: "Carga cancelada. El archivo sigue pendiente." });
      } else {
        updateFile(entry.id, {
          status: "ERROR",
          message: error instanceof Error ? error.message : "No fue posible subir el archivo.",
        });
      }
    } finally {
      abortControllersRef.current.delete(entry.id);
    }
  }

  function addFiles(kind: UploadKind, fileList: FileList | null) {
    if (!fileList) return;

    const availableSlots = Math.max(0, MAX_FILES - files.length);
    const selectedFiles = Array.from(fileList).slice(0, availableSlots);
    const omitted = fileList.length - selectedFiles.length;

    const incoming: UploadedFile[] = selectedFiles.map((file) => {
      const validationError = validateFile(file, kind);
      return {
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        name: file.name,
        size: file.size,
        kind,
        status: validationError ? "ERROR" : "PENDING",
        category: kind === "PDF" ? "COMPROBANTE" : "HISTORIAL",
        relatedSource: "",
        period: "",
        description: "",
        validationError,
        message: validationError,
      };
    });

    setFiles((current) => [...incoming, ...current]);
    setNotice(omitted > 0 ? `Se admiten hasta ${MAX_FILES} archivos por carga. ${omitted} archivo(s) no fueron agregados.` : null);
  }

  function removeFile(id: string) {
    const controller = abortControllersRef.current.get(id);
    if (controller) controller.abort();
    setFiles((current) => current.filter((file) => file.id !== id));
  }

  function cancelUpload(id: string) {
    abortControllersRef.current.get(id)?.abort();
  }

  function openFile(file: File) {
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function uploadPendingFiles() {
    const pending = files.filter((file) => file.status === "PENDING" || (file.status === "ERROR" && !file.validationError));
    await Promise.all(pending.map((file) => uploadFile(file)));
  }

  const pendingCount = files.filter((file) => file.status === "PENDING" || (file.status === "ERROR" && !file.validationError)).length;
  const uploading = files.some((file) => file.status === "UPLOADING");

  return (
    <main style={{ minHeight: "calc(100vh - 100px)", paddingBottom: 72, fontFamily: fonts.body }}>
      <div style={{ width: "100%", maxWidth: 1160, margin: "0 auto", display: "grid", gap: 24 }}>
        <header style={{ display: "grid", gap: 8 }}>
          <button
            type="button"
            onClick={() => router.push("/origen-fondos")}
            style={{ width: "fit-content", display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: "var(--text-soft)", fontSize: 13, fontFamily: fonts.body, padding: 0 }}
          >
            ← Volver a Origen de Fondos
          </button>

          <div style={{ display: "grid", gap: 6 }}>
            <h1 style={{ color: "var(--text)", fontSize: "clamp(1.65rem,3vw,2.25rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.045em", fontFamily: fonts.display }}>
              Documentación
            </h1>
            <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.55, margin: 0, maxWidth: 760 }}>
              Carga documentos e historiales para respaldar y complementar tus operaciones tributarias.
            </p>
          </div>
        </header>

        <section className="upload-grid" aria-label="Opciones de carga">
          <button type="button" className="upload-card" onClick={() => pdfInputRef.current?.click()}>
            <span className="upload-card__icon"><DocumentIcon /></span>
            <span className="upload-card__content">
              <span className="upload-card__heading">
                <strong>Documentos de respaldo</strong>
                <span className="status-pill">Disponible</span>
              </span>
              <span className="upload-card__description">Cartolas, certificados, contratos y comprobantes.</span>
              <span className="upload-card__format">Formato compatible · PDF</span>
              <span className="upload-card__action">Seleccionar archivos →</span>
            </span>
          </button>

          <button type="button" className="upload-card" onClick={() => spreadsheetInputRef.current?.click()}>
            <span className="upload-card__icon"><SpreadsheetIcon /></span>
            <span className="upload-card__content">
              <span className="upload-card__heading">
                <strong>Historiales y conciliaciones</strong>
                <span className="status-pill">Disponible</span>
              </span>
              <span className="upload-card__description">Movimientos, reportes y planillas estructuradas.</span>
              <span className="upload-card__format">Formatos compatibles · XLS · XLSX · CSV</span>
              <span className="upload-card__action">Seleccionar archivos →</span>
            </span>
          </button>

          <input ref={pdfInputRef} type="file" accept="application/pdf,.pdf" multiple hidden onChange={(event) => { addFiles("PDF", event.target.files); event.currentTarget.value = ""; }} />
          <input ref={spreadsheetInputRef} type="file" accept=".xls,.xlsx,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" multiple hidden onChange={(event) => { addFiles("Planilla", event.target.files); event.currentTarget.value = ""; }} />
        </section>

        <p style={{ color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.5, margin: "-8px 0 0", maxWidth: 860 }}>
          Máximo 20 archivos y 50 MB por archivo. Las planillas con datos reconocibles pueden generar registros en Importaciones; los demás archivos quedarán como respaldo documental.
        </p>

        <section className="files-panel">
          <div className="files-panel__header">
            <div>
              <strong>Archivos seleccionados</strong>
              <span>{files.length === 0 ? "Los archivos seleccionados aparecerán aquí." : `${files.length} archivo${files.length === 1 ? "" : "s"}`}</span>
            </div>
            {files.length > 0 ? (
              <button type="button" className="primary-action" disabled={pendingCount === 0 || uploading} onClick={() => void uploadPendingFiles()}>
                {uploading ? "Cargando…" : `Cargar ${pendingCount || ""} archivo${pendingCount === 1 ? "" : "s"}`.trim()}
              </button>
            ) : null}
          </div>

          {notice ? <div className="notice" role="status">{notice}</div> : null}

          {files.length > 0 ? (
            <div className="file-list">
              {files.map((entry) => (
                <article key={entry.id} className="file-item">
                  <div className="file-item__summary">
                    <div className="file-name-block">
                      <strong title={entry.name}>{entry.name}</strong>
                      <span>{entry.kind} · {formatBytes(entry.size)} · Destino: {entry.status === "STAGED" ? "Importaciones" : "Documentación"}</span>
                    </div>
                    <span className={`file-status file-status--${entry.status.toLowerCase()}`}>{statusLabel(entry.status)}</span>
                  </div>

                  <div className="metadata-grid">
                    <label>
                      <span>Tipo de documento</span>
                      <select value={entry.category} disabled={entry.status === "UPLOADING"} onChange={(event) => updateFile(entry.id, { category: event.target.value as DocumentCategory })}>
                        {DOCUMENT_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>Fuente relacionada</span>
                      <select value={entry.relatedSource} disabled={entry.status === "UPLOADING"} onChange={(event) => updateFile(entry.id, { relatedSource: event.target.value as RelatedSource })}>
                        <option value="">Sin especificar</option>
                        <option value="BANCO">Banco</option>
                        <option value="EXCHANGE">Exchange</option>
                        <option value="WALLET">Wallet</option>
                        <option value="OTRA">Otra fuente</option>
                      </select>
                    </label>
                    <label>
                      <span>Período</span>
                      <input value={entry.period} disabled={entry.status === "UPLOADING"} maxLength={80} placeholder="Ej. 2025 o ene–dic 2025" onChange={(event) => updateFile(entry.id, { period: event.target.value })} />
                    </label>
                    <label>
                      <span>Descripción opcional</span>
                      <input value={entry.description} disabled={entry.status === "UPLOADING"} maxLength={240} placeholder="Contexto breve del respaldo" onChange={(event) => updateFile(entry.id, { description: event.target.value })} />
                    </label>
                  </div>

                  {entry.message ? <p className={entry.status === "ERROR" ? "file-message file-message--error" : "file-message"}>{entry.message}</p> : null}
                  {entry.errors?.length ? (
                    <details className="backend-details">
                      <summary>Ver detalle del procesamiento ({entry.errors.length})</summary>
                      <ul>{entry.errors.map((error, index) => <li key={`${entry.id}-error-${index}`}>{error}</li>)}</ul>
                    </details>
                  ) : null}

                  <div className="file-actions">
                    <button type="button" onClick={() => openFile(entry.file)}>Ver archivo</button>
                    {entry.status === "UPLOADING" ? <button type="button" onClick={() => cancelUpload(entry.id)}>Cancelar</button> : null}
                    {entry.status === "ERROR" && !entry.validationError ? <button type="button" onClick={() => void uploadFile(entry)}>Reintentar</button> : null}
                    {entry.redirectTo ? <button type="button" className="file-actions__accent" onClick={() => router.push(entry.redirectTo ?? "/importaciones")}>Ir a Importaciones</button> : null}
                    {entry.status !== "UPLOADING" ? <button type="button" onClick={() => removeFile(entry.id)}>Eliminar</button> : null}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <style jsx>{`
        .upload-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
          gap: 14px;
          width: 100%;
          max-width: 860px;
        }

        .upload-card {
          min-height: 182px;
          border-radius: 22px;
          border: 1px solid var(--border-strong);
          background: var(--bg-elev);
          color: var(--text);
          cursor: pointer;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 15px;
          padding: 18px;
          text-align: left;
          box-shadow: var(--shadow-sm);
          font-family: ${fonts.body};
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .upload-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent-soft);
          box-shadow: 0 14px 30px rgba(15, 42, 61, 0.09);
        }

        .upload-card:focus-visible,
        .primary-action:focus-visible,
        .file-actions button:focus-visible {
          outline: 3px solid var(--accent-soft);
          outline-offset: 2px;
        }

        .upload-card__icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: var(--bg-sunken);
          color: var(--accent);
        }

        .upload-card__content {
          min-width: 0;
          display: grid;
          grid-template-rows: auto 1fr auto auto;
          gap: 9px;
        }

        .upload-card__heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .upload-card__heading strong {
          font-family: ${fonts.display};
          font-size: 18px;
          line-height: 1.18;
          letter-spacing: -0.035em;
        }

        .status-pill {
          flex: 0 0 auto;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--bg-sunken);
          color: var(--text-soft);
          padding: 6px 9px;
          font-size: 9.5px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          line-height: 1.2;
        }

        .upload-card__description {
          color: var(--text-soft);
          font-size: 12.5px;
          line-height: 1.48;
        }

        .upload-card__format {
          color: var(--text);
          font-size: 11.25px;
          font-weight: 800;
        }

        .upload-card__action {
          color: var(--accent);
          font-size: 12.25px;
          font-weight: 900;
        }

        .files-panel {
          border: 1px solid var(--border-strong);
          border-radius: 20px;
          background: var(--bg-elev);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }

        .files-panel__header {
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 15px 17px;
        }

        .files-panel__header > div {
          display: grid;
          gap: 3px;
        }

        .files-panel__header strong {
          color: var(--text);
          font-family: ${fonts.display};
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -0.025em;
        }

        .files-panel__header span {
          color: var(--text-soft);
          font-size: 12.5px;
        }

        .primary-action {
          flex: 0 0 auto;
          border: 1px solid var(--accent);
          border-radius: 12px;
          background: var(--accent);
          color: white;
          cursor: pointer;
          padding: 10px 14px;
          font-family: ${fonts.body};
          font-size: 12.5px;
          font-weight: 900;
        }

        .primary-action:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .notice {
          margin: 0 17px 14px;
          border: 1px solid var(--accent-soft);
          border-radius: 12px;
          background: var(--bg-sunken);
          color: var(--text-soft);
          padding: 10px 12px;
          font-size: 12.5px;
          line-height: 1.45;
        }

        .file-list {
          display: grid;
          gap: 10px;
          padding: 0 12px 12px;
        }

        .file-item {
          border: 1px solid var(--border);
          border-radius: 15px;
          background: var(--bg);
          padding: 13px;
          display: grid;
          gap: 12px;
        }

        .file-item__summary {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .file-name-block {
          min-width: 0;
          display: grid;
          gap: 3px;
        }

        .file-name-block strong {
          color: var(--text);
          font-size: 13.5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-name-block span {
          color: var(--text-soft);
          font-size: 11.75px;
          line-height: 1.4;
        }

        .file-status {
          flex: 0 0 auto;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--bg-sunken);
          color: var(--text-soft);
          padding: 6px 9px;
          font-size: 9.5px;
          line-height: 1.2;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.035em;
        }

        .file-status--uploaded,
        .file-status--staged {
          color: var(--accent);
        }

        .file-status--error {
          color: var(--loss);
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 9px;
        }

        .metadata-grid label {
          min-width: 0;
          display: grid;
          gap: 5px;
        }

        .metadata-grid label > span {
          color: var(--text-soft);
          font-size: 10.75px;
          font-weight: 800;
        }

        .metadata-grid select,
        .metadata-grid input {
          width: 100%;
          min-width: 0;
          height: 38px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--bg-elev);
          color: var(--text);
          padding: 0 10px;
          font-family: ${fonts.body};
          font-size: 12px;
        }

        .metadata-grid select:focus,
        .metadata-grid input:focus {
          outline: 2px solid var(--accent-soft);
          border-color: var(--accent);
        }

        .metadata-grid select:disabled,
        .metadata-grid input:disabled {
          opacity: 0.65;
        }

        .file-message {
          color: var(--text-soft);
          font-size: 12px;
          line-height: 1.5;
          margin: 0;
        }

        .file-message--error {
          color: var(--loss);
        }

        .backend-details {
          color: var(--text-soft);
          font-size: 11.75px;
          line-height: 1.5;
        }

        .backend-details summary {
          cursor: pointer;
          color: var(--text);
          font-weight: 800;
        }

        .backend-details ul {
          margin: 7px 0 0;
          padding-left: 18px;
        }

        .file-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .file-actions button {
          border: 1px solid var(--border);
          border-radius: 9px;
          background: transparent;
          color: var(--text-soft);
          cursor: pointer;
          padding: 7px 10px;
          font-family: ${fonts.body};
          font-size: 11.5px;
          font-weight: 800;
        }

        .file-actions button:hover {
          border-color: var(--accent-soft);
          color: var(--text);
        }

        .file-actions .file-actions__accent {
          color: var(--accent);
        }

        @media (max-width: 900px) {
          .metadata-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 620px) {
          .upload-card {
            grid-template-columns: 1fr;
          }

          .upload-card__heading,
          .files-panel__header,
          .file-item__summary {
            align-items: flex-start;
          }

          .files-panel__header {
            flex-direction: column;
          }

          .primary-action {
            width: 100%;
          }

          .metadata-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
