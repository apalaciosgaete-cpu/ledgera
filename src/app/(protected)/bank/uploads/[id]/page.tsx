"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSessionToken } from "@/modules/identity/client/authStorage";

type UploadDetail = {
  id:           string;
  fileName:     string;
  bankName:     string | null;
  fileType:     string;
  createdAt:    string;
  totalRows:    number;
  importedRows: number;
  errorRows:    number;
  rejected:     number;
};

type Movement = {
  occurredAt:   string;
  description:  string;
  amountClp:    number;
  direction:    "INFLOW" | "OUTFLOW";
  bankCategory: string;
};

type ApiResponse<T> = { ok: boolean; message: string; data: T };

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  CRYPTO_PURCHASE_CANDIDATE: { label: "Posible crypto",  color: "var(--accent)", bg: "rgba(124,58,237,0.08)" },
  EXCHANGE_TRANSFER:         { label: "Transferencia",   color: "var(--accent)", bg: "rgba(3,105,161,0.08)"  },
  NORMAL_EXPENSE:            { label: "Gasto normal",    color: "var(--text-soft)", bg: "rgba(100,116,139,0.08)"},
  INCOME:                    { label: "Ingreso",         color: "var(--accent)", bg: "rgba(22,163,74,0.08)"  },
  UNKNOWN:                   { label: "Sin clasificar",  color: "var(--text-soft)", bg: "rgba(148,163,184,0.08)"},
};

function fmtClp(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", minimumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtDatetime(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function BankUploadDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [upload,    setUpload]    = useState<UploadDetail | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const token = getSessionToken();
        const res   = await fetch(`/api/bank/uploads/${id}`, {
          credentials: "include",
          headers: { "Authorization": token ? `Bearer ${token}` : "" },
        });

        const json = (await res.json()) as ApiResponse<{ upload: UploadDetail; movements: Movement[] }>;

        if (!json.ok) { setError(json.message); return; }

        setUpload(json.data.upload);
        setMovements(json.data.movements);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-sunken)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-soft)", fontSize: "14px" }}>Cargando importación…</p>
      </div>
    );
  }

  if (error || !upload) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-sunken)", padding: "40px 24px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", background: "#fff", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "14px", padding: "28px 32px" }}>
          <p style={{ color: "var(--loss)", fontSize: "14px", margin: 0 }}>{error ?? "Upload no encontrado."}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-sunken)", padding: "40px 24px", fontFamily: "var(--font-body, system-ui, sans-serif)" }}>

      {/* Header */}
      <div style={{ maxWidth: "860px", margin: "0 auto 24px" }}>
        <p style={{ fontSize: "12px", color: "var(--text-soft)", margin: "0 0 6px" }}>
          <a href="/import/bank" style={{ color: "var(--text-soft)", textDecoration: "none" }}>Importación</a>
          {" · "}
          <span style={{ color: "var(--text-soft)" }}>{upload.fileName}</span>
        </p>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px", fontFamily: "var(--font-display, system-ui, sans-serif)" }}>
          {upload.bankName ?? "Banco"} — {upload.fileType}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-soft)", margin: 0 }}>
          Importado el {fmtDatetime(upload.createdAt)}
        </p>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: "860px", margin: "0 auto 20px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
        <StatCard value={upload.totalRows}    label="Detectados"  color="var(--text)" bg="var(--text)"                   border="var(--text)" />
        <StatCard value={upload.importedRows} label="Importados"  color="#3FA687" bg="rgba(22,163,74,0.06)"      border="rgba(22,163,74,0.2)" />
        <StatCard value={upload.rejected + upload.errorRows} label="Omitidos" color="var(--text-soft)" bg="var(--text)" border="var(--text)" />
      </div>

      {/* Movements preview */}
      <div style={{ maxWidth: "860px", margin: "0 auto 20px", background: "#fff", border: "1px solid var(--border)", borderRadius: "14px", padding: "24px 32px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>
          Primeros movimientos detectados
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", tableLayout: "fixed", lineHeight: 1.45 }}>
            <colgroup>
              <col style={{ width: "140px" }} />
              <col />
              <col style={{ width: "160px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "160px" }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                {["Fecha", "Descripción", "Monto", "Dirección", "Categoría"].map(h => (
                  <th key={h} style={{ padding: "14px 18px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.map((row, i) => {
                const cat = CATEGORY_LABELS[row.bankCategory] ?? CATEGORY_LABELS.UNKNOWN;
                return (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)", height: "56px" }}>
                    <td style={{ padding: "14px 18px", color: "var(--text)", whiteSpace: "nowrap" }}>
                      {fmtDate(row.occurredAt)}
                    </td>
                    <td style={{ padding: "14px 18px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.description}
                    </td>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: row.direction === "INFLOW" ? "var(--accent)" : "var(--loss)", whiteSpace: "nowrap" }}>
                      {row.direction === "INFLOW" ? "+" : "−"}{fmtClp(row.amountClp)}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px", background: row.direction === "INFLOW" ? "rgba(22,163,74,0.1)" : "rgba(239,68,68,0.08)", color: row.direction === "INFLOW" ? "var(--accent)" : "var(--loss)" }}>
                        {row.direction === "INFLOW" ? "ABONO" : "CARGO"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "6px", background: cat.bg, color: cat.color }}>
                        {cat.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {upload.importedRows > movements.length && (
          <p style={{ fontSize: "12px", color: "var(--text-soft)", textAlign: "center", margin: "14px 0 0" }}>
            Mostrando {movements.length} de {upload.importedRows} movimientos importados
          </p>
        )}
      </div>

      {/* Actions */}
      <div style={{ maxWidth: "860px", margin: "0 auto 20px", display: "flex", justifyContent: "flex-end" }}>
        <a href="/bank/reconciliation" style={btnPrimary}>
          Revisar coincidencias crypto
        </a>
      </div>
    </div>
  );
}

function StatCard({ value, label, color, bg, border }: {
  value: number; label: string; color: string; bg: string; border: string;
}) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: "12px", padding: "18px 20px" }}>
      <div style={{ fontSize: "30px", fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "12px", color: "var(--text-soft)", marginTop: "4px" }}>{label}</div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", height: "40px", padding: "0 20px",
  background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: "10px",
  fontSize: "13px", fontWeight: 600, color: "var(--text)", textDecoration: "none",
};
