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
  CRYPTO_PURCHASE_CANDIDATE: { label: "Posible crypto",  color: "#7C3AED", bg: "rgba(124,58,237,0.08)" },
  EXCHANGE_TRANSFER:         { label: "Transferencia",   color: "#0369A1", bg: "rgba(3,105,161,0.08)"  },
  NORMAL_EXPENSE:            { label: "Gasto normal",    color: "#64748B", bg: "rgba(100,116,139,0.08)"},
  INCOME:                    { label: "Ingreso",         color: "#16A34A", bg: "rgba(22,163,74,0.08)"  },
  UNKNOWN:                   { label: "Sin clasificar",  color: "#94A3B8", bg: "rgba(148,163,184,0.08)"},
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
      <div style={{ minHeight: "100vh", background: "#E8EEF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#64748B", fontSize: "14px" }}>Cargando importación…</p>
      </div>
    );
  }

  if (error || !upload) {
    return (
      <div style={{ minHeight: "100vh", background: "#E8EEF5", padding: "40px 24px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", background: "#fff", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "14px", padding: "28px 32px" }}>
          <p style={{ color: "#EF4444", fontSize: "14px", margin: 0 }}>{error ?? "Upload no encontrado."}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#E8EEF5", padding: "40px 24px", fontFamily: "var(--font-body, system-ui, sans-serif)" }}>

      {/* Header */}
      <div style={{ maxWidth: "860px", margin: "0 auto 24px" }}>
        <p style={{ fontSize: "12px", color: "#94A3B8", margin: "0 0 6px" }}>
          <a href="/import/bank" style={{ color: "#94A3B8", textDecoration: "none" }}>Importación</a>
          {" · "}
          <span style={{ color: "#64748B" }}>{upload.fileName}</span>
        </p>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0F2A3D", margin: "0 0 4px", fontFamily: "var(--font-display, system-ui, sans-serif)" }}>
          {upload.bankName ?? "Banco"} — {upload.fileType}
        </h1>
        <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
          Importado el {fmtDatetime(upload.createdAt)}
        </p>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: "860px", margin: "0 auto 20px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
        <StatCard value={upload.totalRows}    label="Detectados"  color="#0F2A3D" bg="#F8FAFC"                   border="#E2E8F0" />
        <StatCard value={upload.importedRows} label="Importados"  color="#16A34A" bg="rgba(22,163,74,0.06)"      border="rgba(22,163,74,0.2)" />
        <StatCard value={upload.rejected + upload.errorRows} label="Omitidos" color="#94A3B8" bg="#F1F5F9" border="#E2E8F0" />
      </div>

      {/* Movements preview */}
      <div style={{ maxWidth: "860px", margin: "0 auto 20px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "24px 32px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>
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
              <tr style={{ borderBottom: "2px solid #E2E8F0" }}>
                {["Fecha", "Descripción", "Monto", "Dirección", "Categoría"].map(h => (
                  <th key={h} style={{ padding: "14px 18px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.map((row, i) => {
                const cat = CATEGORY_LABELS[row.bankCategory] ?? CATEGORY_LABELS.UNKNOWN;
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #F1F5F9", height: "56px" }}>
                    <td style={{ padding: "14px 18px", color: "#475569", whiteSpace: "nowrap" }}>
                      {fmtDate(row.occurredAt)}
                    </td>
                    <td style={{ padding: "14px 18px", color: "#0F2A3D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.description}
                    </td>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: row.direction === "INFLOW" ? "#16A34A" : "#EF4444", whiteSpace: "nowrap" }}>
                      {row.direction === "INFLOW" ? "+" : "−"}{fmtClp(row.amountClp)}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px", background: row.direction === "INFLOW" ? "rgba(22,163,74,0.1)" : "rgba(239,68,68,0.08)", color: row.direction === "INFLOW" ? "#16A34A" : "#EF4444" }}>
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
          <p style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center", margin: "14px 0 0" }}>
            Mostrando {movements.length} de {upload.importedRows} movimientos importados
          </p>
        )}
      </div>

      {/* Actions */}
      <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", gap: "10px" }}>
        <a href="/bank/movements" style={btnSecondary}>Ver todos los movimientos</a>
        <a href="/bank/reconciliation" style={btnPrimary}>Conciliar con Binance</a>
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
      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>{label}</div>
    </div>
  );
}

const btnSecondary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", height: "40px", padding: "0 20px",
  background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px",
  fontSize: "13px", fontWeight: 600, color: "#334155", textDecoration: "none",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", height: "40px", padding: "0 20px",
  background: "#0F2A3D", border: "1px solid #0F2A3D", borderRadius: "10px",
  fontSize: "13px", fontWeight: 600, color: "#FFFFFF", textDecoration: "none",
};
