"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type EvidenceItem = {
  id: string;
  taxYear: number;
  type: string;
  status: string;
  statusText: string;
  statusColor: string;
  statusBg: string;
  hash: string;
  hashShort: string;
  verifyUrl: string;
  generatedAt: string;
  confirmedAt: string | null;
  voidedAt: string | null;
};

type EvidenceData = {
  evidence: EvidenceItem[];
  publicVerifyUrl: string;
  total: number;
  confirmedCount: number;
  voidedCount: number;
};

export default function EvidenciaPage() {
  const [data, setData] = useState<EvidenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tax/evidence", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo cargar la evidencia.");
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando evidencia.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  function copyToClipboard(text: string, id: string) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Centro de evidencia</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Demuestra tu evidencia</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Hash, verificación pública e integridad de cada declaración tributaria.
          </p>
        </div>
        <Link href="/mi-situacion" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver al centro tributario
        </Link>
      </section>

      {loading ? (
        <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando evidencia...</p>
      ) : error ? (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>
          {error}
        </div>
      ) : data ? (
        <>
          {data.total > 0 && (
            <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: 24 }}>
              <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16, textAlign: "center" }}>
                <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Total</p>
                <p style={{ color: "#0F2A3D", fontSize: "1.6rem", fontWeight: 850, lineHeight: 1.15, margin: 0 }}>{data.total}</p>
              </article>
              <article style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, padding: 16, textAlign: "center" }}>
                <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Confirmadas</p>
                <p style={{ color: "#166534", fontSize: "1.6rem", fontWeight: 850, lineHeight: 1.15, margin: 0 }}>{data.confirmedCount}</p>
              </article>
              <article style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: 16, textAlign: "center" }}>
                <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Anuladas</p>
                <p style={{ color: "#991B1B", fontSize: "1.6rem", fontWeight: 850, lineHeight: 1.15, margin: 0 }}>{data.voidedCount}</p>
              </article>
            </section>
          )}

          {data.evidence.length === 0 ? (
            <section style={{ background: "#FFFFFF", border: "1px dashed #CBD5E1", borderRadius: 8, padding: 28, textAlign: "center" }}>
              <h2 style={{ color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Sin evidencia registrada</h2>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: "0 auto 16px", maxWidth: 520 }}>
                Las declaraciones se generan automáticamente. Cuando existan, podrás ver su hash y verificar su integridad públicamente.
              </p>
            </section>
          ) : (
            <section style={{ display: "grid", gap: 16, marginBottom: 24 }}>
              {data.evidence.map((item) => (
                <article key={item.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 20 }}>
                  <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                    <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: 0 }}>{item.type} — {item.taxYear}</h3>
                    <span style={{ alignItems: "center", background: item.statusBg, borderRadius: 999, color: item.statusColor, display: "inline-flex", fontSize: 11, fontWeight: 800, height: 24, padding: "0 10px" }}>
                      {item.statusText}
                    </span>
                  </div>

                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, marginBottom: 12, padding: "10px 12px" }}>
                    <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 4px", textTransform: "uppercase" }}>Hash de integridad</p>
                    <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <code style={{ color: "#0F2A3D", fontFamily: "monospace", fontSize: 13 }}>{item.hashShort}</code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.hash, item.id)}
                        style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 6, color: "#475569", cursor: "pointer", fontSize: 12, fontWeight: 750, padding: "4px 10px" }}
                      >
                        {copied === item.id ? "Copiado" : "Copiar hash"}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <a
                      href={item.verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ background: "#0F766E", borderRadius: 6, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "8px 14px", textDecoration: "none" }}
                    >
                      Verificar públicamente →
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`${window.location.origin}${item.verifyUrl}`, `${item.id}-url`)}
                      style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 6, color: "#475569", cursor: "pointer", fontSize: 13, fontWeight: 750, padding: "8px 14px" }}
                    >
                      {copied === `${item.id}-url` ? "Copiado" : "Copiar link"}
                    </button>
                  </div>
                </article>
              ))}
            </section>
          )}

          <section style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 8, padding: 18 }}>
            <h2 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 10px" }}>¿Cómo funciona la verificación?</h2>
            <ol style={{ color: "#475569", fontSize: 14, lineHeight: 1.6, margin: 0, paddingLeft: 18 }}>
              <li>Cada declaración genera un hash único SHA-256.</li>
              <li>El hash se incluye en el PDF y en el código QR.</li>
              <li>Cualquier persona puede verificar la declaración en el link público.</li>
              <li>Si el contenido cambia, el hash ya no coincide y la verificación falla.</li>
            </ol>
          </section>
        </>
      ) : null}
    </div>
  );
}
