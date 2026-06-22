"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BankTabs } from "@/components/bank/BankTabs";
import { getSessionToken } from "@/modules/identity/client/authStorage";

type Upload = {
  id:           string;
  bankName:     string | null;
  fileName:     string;
  status:       string;
  totalRows:    number;
  importedRows: number;
  errorRows:    number;
  createdAt:    string;
};

type BankSummary = {
  totalBankMovements: number;
  pending:            number;
  matched:            number;
  ignored:            number;
  uploads:            Upload[];
};

type ApiResponse<T> = { ok: boolean; message: string; data: T };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default function BankPage() {
  const [summary, setSummary] = useState<BankSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const token = getSessionToken();
        const res   = await fetch("/api/bank/summary", {
          credentials: "include",
          headers:     token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json  = await res.json() as ApiResponse<BankSummary>;
        if (!res.ok || !json.ok) throw new Error(json.message);
        setSummary(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar resumen.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div>
      <BankTabs />

      <div style={{ maxWidth: "900px" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0F2A3D", margin: 0 }}>
            Resumen bancario
          </h1>
          <p style={{ fontSize: "14px", color: "#64748B", marginTop: "6px", marginBottom: 0 }}>
            Estado actual de tus movimientos e importaciones bancarias.
          </p>
        </div>

        {loading && (
          <p style={{ color: "#64748B", fontSize: "14px" }}>Cargando...</p>
        )}

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.06)", border: "1px solid rgba(220,38,38,0.2)",
            borderRadius: "8px", padding: "12px 16px", color: "#EF4444", fontSize: "13px",
          }}>
            {error}
          </div>
        )}

        {summary && (
          <>
            {/* Stats */}
            <div style={{
              display:             "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap:                 "14px",
              marginBottom:        "28px",
            }}>
              <StatCard label="Total movimientos" value={summary.totalBankMovements} color="#0F2A3D" />
              <StatCard label="Pendientes"         value={summary.pending}            color="#D97706" />
              <StatCard label="Conciliados"        value={summary.matched}            color="#16A34A" />
              <StatCard label="Ignorados"          value={summary.ignored}            color="#64748B" />
            </div>

            {/* Accesos rápidos */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "28px",
            }}>
              <QuickLink
                href="/import/bank"
                label="Importar cartola"
                description="Sube un archivo PDF o XLSX de tu banco."
                icon="📥"
              />
              <QuickLink
                href="/importaciones"
                label="Importaciones"
                description={summary.pending > 0
                  ? `${summary.pending} movimiento${summary.pending !== 1 ? "s" : ""} pendiente${summary.pending !== 1 ? "s" : ""} por revisar.`
                  : "Confirma, rechaza o concilia tus importaciones."}
                icon="📋"
              />
            </div>

            {/* Últimas importaciones */}
            {summary.uploads.length > 0 && (
              <div style={{
                background:   "#FFFFFF",
                border:       "1px solid #E2E8F0",
                borderRadius: "14px",
                overflow:     "hidden",
              }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#0F2A3D" }}>
                    Últimas importaciones
                  </p>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC" }}>
                      {["Banco", "Archivo", "Importados", "Errores", "Fecha"].map(h => (
                        <th key={h} style={{
                          padding: "10px 16px", textAlign: "left", fontSize: "11px",
                          fontWeight: 700, color: "#94A3B8", textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {summary.uploads.map((u, i) => (
                      <tr key={u.id} style={{ borderTop: i > 0 ? "1px solid #F1F5F9" : "none" }}>
                        <td style={{ padding: "12px 16px", color: "#334155", fontWeight: 500 }}>
                          {u.bankName ?? "—"}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748B", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {u.fileName}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#16A34A", fontWeight: 600 }}>
                          {u.importedRows}
                        </td>
                        <td style={{ padding: "12px 16px", color: u.errorRows > 0 ? "#EF4444" : "#94A3B8" }}>
                          {u.errorRows}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#94A3B8" }}>
                          {formatDate(u.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {summary.uploads.length === 0 && (
              <div style={{
                background: "#F8FAFC", border: "1px dashed #CBD5E1",
                borderRadius: "12px", padding: "32px 24px", textAlign: "center",
              }}>
                <p style={{ margin: 0, fontSize: "14px", color: "#94A3B8" }}>
                  Aún no has importado ninguna cartola.{" "}
                  <Link href="/import/bank" style={{ color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>
                    Importar ahora →
                  </Link>
                </p>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background:   "#FFFFFF",
      border:       "1px solid #E2E8F0",
      borderRadius: "12px",
      padding:      "18px 20px",
    }}>
      <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      <p style={{ margin: "8px 0 0", fontSize: "28px", fontWeight: 700, color, lineHeight: 1 }}>
        {value.toLocaleString("es-CL")}
      </p>
    </div>
  );
}

function QuickLink({ href, label, description, icon }: {
  href:        string;
  label:       string;
  description: string;
  icon:        string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        background:   "#FFFFFF",
        border:       "1px solid #E2E8F0",
        borderRadius: "12px",
        padding:      "18px 20px",
        display:      "flex",
        gap:          "14px",
        alignItems:   "flex-start",
        cursor:       "pointer",
        transition:   "border-color 0.15s, box-shadow 0.15s",
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#93C5FD";
          (e.currentTarget as HTMLDivElement).style.boxShadow  = "0 2px 8px rgba(37,99,235,0.08)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#E2E8F0";
          (e.currentTarget as HTMLDivElement).style.boxShadow  = "none";
        }}
      >
        <span style={{ fontSize: "22px", lineHeight: 1, marginTop: "2px" }}>{icon}</span>
        <div>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0F2A3D" }}>{label}</p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748B" }}>{description}</p>
        </div>
      </div>
    </Link>
  );
}
