"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Feature } from "@/modules/subscription/domain/planFeatures";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { UpgradeCard } from "@/components/subscription/UpgradeCard";

type Tab = "evidencia" | "reportes";

/* ──────────────── Evidencia types ──────────────── */
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

/* ──────────────── Verificación types ──────────────── */
type Validation = {
  id: string;
  hash: string;
  type: string;
  typeLabel: string;
  isValid: boolean;
  issuedAt: string;
  year: number;
  symbol: string | null;
  revokedAt: string | null;
};

type ValidationsData = {
  year: number;
  validations: Validation[];
};

/* ──────────────── Page ──────────────── */
export default function ExpertoVerificacionesPage() {
  return (
    <FeatureGate
      feature={Feature.VERIFICATIONS}
      source="experto_verificaciones"
      fallback={
        <div style={{ maxWidth: 1180, width: "100%", display: "flex", justifyContent: "center", paddingTop: 40 }}>
          <UpgradeCard feature={Feature.VERIFICATIONS} source="experto_verificaciones" />
        </div>
      }
    >
      <ExpertoVerificacionesContent />
    </FeatureGate>
  );
}

function ExpertoVerificacionesContent() {
  const [tab, setTab] = useState<Tab>("evidencia");

  /* Evidencia state */
  const [evData, setEvData] = useState<EvidenceData | null>(null);
  const [evLoading, setEvLoading] = useState(true);
  const [evError, setEvError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  /* Verificación state */
  const currentYear = new Date().getFullYear();
  const [valYear, setValYear] = useState(currentYear);
  const [valData, setValData] = useState<ValidationsData | null>(null);
  const [valLoading, setValLoading] = useState(true);
  const [valError, setValError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /* Load evidencia */
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tax/evidence", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo cargar la evidencia.");
        setEvData(json.data);
      } catch (err) {
        setEvError(err instanceof Error ? err.message : "Error cargando evidencia.");
      } finally {
        setEvLoading(false);
      }
    }
    void load();
  }, []);

  /* Load verificaciones */
  async function loadValidations() {
    setValLoading(true);
    setValError("");
    try {
      const res = await fetch(`/api/report-validations?year=${valYear}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Error cargando verificaciones.");
      setValData(json.data);
    } catch (err) {
      setValError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setValLoading(false);
    }
  }

  useEffect(() => {
    void loadValidations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valYear]);

  function copyToClipboard(text: string, id: string) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  async function copyLink(id: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* noop */ }
  }

  const tabBtn = (key: Tab, label: string) => {
    const active = tab === key;
    return (
      <button
        key={key}
        onClick={() => setTab(key)}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: "none",
          background: active ? "rgba(22,163,74,0.18)" : "transparent",
          color: active ? "#4ADE80" : "#94A3B8",
          fontSize: 13,
          fontWeight: active ? 700 : 500,
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Modo Experto</p>
          <h1 style={{ color: "#F8FAFC", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Verificaciones</h1>
          <p style={{ color: "#94A3B8", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Evidencia tributaria, hashes y verificación pública de reportes.
          </p>
        </div>
        <Link href="/experto" style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#F8FAFC", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver a Experto
        </Link>
      </section>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
        {tabBtn("evidencia", "Evidencia tributaria")}
        {tabBtn("reportes", "Verificación de reportes")}
      </div>

      {tab === "evidencia" && (
        <>
          {evLoading ? (
            <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando evidencia…</p>
          ) : evError ? (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{evError}</div>
          ) : evData ? (
            <>
              {evData.total > 0 && (
                <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: 24 }}>
                  <article style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 16, textAlign: "center" }}>
                    <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Total</p>
                    <p style={{ color: "#F8FAFC", fontSize: "1.6rem", fontWeight: 850, lineHeight: 1.15, margin: 0 }}>{evData.total}</p>
                  </article>
                  <article style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 8, padding: 16, textAlign: "center" }}>
                    <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Confirmadas</p>
                    <p style={{ color: "#4ADE80", fontSize: "1.6rem", fontWeight: 850, lineHeight: 1.15, margin: 0 }}>{evData.confirmedCount}</p>
                  </article>
                  <article style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, padding: 16, textAlign: "center" }}>
                    <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Anuladas</p>
                    <p style={{ color: "#F87171", fontSize: "1.6rem", fontWeight: 850, lineHeight: 1.15, margin: 0 }}>{evData.voidedCount}</p>
                  </article>
                </section>
              )}

              {evData.evidence.length === 0 ? (
                <section style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 8, padding: 28, textAlign: "center" }}>
                  <h2 style={{ color: "#F8FAFC", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Sin evidencia registrada</h2>
                  <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.55, margin: "0 auto", maxWidth: 520 }}>Las declaraciones se generan automáticamente. Cuando existan, podrás ver su hash y verificar su integridad públicamente.</p>
                </section>
              ) : (
                <>
                  <section style={{ display: "grid", gap: 16, marginBottom: 24 }}>
                    {evData.evidence.map((item) => (
                      <article key={item.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 20 }}>
                        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                          <h3 style={{ color: "#F8FAFC", fontSize: "1rem", fontWeight: 850, margin: 0 }}>{item.type} — {item.taxYear}</h3>
                          <span style={{ alignItems: "center", background: item.statusBg, borderRadius: 999, color: item.statusColor, display: "inline-flex", fontSize: 11, fontWeight: 800, height: 24, padding: "0 10px" }}>
                            {item.statusText}
                          </span>
                        </div>
                        <div style={{ background: "#0B1D2C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, marginBottom: 12, padding: "10px 12px" }}>
                          <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 4px", textTransform: "uppercase" }}>Hash de integridad</p>
                          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8 }}>
                            <code style={{ color: "#F8FAFC", fontFamily: "monospace", fontSize: 13 }}>{item.hashShort}</code>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(item.hash, item.id)}
                              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: "#CBD5E1", cursor: "pointer", fontSize: 12, fontWeight: 750, padding: "4px 10px" }}
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
                            onClick={() => copyToClipboard(`${typeof window !== "undefined" ? window.location.origin : "https://ledgera.cl"}${item.verifyUrl}`, `${item.id}-url`)}
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: "#CBD5E1", cursor: "pointer", fontSize: 13, fontWeight: 750, padding: "8px 14px" }}
                          >
                            {copied === `${item.id}-url` ? "Copiado" : "Copiar link"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </section>

                  <section style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 18 }}>
                    <h2 style={{ color: "#F8FAFC", fontSize: "1rem", fontWeight: 850, margin: "0 0 10px" }}>¿Cómo funciona la verificación?</h2>
                    <ol style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.6, margin: 0, paddingLeft: 18 }}>
                      <li>Cada declaración genera un hash único SHA-256.</li>
                      <li>El hash se incluye en el PDF y en el código QR.</li>
                      <li>Cualquier persona puede verificar la declaración en el link público.</li>
                      <li>Si el contenido cambia, el hash ya no coincide y la verificación falla.</li>
                    </ol>
                  </section>
                </>
              )}
            </>
          ) : null}
        </>
      )}

      {tab === "reportes" && (
        <>
          <section style={{ alignItems: "end", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 20, padding: 16 }}>
            <label style={{ color: "#94A3B8", display: "grid", fontSize: 13, fontWeight: 750, gap: 6 }}>
              Año
              <select value={valYear} onChange={(e) => setValYear(Number(e.target.value))} style={{ background: "#0B1D2C", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#F8FAFC", minHeight: 40, padding: "0 10px" }}>
                <option value={currentYear}>{currentYear}</option>
                <option value={currentYear - 1}>{currentYear - 1}</option>
                <option value={currentYear - 2}>{currentYear - 2}</option>
              </select>
            </label>
          </section>

          {valLoading && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando verificaciones…</p>}
          {valError && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{valError}</div>}

          {!valLoading && valData && (
            <>
              {valData.validations.length === 0 ? (
                <section style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 8, padding: 28, textAlign: "center" }}>
                  <h2 style={{ color: "#F8FAFC", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Sin verificaciones para {valYear}</h2>
                  <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.55, margin: 0 }}>Las verificaciones se generan al descargar reportes con hash.</p>
                </section>
              ) : (
                <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {valData.validations.map((v) => {
                    const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : "https://ledgera.cl"}/verify/report/${v.hash}`;
                    return (
                      <div key={v.id} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${v.isValid ? "rgba(255,255,255,0.08)" : "rgba(220,38,38,0.25)"}`, borderRadius: 10, padding: "1rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: "200px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                              <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 700, background: v.isValid ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)", color: v.isValid ? "#4ADE80" : "#F87171" }}>
                                {v.isValid ? "Válido" : "Revocado"}
                              </span>
                              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#F8FAFC" }}>{v.typeLabel}</span>
                            </div>
                            <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "#94A3B8" }}>Emitido: {new Date(v.issuedAt).toLocaleDateString("es-CL")}{v.symbol ? ` · Activo: ${v.symbol}` : ""} · Año: {v.year}</p>
                            <p style={{ margin: 0, fontFamily: "monospace", fontSize: "0.75rem", color: "#64748B", wordBreak: "break-all" }}>{v.hash}</p>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                            <a href={verifyUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "0.4rem 1rem", borderRadius: "8px", background: "#0F2A3D", color: "#ffffff", fontSize: "0.8125rem", fontWeight: 600, textDecoration: "none", textAlign: "center", whiteSpace: "nowrap" }}>
                              Ver verificación
                            </a>
                            <button onClick={() => copyLink(v.id, verifyUrl)} style={{ background: copiedId === v.id ? "rgba(22,163,74,0.12)" : "rgba(255,255,255,0.06)", border: `1px solid ${copiedId === v.id ? "rgba(22,163,74,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: "8px", padding: "0.4rem 1rem", fontSize: "0.8125rem", fontWeight: 600, color: copiedId === v.id ? "#4ADE80" : "#94A3B8", cursor: "pointer", whiteSpace: "nowrap" }}>
                              {copiedId === v.id ? "Copiado" : "Copiar enlace"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

