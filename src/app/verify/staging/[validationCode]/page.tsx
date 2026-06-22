"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Verification = {
  validationCode: string;
  action:         string;
  actorEmail:     string | null;
  beforeStatus:   string | null;
  afterStatus:    string | null;
  decisionHash:   string;
  hashValid:      boolean;
  createdAt:      string;
  metadata:       Record<string, unknown>;
};

type ApiResponse<T> = { ok: boolean; message: string; data: T };

const ACTION_LABELS: Record<string, string> = {
  BINANCE_IMPORT_CONFIRMED: "Importación confirmada",
  BINANCE_IMPORT_REJECTED:  "Importación rechazada",
  BANK_MATCH_CONFIRMED:     "Conciliación bancaria confirmada",
  BANK_IMPORT_REJECTED:     "Movimiento bancario ignorado",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "Pendiente",
  REVIEW:    "En revisión",
  CONFIRMED: "Confirmado",
  REJECTED:  "Rechazado",
  IMPORTED:  "Importado",
  MATCHED:   "Conciliado",
  IGNORED:   "Ignorado",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function VerifyStagingPage() {
  const params = useParams<{ validationCode: string }>();
  const [data,    setData]    = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!params.validationCode) return;
    void (async () => {
      try {
        const res  = await fetch(`/api/verify/staging/${encodeURIComponent(params.validationCode)}`);
        const json = await res.json() as ApiResponse<Verification>;
        if (!res.ok || !json.ok) throw new Error(json.message);
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al verificar.");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.validationCode]);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
      <div style={{ width: "100%", maxWidth: "600px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <p style={{ fontSize: "22px", fontWeight: 800, color: "#0F2A3D", margin: 0 }}>LEDGERA</p>
          </Link>
          <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>Verificación de decisión</p>
        </div>

        {loading && (
          <div style={{ background: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "40px", textAlign: "center" }}>
            <p style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>Verificando código...</p>
          </div>
        )}

        {error && (
          <div style={{ background: "#FFFFFF", borderRadius: "16px", border: "1px solid #FCA5A5", padding: "32px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
            <p style={{ fontWeight: 700, color: "#DC2626", margin: 0 }}>{error}</p>
            <p style={{ fontSize: "13px", color: "#94A3B8", marginTop: "8px" }}>
              El código de validación no existe o expiró.
            </p>
          </div>
        )}

        {data && (
          <div style={{ background: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden" }}>

            {/* Hash status banner */}
            <div style={{
              background:  data.hashValid ? "#F0FDF4" : "#FFF7ED",
              borderBottom: `2px solid ${data.hashValid ? "#86EFAC" : "#FCA5A5"}`,
              padding:     "16px 24px",
              display:     "flex",
              alignItems:  "center",
              gap:         "12px",
            }}>
              <span style={{ fontSize: "24px" }}>{data.hashValid ? "✅" : "⚠️"}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: data.hashValid ? "#16A34A" : "#EA580C" }}>
                  {data.hashValid ? "Hash verificado — decisión íntegra" : "Hash no coincide — datos modificados"}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                  Código: {data.validationCode}
                </p>
              </div>
            </div>

            {/* Details */}
            <div style={{ padding: "24px" }}>
              <Row label="Acción"       value={ACTION_LABELS[data.action] ?? data.action} />
              <Row label="Fecha"        value={formatDate(data.createdAt)} />
              {data.actorEmail && (
                <Row label="Actor" value={`${data.actorEmail.slice(0, 3)}${"*".repeat(Math.max(0, data.actorEmail.indexOf("@") - 3))}${data.actorEmail.slice(data.actorEmail.indexOf("@"))}`} />
              )}
              {data.beforeStatus && (
                <Row label="Estado anterior" value={STATUS_LABELS[data.beforeStatus] ?? data.beforeStatus} />
              )}
              {data.afterStatus && (
                <Row label="Estado resultante" value={STATUS_LABELS[data.afterStatus] ?? data.afterStatus} />
              )}
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #F1F5F9" }}>
                <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", fontFamily: "monospace", wordBreak: "break-all" }}>
                  {data.decisionHash}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #F8FAFC", gap: "12px" }}>
      <span style={{ fontSize: "13px", color: "#94A3B8", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "13px", color: "#0F2A3D", fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}
