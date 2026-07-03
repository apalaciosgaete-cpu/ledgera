"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/modules/identity/client/authContext";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";
import { fonts } from "@/styles/tokens";

type Profile = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  subscriptionPlan: string;
  subscriptionExpiresAt: string | null;
  twoFactorEnabled: boolean;
  rut: string;
  phone: string;
  address: string;
  commune: string;
  country: string;
};

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

type CardProps = {
  title: string;
  eyebrow?: string;
  description: string;
  children: React.ReactNode;
};

const inputStyle = {
  width: "100%",
  border: "1px solid var(--border)",
  background: "var(--bg-sunken)",
  color: "var(--text)",
  borderRadius: 12,
  padding: "11px 12px",
  fontSize: 14,
  fontFamily: fonts.body,
  boxSizing: "border-box" as const,
};

function label(text: string) {
  return (
    <span style={{ color: "var(--text-soft)", fontSize: 12, fontWeight: 850, letterSpacing: "0.04em", textTransform: "uppercase" }}>
      {text}
    </span>
  );
}

function Card({ title, eyebrow, description, children }: CardProps) {
  return (
    <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 22, padding: 20, display: "grid", gap: 16, boxShadow: "0 18px 42px rgba(0,0,0,0.08)" }}>
      <div style={{ display: "grid", gap: 6 }}>
        {eyebrow ? <p style={{ color: "var(--accent)", fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", margin: 0, textTransform: "uppercase" }}>{eyebrow}</p> : null}
        <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 950, letterSpacing: "-0.04em", margin: 0 }}>{title}</h2>
        <p style={{ color: "var(--text-soft)", fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{description}</p>
      </div>
      {children}
    </section>
  );
}

function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "ok" | "warn" | "neutral" }) {
  const styles = {
    ok: { background: "var(--accent-soft)", color: "var(--accent)", border: "var(--accent-soft)" },
    warn: { background: "rgba(232,184,75,0.14)", color: "var(--warn)", border: "rgba(232,184,75,0.22)" },
    neutral: { background: "var(--bg-sunken)", color: "var(--text-soft)", border: "var(--border)" },
  }[tone];

  return (
    <span style={{ display: "inline-flex", alignItems: "center", width: "fit-content", border: `1px solid ${styles.border}`, borderRadius: 999, padding: "6px 9px", fontSize: 12, fontWeight: 900, background: styles.background, color: styles.color }}>
      {children}
    </span>
  );
}

function ReadOnlyRow({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div style={{ display: "grid", gap: 4, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ color: "var(--text-soft)", fontSize: 13 }}>{label}</span>
        <strong style={{ color: "var(--text)", fontSize: 13.5, textAlign: "right" }}>{value}</strong>
      </div>
      {helper ? <span style={{ color: "var(--text-faint)", fontSize: 12 }}>{helper}</span> : null}
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Sin vencimiento informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin vencimiento informado";
  return date.toLocaleDateString("es-CL", { dateStyle: "medium" });
}

export default function ConfiguracionPage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ fullName: "", rut: "", phone: "", address: "", commune: "", country: "Chile" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    httpClient<ApiResponse<Profile>>("/api/configuracion/perfil", { auth: true })
      .then((response) => {
        if (cancelled) return;
        setProfile(response.data);
        setForm({
          fullName: response.data.fullName ?? "",
          rut: response.data.rut ?? "",
          phone: response.data.phone ?? "",
          address: response.data.address ?? "",
          commune: response.data.commune ?? "",
          country: response.data.country ?? "Chile",
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setNotice({ type: "error", text: isHttpClientError(error) ? error.message : "No fue posible cargar la configuración." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const completion = useMemo(() => {
    const items = [form.fullName, form.rut, form.phone, form.address, form.commune, form.country];
    return Math.round((items.filter((item) => item.trim().length > 0).length / items.length) * 100);
  }, [form]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const response = await httpClient<ApiResponse<Profile>>("/api/configuracion/perfil", {
        method: "PUT",
        auth: true,
        body: form,
      });
      setProfile(response.data);
      setNotice({ type: "ok", text: "Datos de cuenta actualizados." });
      void refreshUser({ silent: true });
    } catch (error) {
      setNotice({ type: "error", text: isHttpClientError(error) ? error.message : "No fue posible guardar los cambios." });
    } finally {
      setSaving(false);
    }
  }

  const currentUser = profile ?? (user ? {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionExpiresAt: user.subscriptionExpiresAt ? String(user.subscriptionExpiresAt) : null,
    twoFactorEnabled: user.twoFactorEnabled === true,
    rut: "",
    phone: "",
    address: "",
    commune: "",
    country: "Chile",
  } satisfies Profile : null);

  return (
    <main style={{ display: "grid", gap: 20, color: "var(--text)", fontFamily: fonts.body }}>
      <section style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ display: "grid", gap: 8, maxWidth: 740 }}>
          <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Configuración</p>
          <h1 style={{ color: "var(--text)", fontSize: "clamp(2rem,4vw,3.1rem)", letterSpacing: "-0.06em", lineHeight: 1, margin: 0, fontWeight: 950 }}>
            Cuenta, seguridad y criterios tributarios
          </h1>
          <p style={{ color: "var(--text-soft)", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            Administra los datos que se usarán en respaldos, reportes y verificación documental. Las preferencias tributarias críticas se muestran como criterios controlados para evitar cambios sin trazabilidad.
          </p>
        </div>

        <aside style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 16, minWidth: 240, display: "grid", gap: 8 }}>
          <span style={{ color: "var(--text-soft)", fontSize: 12, fontWeight: 850 }}>Completitud del perfil</span>
          <strong style={{ color: completion >= 80 ? "var(--accent)" : "var(--warn)", fontSize: 30, fontWeight: 950, letterSpacing: "-0.04em" }}>{completion}%</strong>
          <span style={{ color: "var(--text-faint)", fontSize: 12 }}>Estos datos aparecen en respaldos y documentos descargables.</span>
        </aside>
      </section>

      {notice ? (
        <div style={{ background: notice.type === "ok" ? "var(--accent-soft)" : "rgba(196,99,74,0.14)", border: `1px solid ${notice.type === "ok" ? "var(--accent-soft)" : "rgba(196,99,74,0.28)"}`, color: notice.type === "ok" ? "var(--accent)" : "var(--loss)", borderRadius: 14, padding: "12px 14px", fontSize: 13, fontWeight: 850 }}>
          {notice.text}
        </div>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
        <Card title="Datos de cuenta" eyebrow="Perfil" description="Información del titular usada para identificar tus reportes, respaldos y declaraciones exportables.">
          {loading ? (
            <p style={{ color: "var(--text-soft)", margin: 0 }}>Cargando perfil...</p>
          ) : (
            <form onSubmit={saveProfile} style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
                <label style={{ display: "grid", gap: 7 }}>
                  {label("Nombre / razón social")}
                  <input value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} required style={inputStyle} />
                </label>
                <label style={{ display: "grid", gap: 7 }}>
                  {label("RUT")}
                  <input value={form.rut} onChange={(e) => setForm((prev) => ({ ...prev, rut: e.target.value }))} placeholder="12.345.678-9" style={inputStyle} />
                </label>
                <label style={{ display: "grid", gap: 7 }}>
                  {label("Teléfono")}
                  <input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="+56 9..." style={inputStyle} />
                </label>
                <label style={{ display: "grid", gap: 7 }}>
                  {label("País tributario")}
                  <input value={form.country} onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))} style={inputStyle} />
                </label>
                <label style={{ display: "grid", gap: 7 }}>
                  {label("Comuna")}
                  <input value={form.commune} onChange={(e) => setForm((prev) => ({ ...prev, commune: e.target.value }))} style={inputStyle} />
                </label>
                <label style={{ display: "grid", gap: 7 }}>
                  {label("Dirección")}
                  <input value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} style={inputStyle} />
                </label>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-faint)", fontSize: 12 }}>Correo: {currentUser?.email ?? "—"}</span>
                <button type="submit" disabled={saving} style={{ border: "none", background: "var(--accent)", color: "var(--text)", borderRadius: 999, padding: "11px 16px", fontWeight: 900, cursor: saving ? "not-allowed" : "pointer", fontFamily: fonts.body }}>
                  {saving ? "Guardando..." : "Guardar datos"}
                </button>
              </div>
            </form>
          )}
        </Card>

        <Card title="Seguridad" eyebrow="Acceso" description="Estado de cuenta, doble factor y acciones de control de sesión.">
          <div style={{ display: "grid", gap: 0 }}>
            <ReadOnlyRow label="Estado de cuenta" value={currentUser?.status === "active" ? "Activa" : currentUser?.status ?? "—"} />
            <ReadOnlyRow label="2FA" value={currentUser?.twoFactorEnabled ? "Activo" : "Pendiente"} helper={currentUser?.twoFactorEnabled ? "La cuenta tiene autenticación de doble factor." : "Configura 2FA para reforzar el acceso."} />
            <ReadOnlyRow label="Plan" value={currentUser?.subscriptionPlan ?? "—"} />
            <ReadOnlyRow label="Vencimiento" value={formatDate(currentUser?.subscriptionExpiresAt ?? null)} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StatusPill tone={currentUser?.twoFactorEnabled ? "ok" : "warn"}>{currentUser?.twoFactorEnabled ? "Seguridad activa" : "Requiere 2FA"}</StatusPill>
            <StatusPill>Sesión protegida</StatusPill>
          </div>
        </Card>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        <Card title="Tributario" eyebrow="Criterios" description="Criterios usados por LEDGERA para calcular saldos, respaldos y lectura tributaria preliminar.">
          <div style={{ display: "grid", gap: 0 }}>
            <ReadOnlyRow label="País tributario" value={form.country || "Chile"} />
            <ReadOnlyRow label="Moneda de declaración" value="CLP" helper="Los reportes tributarios se emiten en pesos chilenos." />
            <ReadOnlyRow label="Método de costo" value="FIFO" helper="Criterio recomendado y controlado para mantener trazabilidad." />
            <ReadOnlyRow label="Stablecoins" value="Tratadas como USD" />
          </div>
        </Card>

        <Card title="Valorización" eyebrow="Mercado" description="Parámetros visibles para entender de dónde vienen precios, dólar y conversiones.">
          <div style={{ display: "grid", gap: 0 }}>
            <ReadOnlyRow label="USD/CLP" value="mindicador.cl" helper="Con fallback controlado si el proveedor no responde." />
            <ReadOnlyRow label="Precios cripto" value="Binance + stablecoins" />
            <ReadOnlyRow label="CLP" value="Sin decimales" />
            <ReadOnlyRow label="Crypto" value="Hasta 8 decimales" />
          </div>
          <Link href="/panel" style={{ color: "var(--accent)", fontSize: 13, fontWeight: 900, textDecoration: "none" }}>Ver resumen valorizado</Link>
        </Card>

        <Card title="Documentos" eyebrow="Respaldo" description="Elementos obligatorios de los respaldos generados por LEDGERA.">
          <div style={{ display: "grid", gap: 8 }}>
            <StatusPill tone="ok">Folio documental</StatusPill>
            <StatusPill tone="ok">Hash de verificación</StatusPill>
            <StatusPill tone="ok">QR de validación</StatusPill>
            <StatusPill tone="ok">Tipo de cambio usado</StatusPill>
          </div>
          <Link href="/declaraciones" style={{ color: "var(--accent)", fontSize: 13, fontWeight: 900, textDecoration: "none" }}>Ir a declaraciones</Link>
        </Card>
      </section>
    </main>
  );
}
