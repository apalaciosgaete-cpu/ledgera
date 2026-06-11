"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/modules/identity/client/authContext";
import { fonts } from "@/styles/tokens";
import TwoFASetupPanel from "@/components/auth/TwoFASetupPanel";

export type Section = "tributario" | "persona" | "seguridad" | "facturacion" | "preferencias" | "auditoria" | "administracion";

export const ALL_SECTIONS: { key: Section; label: string; description: string; roles: string[]; icon: React.ReactNode; href: string }[] = [
  { key: "persona",     label: "Perfil",      description: "Identidad del contribuyente",   roles: ["admin","personal","empresa","contador"], icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>, href: "/configuracion/perfil" },
  { key: "seguridad",   label: "Seguridad",   description: "Sesiones y acceso",             roles: ["admin","personal","contador","empresa"], icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, href: "/configuracion/seguridad" },
  { key: "facturacion", label: "Facturación", description: "Plan y suscripción",            roles: ["admin","personal","contador","empresa"], icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><line x1="6" y1="15" x2="10" y2="15" /></svg>, href: "/configuracion/facturacion" },
  { key: "preferencias", label: "Preferencias", description: "Ajustes de experiencia",       roles: ["admin","personal","contador","empresa"], icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>, href: "/configuracion/preferencias" },
  { key: "tributario",  label: "Tributario",  description: "Parámetros del motor tributario", roles: ["admin"],                       icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>, href: "/configuracion/admin/tributario" },
  { key: "auditoria",   label: "Auditoría",   description: "Registro de cambios",           roles: ["admin"],                       icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>, href: "/configuracion/admin/auditoria" },
  { key: "administracion", label: "Administración", description: "Gestión de usuarios y suscripciones", roles: ["admin"], icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>, href: "/admin" },
];

const SECTION_PREFIX: Record<Section, string> = {
  tributario: "TAX_",
  persona:    "PN_",
  seguridad:  "SECURITY_",
  facturacion: "",
  preferencias: "",
  auditoria:  "",
  administracion: "",
};

function profilePrefix(role: string) {
  return role === "empresa" || role === "contador" ? "COMPANY_" : "PN_";
}

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

function SecurityCheckItem({ label, status }: { label: string; status: "ok" | "warn" | "info" }) {
  const colors = {
    ok:   { bg: "rgba(22,163,74,0.06)", border: "rgba(22,163,74,0.15)", icon: "#4ADE80", text: "#0F2A3D" },
    warn: { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.15)", icon: "#F59E0B", text: "#0F2A3D" },
    info: { bg: "rgba(14,165,233,0.06)", border: "rgba(14,165,233,0.15)", icon: "#0EA5E9", text: "#0F2A3D" },
  };
  const c = colors[status];
  const icon = status === "ok" ? "✓" : status === "warn" ? "⚠" : "ℹ";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: c.bg, border: `1px solid ${c.border}`, borderRadius: "8px" }}>
      <span style={{ color: c.icon, fontSize: "16px", fontWeight: 700 }}>{icon}</span>
      <span style={{ fontSize: "13px", color: c.text, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function SecurityCenterPanel({ twoFactorEnabled }: { twoFactorEnabled: boolean }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "1.5rem", marginBottom: "1rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ fontFamily: fonts.display, fontSize: "14px", fontWeight: 700, color: "#0F2A3D", margin: "0 0 4px" }}>
          Estado de seguridad
        </h3>
        <p style={{ fontSize: "12px", color: "#475569", margin: 0 }}>
          LEDGERA requiere verificación en dos pasos para proteger tu información financiera y tributaria.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <SecurityCheckItem label={twoFactorEnabled ? "2FA activo" : "2FA pendiente — requerido para navegar"} status={twoFactorEnabled ? "ok" : "warn"} />
        <SecurityCheckItem label="Sesión protegida" status="ok" />
        <SecurityCheckItem label="Verificación de cuenta" status="ok" />
      </div>

      {!twoFactorEnabled && (
        <div style={{ marginTop: "16px", padding: "14px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "10px" }}>
          <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 700, color: "#92400E" }}>
            Debes activar 2FA para usar LEDGERA
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "#78350F", lineHeight: 1.5 }}>
            Por seguridad, todas las funciones de la plataforma requieren autenticación en dos pasos.
            Configúralo desde tu app de autenticación (Google Authenticator, Authy, etc.) escaneando el código QR.
          </p>
        </div>
      )}

      <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E2E8F0" }}>
        <a href="/configuracion/seguridad" style={{ fontSize: "13px", color: "#0EA5E9", textDecoration: "none", fontWeight: 700 }}>
          Gestionar sesiones activas →
        </a>
      </div>
    </div>
  );
}

export default function ConfiguracionShell({ forcedSection }: { forcedSection: Section }) {
  const { user, subscriptionState } = useAuth();
  const role = (user as { role?: string })?.role ?? "personal";
  const [section, setSection] = useState<Section>(forcedSection);
  const [settings, setSettings]         = useState<Record<string, string>>({});
  const [draft, setDraft]               = useState<Record<string, string>>({});
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [saveError, setSaveError]       = useState("");
  const [audit, setAudit]               = useState<{ id: string; settingKey: string; oldValue: string | null; newValue: string; actorEmail: string | null; createdAt: string }[]>([]);
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
  useEffect(() => { setSection(forcedSection); }, [forcedSection]);

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
    const prefix = section === "persona" ? profilePrefix(role) : SECTION_PREFIX[section];
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
    <>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: fonts.display, fontSize: "20px", fontWeight: 700, color: "#0F2A3D", margin: "0 0 4px" }}>{ALL_SECTIONS.find(s => s.key === section)?.label}</h2>
        <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>{ALL_SECTIONS.find(s => s.key === section)?.description}</p>
      </div>

      {/* TRIBUTARIO */}
      {section === "tributario" && (
        <>
          <SectionCard title="Motor tributario" description="Parámetros de cálculo aplicados a cada movimiento del portafolio">
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

      {/* PERFIL */}
      {section === "persona" && (role === "empresa" || role === "contador") && (
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

      {section === "persona" && role !== "empresa" && role !== "contador" && (
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

      {/* SEGURIDAD */}
      {section === "seguridad" && (
        <>
          {role === "admin" && (
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
          )}

          <SecurityCenterPanel twoFactorEnabled={user?.twoFactorEnabled === true} />

          {role === "admin" && <SaveBar onSave={saveSection} saving={saving} saved={saved} onReset={resetSection} error={saveError} />}
        </>
      )}

      {/* FACTURACIÓN */}
      {section === "facturacion" && (
        <>
          <SectionCard title="Suscripción actual" description="Estado de tu plan y próxima renovación">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px 14px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Plan</p>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0F2A3D" }}>
                    {subscriptionState?.plan ?? user?.subscriptionPlan ?? "—"}
                  </p>
                </div>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px 14px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Estado</p>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: subscriptionState?.isActive ? "#16A34A" : "#EF4444" }}>
                    {subscriptionState?.label ?? "Desconocido"}
                  </p>
                </div>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px 14px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Próxima renovación</p>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0F2A3D" }}>
                    {subscriptionState?.expiresAt
                      ? new Date(subscriptionState.expiresAt).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })
                      : user?.subscriptionExpiresAt
                        ? new Date(user.subscriptionExpiresAt).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })
                        : "—"}
                  </p>
                </div>
              </div>

              {subscriptionState?.daysRemaining !== null && subscriptionState?.daysRemaining !== undefined && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "10px 12px", borderRadius: "8px",
                  background: subscriptionState.daysRemaining <= 7 ? "rgba(245,158,11,0.08)" : "rgba(22,163,74,0.06)",
                  border: `1px solid ${subscriptionState.daysRemaining <= 7 ? "rgba(245,158,11,0.2)" : "rgba(22,163,74,0.15)"}`,
                }}>
                  <span style={{ fontSize: "16px" }}>{subscriptionState.daysRemaining <= 7 ? "⚠️" : "✓"}</span>
                  <span style={{ fontSize: "13px", color: "#475569" }}>
                    {subscriptionState.daysRemaining <= 0
                      ? "Tu suscripción ha vencido. Renueva para continuar."
                      : subscriptionState.daysRemaining <= 7
                        ? `Tu suscripción vence en ${subscriptionState.daysRemaining} día(s).`
                        : `Tu suscripción está activa. Quedan ${subscriptionState.daysRemaining} días.`}
                  </span>
                </div>
              )}

              <div style={{ paddingTop: "6px" }}>
                <a href="/planes" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "8px", border: "none", background: "#16A34A", color: "#fff", fontSize: "13px", fontWeight: 700, textDecoration: "none", fontFamily: fonts.body }}>
                  Cambiar plan →
                </a>
              </div>
            </div>
          </SectionCard>
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
    </>
  );
}
