"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/modules/identity/client/authContext";
import { colors, fonts } from "@/styles/tokens";

type SettingsMap = Record<string, string>;
type AuditEntry = {
  id:         string;
  settingKey: string;
  oldValue:   string | null;
  newValue:   string;
  actorEmail: string | null;
  createdAt:  string;
};
type Section = "tributario" | "persona" | "empresa" | "seguridad" | "auditoria";
type TwoFAStep = "idle" | "setup" | "confirm" | "active" | "disable";

const ALL_SECTIONS: { key: Section; label: string; description: string; roles: string[]; icon: React.ReactNode }[] = [
  { key: "tributario",    label: "Tributario",    description: "Motor FIFO y reglas SII",       roles: ["admin"],                       icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> },
  { key: "persona",       label: "Persona natural", description: "Identidad del contribuyente", roles: ["admin","personal"],             icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
  { key: "empresa",       label: "Empresa",       description: "Identidad del contribuyente",   roles: ["admin","empresa","contador"],   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg> },
  { key: "seguridad",     label: "Seguridad",     description: "Sesiones y acceso",             roles: ["admin"],                       icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
  { key: "auditoria",     label: "Auditoría",     description: "Registro de cambios",           roles: ["admin"],                       icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> },
];

const SECTION_PREFIX: Record<Section, string> = {
  tributario: "TAX_",
  persona:    "PN_",
  empresa:    "COMPANY_",
  seguridad:  "SECURITY_",
  auditoria:  "",
};

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!value)}
      style={{ width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: disabled ? "not-allowed" : "pointer", background: value ? "#16A34A" : "#CBD5E1", position: "relative", transition: "background 0.2s ease", flexShrink: 0, opacity: disabled ? 0.5 : 1, padding: 0 }}>
      <div style={{ position: "absolute", top: "3px", left: value ? "23px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#ffffff", transition: "left 0.2s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </button>
  );
}

function ToggleRow({ label, hint, value, onChange, badge, disabled }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void; badge?: string; disabled?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1.5rem", padding: "1rem 0", borderBottom: "1px solid #E2E8F0" }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>{label}</span>
          {badge && <span style={{ fontSize: "9px", fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{badge}</span>}
        </div>
        <span style={{ fontSize: "12px", color: "#475569", lineHeight: 1.5 }}>{hint}</span>
      </div>
      <Toggle value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>{label}</label>
      {hint && <span style={{ fontSize: "11px", color: "#475569", lineHeight: 1.4 }}>{hint}</span>}
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", style }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; style?: React.CSSProperties }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "8px", padding: "10px 12px", color: "#0F172A", fontSize: "14px", fontFamily: fonts.body, outline: "none", width: "100%", boxSizing: "border-box", ...style }}
    />
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "8px", padding: "10px 12px", color: "#0F172A", fontSize: "14px", fontFamily: fonts.body, outline: "none", width: "100%", cursor: "pointer" }}>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
}

function SectionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "1.5rem", marginBottom: "1rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ fontFamily: fonts.display, fontSize: "14px", fontWeight: 700, color: "#0F2A3D", margin: "0 0 4px" }}>{title}</h3>
        <p style={{ fontSize: "12px", color: "#475569", margin: 0 }}>{description}</p>
      </div>
      {children}
    </div>
  );
}

function SaveBar({ onSave, saving, saved, onReset, error }: { onSave: () => void; saving: boolean; saved: boolean; onReset: () => void; error?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", paddingTop: "1.5rem", marginTop: "0.5rem", borderTop: "1px solid #E2E8F0" }}>
      {saved && <span style={{ fontSize: "13px", color: "#4ADE80", display: "flex", alignItems: "center", gap: "6px" }}><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#4ADE80" strokeWidth="1.2" /><path d="M5 8l2 2 4-4" stroke="#4ADE80" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>Guardado correctamente</span>}
      {error && <span style={{ fontSize: "13px", color: "#EF4444" }}>{error}</span>}
      <button type="button" onClick={onReset} disabled={saving} style={{ padding: "9px 16px", borderRadius: "8px", border: "1px solid #E2E8F0", background: "transparent", color: "#64748B", fontSize: "13px", fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", fontFamily: fonts.body }}>Descartar</button>
      <button type="button" onClick={onSave} disabled={saving} style={{ padding: "9px 20px", borderRadius: "8px", border: "none", background: saving ? "#15803D" : "#16A34A", color: "#ffffff", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: fonts.body }}>
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}

// ─── 2FA Panel ────────────────────────────────────────────────────────────────
function TwoFAPanel() {
  const [step,        setStep]        = useState<TwoFAStep>("idle");
  const [qrCode,      setQrCode]      = useState("");
  const [secret,      setSecret]      = useState("");
  const [code,        setCode]        = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");
  const [is2FAActive, setIs2FAActive] = useState(false);

  // Verificar si 2FA ya está activo
  useEffect(() => {
    fetch("/api/2fa/status")
      .then(r => r.json())
      .then(d => {
        if (d.enabled) { setIs2FAActive(true); setStep("active"); }
      })
      .catch(() => {});
  }, []);

  async function iniciarSetup() {
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/2fa/setup");
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setQrCode(json.qrCode);
      setSecret(json.secret);
      setStep("setup");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar QR");
    } finally {
      setLoading(false);
    }
  }

  async function confirmarActivacion() {
    if (code.length !== 6) return;
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/2fa/verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setIs2FAActive(true);
      setStep("active");
      setSuccess("2FA activado correctamente.");
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Código inválido");
    } finally {
      setLoading(false);
    }
  }

  async function desactivar2FA() {
    if (code.length !== 6) return;
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/2fa/disable", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setIs2FAActive(false);
      setStep("idle");
      setSuccess("2FA desactivado correctamente.");
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Código inválido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "1.5rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem" }}>
        <div>
          <h3 style={{ fontFamily: fonts.display, fontSize: "14px", fontWeight: 700, color: "#0F2A3D", margin: "0 0 4px" }}>
            Autenticación en dos factores (2FA)
          </h3>
          <p style={{ fontSize: "12px", color: "#475569", margin: 0 }}>
            Protege tu cuenta con Google Authenticator u otra app TOTP.
          </p>
        </div>
        <span style={{
          fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px",
          background: is2FAActive ? "rgba(22,163,74,0.12)" : "rgba(100,116,139,0.12)",
          color:      is2FAActive ? "#4ADE80" : "#64748B",
          border:     `1px solid ${is2FAActive ? "rgba(22,163,74,0.25)" : "rgba(100,116,139,0.2)"}`,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}>
          {is2FAActive ? "✓ Activo" : "Inactivo"}
        </span>
      </div>

      {/* Mensajes */}
      {error   && <p style={{ fontSize: "12px", color: "#EF4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "6px", padding: "8px 12px", margin: "0 0 1rem" }}>{error}</p>}
      {success && <p style={{ fontSize: "12px", color: "#4ADE80", background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.15)", borderRadius: "6px", padding: "8px 12px", margin: "0 0 1rem" }}>{success}</p>}

      {/* ESTADO: idle — no activo */}
      {step === "idle" && (
        <button type="button" onClick={iniciarSetup} disabled={loading}
          style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: loading ? "#15803D" : "#16A34A", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: fonts.body }}>
          {loading ? "Generando QR..." : "Activar 2FA"}
        </button>
      )}

      {/* ESTADO: setup — mostrar QR */}
      {step === "setup" && qrCode && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "1.25rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p style={{ fontSize: "13px", color: "#475569", margin: 0, textAlign: "center" }}>
              Escanea este código QR con <strong style={{ color: "#0F2A3D" }}>Google Authenticator</strong> u otra app TOTP
            </p>
            {/* QR Code */}
            <img src={qrCode} alt="QR 2FA" style={{ width: "180px", height: "180px", borderRadius: "8px", background: "#fff", padding: "8px" }} />
            {/* Clave manual */}
            <div style={{ width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "6px", padding: "8px 12px", textAlign: "center" }}>
              <p style={{ fontSize: "11px", color: "#64748B", margin: "0 0 4px" }}>Clave manual (si no puedes escanear)</p>
              <code style={{ fontSize: "13px", color: "#475569", letterSpacing: "0.1em", wordBreak: "break-all" }}>{secret}</code>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "6px" }}>
              Ingresa el código de 6 dígitos para confirmar
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              autoFocus
              style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "8px", padding: "10px 12px", color: "#0F172A", fontSize: "20px", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.3em", textAlign: "center", outline: "none", width: "160px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={confirmarActivacion} disabled={loading || code.length < 6}
              style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: code.length < 6 ? "#334155" : "#16A34A", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: code.length < 6 ? "not-allowed" : "pointer", fontFamily: fonts.body }}>
              {loading ? "Verificando..." : "Confirmar y activar"}
            </button>
            <button type="button" onClick={() => { setStep("idle"); setCode(""); setError(""); }}
              style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #E2E8F0", background: "transparent", color: "#64748B", fontSize: "13px", cursor: "pointer", fontFamily: fonts.body }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ESTADO: active — 2FA activado */}
      {step === "active" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.15)", borderRadius: "8px", padding: "12px 14px", fontSize: "13px", color: "#4ADE80" }}>
            ✓ Tu cuenta está protegida con autenticación en dos factores.
          </div>
          {step === "active" && (
            <div>
              <button type="button" onClick={() => { setStep("disable"); setCode(""); setError(""); }}
                style={{ padding: "9px 16px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#EF4444", fontSize: "13px", cursor: "pointer", fontFamily: fonts.body }}>
                Desactivar 2FA
              </button>
            </div>
          )}
        </div>
      )}

      {/* ESTADO: disable — confirmar desactivación */}
      {step === "disable" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ fontSize: "13px", color: "#F59E0B", margin: 0 }}>
            Ingresa el código de tu app autenticadora para desactivar el 2FA.
          </p>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            autoFocus
            style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "8px", padding: "10px 12px", color: "#0F172A", fontSize: "20px", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.3em", textAlign: "center", outline: "none", width: "160px", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={desactivar2FA} disabled={loading || code.length < 6}
              style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: code.length < 6 ? "#334155" : "#DC2626", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: code.length < 6 ? "not-allowed" : "pointer", fontFamily: fonts.body }}>
              {loading ? "Desactivando..." : "Confirmar desactivación"}
            </button>
            <button type="button" onClick={() => { setStep("active"); setCode(""); setError(""); }}
              style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #E2E8F0", background: "transparent", color: "#64748B", fontSize: "13px", cursor: "pointer", fontFamily: fonts.body }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const role = (user as { role?: string })?.role ?? "personal";
  const SECTIONS = ALL_SECTIONS.filter(s => s.roles.includes(role));
  const searchParams = useSearchParams();

  const [section, setSection] = useState<Section>(() => {
    const s = searchParams.get("s");
    return (s && ALL_SECTIONS.some(sec => sec.key === s) ? s : SECTIONS[0]?.key ?? "empresa") as Section;
  });
  const [settings, setSettings]         = useState<SettingsMap>({});
  const [draft, setDraft]               = useState<SettingsMap>({});
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [saveError, setSaveError]       = useState("");
  const [audit, setAudit]               = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/configuracion");
      if (!res.ok) throw new Error();
      const json = await res.json();
      const values = json.data ?? json;
      setSettings(values);
      setDraft(values);
    } catch (e) {
      console.error("Error cargando configuracion:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await fetch("/api/configuracion/audit");
      if (!res.ok) throw new Error();
      const json = await res.json();
      setAudit(json.data ?? json);
    } catch {
      setAudit([]);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);
  useEffect(() => { if (section === "auditoria") loadAudit(); }, [section, loadAudit]);

  function set(key: string, value: string) {
    setDraft(prev => ({ ...prev, [key]: value }));
    setSaved(false);
    setSaveError("");
  }

  function bool(key: string) { return draft[key] === "true"; }
  function str(key: string)  { return draft[key] ?? ""; }

  function resetSection() {
    setDraft({ ...settings });
    setSaved(false);
    setSaveError("");
  }

  async function saveSection() {
    const prefix = SECTION_PREFIX[section];
    const changed = Object.entries(draft).filter(([key, value]) => key.startsWith(prefix) && value !== settings[key]);
    if (changed.length === 0) { setSaved(true); setTimeout(() => setSaved(false), 2000); return; }
    setSaving(true); setSaved(false); setSaveError("");
    try {
      for (const [key, value] of changed) {
        const res = await fetch("/api/configuracion", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value, role }),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Error al guardar"); }
      }
      setSettings(prev => ({ ...prev, ...Object.fromEntries(changed) }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "12px" }}>
        <div style={{ width: "32px", height: "32px", border: "2px solid #E2E8F0", borderTop: "2px solid #16A34A", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: "#475569", fontSize: "13px" }}>Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>

      {/* Sidebar */}
      <aside style={{ width: "220px", flexShrink: 0, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "8px", position: "sticky", top: "92px" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", padding: "8px 10px 4px", margin: 0 }}>Configuración</p>
        {SECTIONS.map(s => (
          <button key={s.key} type="button" onClick={() => setSection(s.key)}
            style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", borderRadius: "8px", border: "none", background: section === s.key ? "rgba(22,163,74,0.1)" : "transparent", cursor: "pointer", textAlign: "left", color: section === s.key ? "#4ADE80" : "#64748B" }}>
            <span style={{ marginTop: "2px", flexShrink: 0 }}>{s.icon}</span>
            <div>
              <span style={{ display: "block", fontSize: "13px", fontWeight: section === s.key ? 600 : 400, color: section === s.key ? "#4ADE80" : "#94A3B8", fontFamily: fonts.body }}>{s.label}</span>
              <span style={{ display: "block", fontSize: "11px", color: "#334155", lineHeight: 1.3, marginTop: "2px" }}>{s.description}</span>
            </div>
          </button>
        ))}
      </aside>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontFamily: fonts.display, fontSize: "20px", fontWeight: 700, color: "#0F2A3D", margin: "0 0 4px" }}>{SECTIONS.find(s => s.key === section)?.label}</h2>
          <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>{SECTIONS.find(s => s.key === section)?.description}</p>
        </div>

        {/* TRIBUTARIO */}
        {section === "tributario" && (
          <>
            <SectionCard title="Motor FIFO" description="Parámetros de cálculo tributario aplicados a cada movimiento del portafolio">
              <ToggleRow label="FIFO habilitado" hint="Método exigido por el SII para criptomonedas en Chile." value={bool("TAX_FIFO_ENABLED")} onChange={v => set("TAX_FIFO_ENABLED", String(v))} />
              <ToggleRow label="Modo estricto" hint="Bloquea reportes si existen eventos sin clasificar o inconsistencias." value={bool("TAX_STRICT_MODE")} onChange={v => set("TAX_STRICT_MODE", String(v))} />
              <ToggleRow label="Permitir inventario negativo" hint="Desactivado = error duro al vender más de lo disponible (recomendado)." value={bool("TAX_ALLOW_NEGATIVE_INVENTORY")} onChange={v => set("TAX_ALLOW_NEGATIVE_INVENTORY", String(v))} />
              <ToggleRow label="Reconstrucción automática de eventos" hint="Recalcula el inventario FIFO al importar nuevos movimientos." value={bool("TAX_AUTO_REBUILD")} onChange={v => set("TAX_AUTO_REBUILD", String(v))} />
            </SectionCard>
            <SectionCard title="Parámetros monetarios" description="Moneda base y fuente del tipo de cambio">
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <Field label="Moneda base" hint="Siempre CLP para declaraciones SII en Chile.">
                  <SelectInput value={str("TAX_DEFAULT_FIAT")} onChange={v => set("TAX_DEFAULT_FIAT", v)} options={[{ value: "CLP", label: "CLP — Peso Chileno" }]} />
                </Field>
                <Field label="Proveedor FX" hint="Fuente del valor USD/CLP histórico para calcular el mayor valor en pesos.">
                  <SelectInput value={str("TAX_FX_PROVIDER")} onChange={v => set("TAX_FX_PROVIDER", v)} options={[{ value: "mindicador", label: "Mindicador.cl — Banco Central de Chile" }, { value: "manual", label: "Manual — ingreso por período" }]} />
                </Field>
              </div>
            </SectionCard>
            <SaveBar onSave={saveSection} saving={saving} saved={saved} onReset={resetSection} error={saveError} />
          </>
        )}

        {/* PERSONA NATURAL */}
        {section === "persona" && (
          <>
            <SectionCard title="Datos del contribuyente" description="Información personal que aparecerá en los reportes tributarios exportables">
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <Field label="Nombre completo">
                  <TextInput value={str("PN_NOMBRE")} onChange={v => set("PN_NOMBRE", v)} placeholder="Ej: Juan Andrés Pérez González" />
                </Field>
                <Field label="RUT" hint="Con puntos y guión. Ej: 12.345.678-9">
                  <TextInput value={str("PN_RUT")} onChange={v => set("PN_RUT", v)} placeholder="12.345.678-9" />
                </Field>
                <Field label="Dirección">
                  <TextInput value={str("PN_DIRECCION")} onChange={v => set("PN_DIRECCION", v)} placeholder="Ej: Av. Las Condes 12345" />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <Field label="Comuna">
                    <TextInput value={str("PN_COMUNA")} onChange={v => set("PN_COMUNA", v)} placeholder="Ej: Las Condes" />
                  </Field>
                  <Field label="Ciudad">
                    <TextInput value={str("PN_CIUDAD")} onChange={v => set("PN_CIUDAD", v)} placeholder="Ej: Santiago" />
                  </Field>
                </div>
                <Field label="País">
                  <TextInput value={str("PN_PAIS")} onChange={v => set("PN_PAIS", v)} placeholder="Chile" />
                </Field>
                <Field label="Teléfono">
                  <TextInput value={str("PN_TELEFONO")} onChange={v => set("PN_TELEFONO", v)} placeholder="+56 9 1234 5678" type="tel" />
                </Field>
                <Field label="Email de contacto">
                  <TextInput value={str("PN_EMAIL")} onChange={v => set("PN_EMAIL", v)} placeholder="correo@ejemplo.cl" type="email" />
                </Field>
              </div>
            </SectionCard>
            <SaveBar onSave={saveSection} saving={saving} saved={saved} onReset={resetSection} error={saveError} />
          </>
        )}

        {/* EMPRESA */}
        {section === "empresa" && (
          <>
            <SectionCard title="Identidad del contribuyente" description="Datos legales que aparecerán en los reportes tributarios exportables">
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <Field label="Razón social"><TextInput value={str("COMPANY_RAZON_SOCIAL")} onChange={v => set("COMPANY_RAZON_SOCIAL", v)} placeholder="Ej: Mi Empresa SpA" /></Field>
                <Field label="RUT" hint="Con puntos y guión. Ej: 76.123.456-7"><TextInput value={str("COMPANY_RUT")} onChange={v => set("COMPANY_RUT", v)} placeholder="76.123.456-7" /></Field>
                <Field label="Giro tributario"><TextInput value={str("COMPANY_GIRO")} onChange={v => set("COMPANY_GIRO", v)} placeholder="Ej: Inversión en activos digitales" /></Field>
                <Field label="Dirección"><TextInput value={str("COMPANY_DIRECCION")} onChange={v => set("COMPANY_DIRECCION", v)} placeholder="Ej: Av. Providencia 1234, Santiago" /></Field>
                <Field label="Representante legal"><TextInput value={str("COMPANY_REPRESENTANTE")} onChange={v => set("COMPANY_REPRESENTANTE", v)} placeholder="Nombre completo" /></Field>
                <Field label="Email de contacto"><TextInput value={str("COMPANY_EMAIL")} onChange={v => set("COMPANY_EMAIL", v)} placeholder="contacto@empresa.cl" type="email" /></Field>
              </div>
            </SectionCard>
            <SaveBar onSave={saveSection} saving={saving} saved={saved} onReset={resetSection} error={saveError} />
          </>
        )}

        {/* SEGURIDAD */}
        {section === "seguridad" && (
          <>
            <SectionCard title="Sesiones y control de acceso" description="Parámetros de gobierno operacional para la plataforma">
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "0.5rem" }}>
                <Field label="Expiración de sesión (horas)" hint="Las sesiones se cerrarán automáticamente tras este período.">
                  <TextInput value={str("SECURITY_SESSION_HOURS")} onChange={v => set("SECURITY_SESSION_HOURS", v)} type="number" style={{ width: "140px" }} />
                </Field>
                <Field label="Máximo intentos de login fallidos" hint="La cuenta se bloqueará tras esta cantidad de intentos fallidos.">
                  <TextInput value={str("SECURITY_MAX_LOGIN_ATTEMPTS")} onChange={v => set("SECURITY_MAX_LOGIN_ATTEMPTS", v)} type="number" style={{ width: "140px" }} />
                </Field>
              </div>
            </SectionCard>

            {/* 2FA Panel */}
            <TwoFAPanel />

            <SaveBar onSave={saveSection} saving={saving} saved={saved} onReset={resetSection} error={saveError} />
          </>
        )}

        {/* AUDITORÍA */}
        {section === "auditoria" && (
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontFamily: fonts.display, fontSize: "14px", fontWeight: 700, color: "#0F2A3D", margin: "0 0 2px" }}>Registro de cambios</h3>
                <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>Cada modificación queda registrada con actor, valores y timestamp.</p>
              </div>
              <button type="button" onClick={loadAudit} disabled={auditLoading} style={{ background: "transparent", border: "1px solid #E2E8F0", borderRadius: "6px", color: "#64748B", fontSize: "12px", padding: "6px 12px", cursor: auditLoading ? "not-allowed" : "pointer", fontFamily: fonts.body }}>
                {auditLoading ? "Cargando..." : "Actualizar"}
              </button>
            </div>
            {auditLoading ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "#475569", fontSize: "13px" }}>Cargando registros...</div>
            ) : audit.length === 0 ? (
              <div style={{ padding: "4rem 2rem", textAlign: "center", color: "#334155", fontSize: "13px" }}>No hay cambios registrados aún.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr>{["Parámetro", "Valor anterior", "Valor nuevo", "Actor", "Fecha"].map(h => <th key={h} style={{ textAlign: "left", padding: "10px 16px", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {audit.map((entry, i) => (
                      <tr key={entry.id} style={{ background: i % 2 === 0 ? "#F8FAFC" : "transparent" }}>
                        <td style={{ padding: "10px 16px", color: "#475569", fontFamily: "monospace", fontSize: "11px" }}>{entry.settingKey}</td>
                        <td style={{ padding: "10px 16px", color: "#EF4444" }}>{entry.oldValue ?? "—"}</td>
                        <td style={{ padding: "10px 16px", color: "#4ADE80" }}>{entry.newValue}</td>
                        <td style={{ padding: "10px 16px", color: "#94A3B8" }}>{entry.actorEmail ?? "sistema"}</td>
                        <td style={{ padding: "10px 16px", color: "#64748B", whiteSpace: "nowrap" }}>{new Date(entry.createdAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}