"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fonts, colors } from "@/styles/tokens";

type UploadKind = "PDF" | "Excel";

type UploadedFile = {
  name: string;
  size: number;
  kind: UploadKind;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentacionOrigenFondosPage() {
  const router = useRouter();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  function addFiles(kind: UploadKind, fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList).map((file) => ({
      name: file.name,
      size: file.size,
      kind,
    }));
    setFiles((current) => [...incoming, ...current]);
  }

  return (
    <main style={{ height: "calc(100vh - 100px)", overflow: "hidden", display: "grid", gap: 14, gridTemplateRows: "auto 1fr auto" }}>
      <section>
        <button onClick={() => router.push("/origen-fondos")} style={{ background: "transparent", border: "none", cursor: "pointer", color: colors.textSecondary, fontSize: 13, fontFamily: fonts.body, padding: 0, marginBottom: 8 }}>← Volver a Origen de Fondos</button>
        <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.35rem,2.4vw,1.72rem)", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>Documentación</h1>
        <p style={{ color: "#334155", fontSize: 13, lineHeight: 1.3, margin: 0, fontFamily: fonts.body }}>Sube archivos PDF o Excel para respaldar origen de fondos.</p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 14, alignContent: "start" }}>
        <button type="button" onClick={() => pdfInputRef.current?.click()} style={{ minHeight: 170, borderRadius: 22, border: "1px solid #FFE8D6", background: "#FFFBF6", color: "#0F2A3D", cursor: "pointer", padding: 22, textAlign: "center", boxShadow: "0 10px 22px rgba(15,42,61,0.05)", fontFamily: fonts.body, display: "grid", placeItems: "center", gap: 10 }}>
          <span style={{ fontSize: 42, lineHeight: 1 }}>📄</span>
          <strong style={{ display: "block", fontSize: 18, fontWeight: 900 }}>Subir PDF</strong>
          <span style={{ display: "block", color: "#475569", fontSize: 13.5 }}>Cartolas, certificados, contratos o respaldos en PDF.</span>
        </button>

        <button type="button" onClick={() => excelInputRef.current?.click()} style={{ minHeight: 170, borderRadius: 22, border: "1px solid #D9F5E8", background: "#F8FFFB", color: "#0F2A3D", cursor: "pointer", padding: 22, textAlign: "center", boxShadow: "0 10px 22px rgba(15,42,61,0.05)", fontFamily: fonts.body, display: "grid", placeItems: "center", gap: 10 }}>
          <span style={{ fontSize: 42, lineHeight: 1 }}>📊</span>
          <strong style={{ display: "block", fontSize: 18, fontWeight: 900 }}>Subir Excel</strong>
          <span style={{ display: "block", color: "#475569", fontSize: 13.5 }}>Movimientos, conciliaciones, reportes o planillas XLS/XLSX.</span>
        </button>

        <input ref={pdfInputRef} type="file" accept="application/pdf,.pdf" multiple hidden onChange={(event) => addFiles("PDF", event.target.files)} />
        <input ref={excelInputRef} type="file" accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" multiple hidden onChange={(event) => addFiles("Excel", event.target.files)} />
      </section>

      <section style={{ border: "1px solid #DDD6FE", borderRadius: 18, background: "#FFFFFF", padding: 14, minHeight: 110, overflow: "hidden", fontFamily: fonts.body }}>
        <strong style={{ display: "block", color: "#0F2A3D", fontSize: 15, fontWeight: 900, marginBottom: 10 }}>Archivos seleccionados</strong>
        {files.length === 0 ? (
          <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Aún no hay archivos seleccionados.</p>
        ) : (
          <div style={{ display: "grid", gap: 8, maxHeight: 140, overflow: "auto" }}>
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, border: "1px solid #E2E8F0", borderRadius: 12, padding: "8px 10px", color: "#0F2A3D", fontSize: 13 }}>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.kind} · {file.name}</span>
                <span style={{ color: "#64748B", flexShrink: 0 }}>{formatBytes(file.size)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
