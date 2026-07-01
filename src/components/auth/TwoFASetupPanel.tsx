"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/modules/identity/client/authContext";
import { fonts } from "@/styles/tokens";

export default function TwoFASetupPanel() {
  const { refreshUser } = useAuth();
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  function loadQr(regenerate = false) {
    setLoading(true);
    setError("");
    const url = regenerate ? "/api/2fa/setup?regenerate=1" : "/api/2fa/setup";
    fetch(url, { credentials: "include" })
      .then(r => r.json())
      .then(json => {
        if (json.ok) {
          setQrCode(json.qrCode ?? "");
          setSecret(json.secret ?? "");
        } else {
          setError(json.message || "Error al cargar configuración 2FA");
        }
      })
      .catch(() => setError("Error de red al cargar 2FA"))
      .finally(() => { setLoading(false); setRegenerating(false); });
  }

  useEffect(() => { loadQr(); }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setVerifying(true);
    try {
      const res = await fetch("/api/2fa/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (json.ok) {
        setSuccess(true);
        await refreshUser();
      } else {
        setError(json.message || "Código incorrecto");
      }
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: "12px", padding: "2rem", textAlign: "center" }}>
        <div style={{ width: "28px", height: "28px", border: "2px solid var(--border)", borderTop: "2px solid var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: "13px", color: "var(--text)", margin: 0 }}>Preparando configuración de seguridad...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: "12px", padding: "1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "18px", margin: "0 0 8px" }}>✅</p>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--accent)", margin: "0 0 4px" }}>2FA activado correctamente</p>
        <p style={{ fontSize: "13px", color: "var(--text)", margin: 0 }}>Tu cuenta está protegida. Ya puedes navegar por LEDGERA.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <h3 style={{ fontFamily: fonts.display, fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0 }}>Configurar verificación en dos pasos</h3>
        <button
          type="button"
          onClick={() => { setRegenerating(true); loadQr(true); }}
          disabled={regenerating}
          style={{ background: "transparent", border: "none", color: "var(--accent)", fontSize: "12px", fontWeight: 600, cursor: regenerating ? "not-allowed" : "pointer", textDecoration: "underline", padding: 0 }}
        >
          {regenerating ? "Generando..." : "Generar nuevo QR"}
        </button>
      </div>
      <p style={{ fontSize: "12px", color: "var(--text)", margin: "0 0 1.25rem" }}>Escanea el código QR con tu app de autenticación y luego ingresa el código de 6 dígitos.</p>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "8px", padding: "10px 12px", marginBottom: "1rem" }}>
          <p style={{ fontSize: "13px", color: "var(--loss)", margin: 0, fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {qrCode && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginBottom: "1.25rem" }}>
          <img src={qrCode} alt="Código QR 2FA" style={{ width: "180px", height: "180px", borderRadius: "10px", background: "#fff", padding: "8px", border: "1px solid var(--border)" }} />
          <code style={{ color: "var(--text)", fontSize: "11px", letterSpacing: "0.05em", wordBreak: "break-all", background: "var(--bg-sunken)", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border)" }}>{secret}</code>
        </div>
      )}

      <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Código de 6 dígitos</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px", color: "var(--text)", fontSize: "14px", fontFamily: fonts.body, outline: "none", width: "100%", boxSizing: "border-box", letterSpacing: "0.1em" }}
          />
        </div>
        <button
          type="submit"
          disabled={verifying || code.length !== 6}
          style={{
            padding: "10px 20px", borderRadius: "8px", border: "none",
            background: verifying ? "#3FA687" : code.length === 6 ? "#3FA687" : "var(--border-strong)",
            color: "var(--text)", fontSize: "13px", fontWeight: 700,
            cursor: verifying || code.length !== 6 ? "not-allowed" : "pointer",
            fontFamily: fonts.body,
          }}
        >
          {verifying ? "Verificando..." : "Activar 2FA"}
        </button>
      </form>
    </div>
  );
}
