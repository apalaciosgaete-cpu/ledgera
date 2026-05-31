"use client";

import { useEffect, useState } from "react";

import { colors, fonts } from "@/styles/tokens";

type TwoFAStep = "idle" | "setup" | "active" | "disable";

function normalizeCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export default function SeguridadPage() {
  const [step, setStep] = useState<TwoFAStep>("idle");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadStatus() {
      try {
        const response = await fetch("/api/2fa/status", { cache: "no-store" });
        const json = await response.json();

        if (!mounted) return;

        const isEnabled = Boolean(json.enabled);
        setEnabled(isEnabled);
        setStep(isEnabled ? "active" : "idle");
      } catch {
        if (mounted) {
          setError("No fue posible obtener el estado de seguridad.");
        }
      } finally {
        if (mounted) {
          setInitialLoading(false);
        }
      }
    }

    void loadStatus();

    return () => {
      mounted = false;
    };
  }, []);

  async function startSetup() {
    setLoading(true);
    setError("");
    setSuccess("");
    setCode("");

    try {
      const response = await fetch("/api/2fa/setup", { cache: "no-store" });
      const json = await response.json();

      if (!json.ok) {
        throw new Error(json.message ?? "No fue posible generar el QR.");
      }

      setQrCode(String(json.qrCode ?? ""));
      setSecret(String(json.secret ?? ""));
      setStep("setup");
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : "No fue posible generar el QR.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup() {
    if (code.length !== 6) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await response.json();

      if (!json.ok) {
        throw new Error(json.message ?? "Código inválido.");
      }

      setEnabled(true);
      setStep("active");
      setCode("");
      setSuccess("Autenticación en dos factores activada correctamente.");
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Código inválido.");
    } finally {
      setLoading(false);
    }
  }

  async function disable2FA() {
    if (code.length !== 6) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await response.json();

      if (!json.ok) {
        throw new Error(json.message ?? "Código inválido.");
      }

      setEnabled(false);
      setStep("idle");
      setCode("");
      setQrCode("");
      setSecret("");
      setSuccess("Autenticación en dos factores desactivada correctamente.");
    } catch (disableError) {
      setError(disableError instanceof Error ? disableError.message : "Código inválido.");
    } finally {
      setLoading(false);
    }
  }

  const actionButtonStyle = {
    border: "none",
    borderRadius: "10px",
    background: colors.accent,
    color: "#FFFFFF",
    cursor: loading ? "not-allowed" : "pointer",
    fontFamily: fonts.body,
    fontSize: "14px",
    fontWeight: 800,
    padding: "12px 18px",
  };

  const secondaryButtonStyle = {
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    background: "transparent",
    color: "#475569",
    cursor: "pointer",
    fontFamily: fonts.body,
    fontSize: "14px",
    fontWeight: 700,
    padding: "12px 18px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <section>
        <h1 style={{ color: "#0F2A3D", fontFamily: fonts.display, fontSize: "28px", margin: "0 0 8px" }}>
          Seguridad de cuenta
        </h1>
        <p style={{ color: "#475569", fontSize: "14px", margin: 0 }}>
          Activa 2FA con Google Authenticator, Microsoft Authenticator, Authy u otra aplicación TOTP compatible.
        </p>
      </section>

      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "24px", maxWidth: "680px" }}>
        <div style={{ alignItems: "flex-start", display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }}>
          <div>
            <h2 style={{ color: "#0F2A3D", fontFamily: fonts.display, fontSize: "18px", margin: "0 0 6px" }}>
              Autenticación en dos factores
            </h2>
            <p style={{ color: "#64748B", fontSize: "13px", lineHeight: 1.5, margin: 0 }}>
              Al iniciar sesión, LEDGERA solicitará tu contraseña y luego un código temporal de 6 dígitos.
            </p>
          </div>

          <span style={{
            background: enabled ? "rgba(22,163,74,0.12)" : "rgba(100,116,139,0.12)",
            border: enabled ? "1px solid rgba(22,163,74,0.24)" : "1px solid rgba(100,116,139,0.24)",
            borderRadius: "999px",
            color: enabled ? "#15803D" : "#64748B",
            fontSize: "12px",
            fontWeight: 800,
            padding: "6px 12px",
            whiteSpace: "nowrap",
          }}>
            {enabled ? "Activo" : "Inactivo"}
          </span>
        </div>

        {initialLoading && (
          <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>Cargando estado de seguridad...</p>
        )}

        {error && (
          <p style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: "10px", color: "#DC2626", fontSize: "13px", margin: "0 0 16px", padding: "10px 12px" }}>
            {error}
          </p>
        )}

        {success && (
          <p style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.18)", borderRadius: "10px", color: "#15803D", fontSize: "13px", margin: "0 0 16px", padding: "10px 12px" }}>
            {success}
          </p>
        )}

        {!initialLoading && step === "idle" && (
          <button type="button" onClick={startSetup} disabled={loading} style={actionButtonStyle}>
            {loading ? "Generando QR..." : "Activar 2FA"}
          </button>
        )}

        {step === "setup" && qrCode && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ alignItems: "center", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "14px", padding: "20px" }}>
              <p style={{ color: "#475569", fontSize: "13px", margin: 0, textAlign: "center" }}>
                Escanea este QR con tu aplicación autenticadora.
              </p>
              <img src={qrCode} alt="Código QR para activar 2FA" style={{ background: "#FFFFFF", borderRadius: "12px", height: "196px", padding: "10px", width: "196px" }} />
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "10px 12px", textAlign: "center", width: "100%" }}>
                <p style={{ color: "#64748B", fontSize: "12px", margin: "0 0 6px" }}>Clave manual</p>
                <code style={{ color: "#0F2A3D", fontSize: "13px", letterSpacing: "0.08em", wordBreak: "break-all" }}>{secret}</code>
              </div>
            </div>

            <div>
              <label style={{ color: "#475569", display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
                Código de 6 dígitos
              </label>
              <input
                autoFocus
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => setCode(normalizeCode(event.target.value))}
                placeholder="000000"
                value={code}
                style={{ border: "1px solid #CBD5E1", borderRadius: "10px", color: "#0F2A3D", fontFamily: "monospace", fontSize: "24px", fontWeight: 800, letterSpacing: "0.32em", padding: "10px 12px", textAlign: "center", width: "180px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" onClick={confirmSetup} disabled={loading || code.length < 6} style={{ ...actionButtonStyle, opacity: code.length < 6 ? 0.58 : 1 }}>
                {loading ? "Verificando..." : "Confirmar y activar"}
              </button>
              <button type="button" onClick={() => { setStep("idle"); setCode(""); setError(""); }} style={secondaryButtonStyle}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {step === "active" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.18)", borderRadius: "10px", color: "#15803D", fontSize: "13px", padding: "12px 14px" }}>
              Tu cuenta ya está protegida con 2FA.
            </div>
            <button type="button" onClick={() => { setStep("disable"); setCode(""); setError(""); }} style={{ ...secondaryButtonStyle, borderColor: "rgba(220,38,38,0.28)", color: "#DC2626" }}>
              Desactivar 2FA
            </button>
          </div>
        )}

        {step === "disable" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <p style={{ color: "#B45309", fontSize: "13px", margin: 0 }}>
              Ingresa el código actual de tu app autenticadora para desactivar 2FA.
            </p>
            <input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setCode(normalizeCode(event.target.value))}
              placeholder="000000"
              value={code}
              style={{ border: "1px solid #CBD5E1", borderRadius: "10px", color: "#0F2A3D", fontFamily: "monospace", fontSize: "24px", fontWeight: 800, letterSpacing: "0.32em", padding: "10px 12px", textAlign: "center", width: "180px" }}
            />
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" onClick={disable2FA} disabled={loading || code.length < 6} style={{ ...actionButtonStyle, background: "#DC2626", opacity: code.length < 6 ? 0.58 : 1 }}>
                {loading ? "Desactivando..." : "Confirmar desactivación"}
              </button>
              <button type="button" onClick={() => { setStep("active"); setCode(""); setError(""); }} style={secondaryButtonStyle}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
