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
    <div style={{ minHeight: "100vh", background: "var(--bg-sunken)", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
      <div style={{ width: "100%", maxWidth: "600px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <p style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)", margin: 0 }}>LEDGERA</p>
          </Link>
          <p style={{ fontSize: "13px", color: "var(--text-soft)", marginTop: "4px" }}>Verificación de decisión</p>
        </div>

        {loading && (
          <div style={{ background: "var(--bg-elev)", borderRadius: "16px", border: "1px solid var(--border)", padding: "40px", textAlign: "center" }}>
            <p style={{ color: "var(--text-soft)", fontSize: "14px", margin: 0 }}>Verificando código...</p>
          </div>
        )}

        {error && (
          <div style={{ background: "var(--bg-elev)", borderRadius: "16px", border: "1px solid var(--loss)", padding: "32px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
            <p style={{ fontWeight: 700, color: "var(--loss)", margin: 0 }}>{error}</p>
            <p style={{ fontSize: "13px", color: "var(--text-soft)", marginTop: "8px" }}>
              El código de validación no existe o expiró.
            </p>
          </div>
        )}

        {data && (
          <div style={{ background: "var(--bg-elev)", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden" }}>

            {/* Hash status banner */}
            <div style={{
              background: data.hashValid ? "var(--accent-soft)" : "var(--bg-elev)",
              borderBottom: `2px solid ${data.hashValid ? "#3FA687" : "#C4634A"}`,
              padding:     "16px 24px",
              display:     "flex",
              alignItems:  "center",
              gap:         "12px",
            }}>
              <span style={{ fontSize: "24px" }}>{data.hashValid ? "✅" : "⚠️"}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: data.hashValid ? "var(--accent)" : "var(--text-soft)" }}>
                  {data.hashValid ? "Hash verificado — decisión íntegra" : "Hash no coincide — datos modificados"}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-soft)", marginTop: "2px" }}>
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
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                <p style={{ margin: 0, fontSize: "11px", color: "var(--text-soft)", fontFamily: "monospace", wordBreak: "break-all" }}>
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
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid var(--border)", gap: "12px" }}>
      <span style={{ fontSize: "13px", color: "var(--text-soft)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "13px", color: "var(--text)", fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}
