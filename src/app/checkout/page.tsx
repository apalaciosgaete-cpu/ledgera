"use client";

import { FormEvent, Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/modules/identity/client/authContext";
import { httpClient } from "@/shared/http/httpClient";

const PLAN_INFO: Record<string, {
  label: string; color: string; bg: string;
  mensual: number; anual: number;
  features: string[];
}> = {
  PERSONAL: {
    label: "Personal", color: "#10B981", bg: "rgba(16,185,129,0.08)",
    mensual: 4990, anual: 49900,
    features: ["Movimientos ilimitados", "Motor FIFO automático", "Exportación CSV y PDF", "Auditoría completa", "Soporte por email"],
  },
  PROFESIONAL: {
    label: "Contador", color: "#7C3AED", bg: "rgba(124,58,237,0.08)",
    mensual: 14990, anual: 149900,
    features: ["Todo lo de Personal", "Hasta 5 clientes incluidos", "Reportes verificables SII", "Soporte prioritario"],
  },
  EMPRESA: {
    label: "Empresa", color: "#0EA5E9", bg: "rgba(14,165,233,0.08)",
    mensual: 29990, anual: 299900,
    features: ["Todo lo de Contador", "Clientes ilimitados", "Régimen primera categoría", "Soporte dedicado"],
  },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { isAuthenticated, isLoading, login } = useAuth();

  const planKey  = searchParams.get("plan") ?? "PERSONAL";
  const billing  = (searchParams.get("billing") ?? "mensual") as "mensual" | "anual";
  const info     = PLAN_INFO[planKey];

  const [fullName,     setFullName]     = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [redirecting,  setRedirecting]  = useState(false);
  const stripeStarted = useRef(false);

  const price      = billing === "mensual" ? info?.mensual : info?.anual;
  const priceLabel = billing === "mensual"
    ? `$${(info?.mensual ?? 0).toLocaleString("es-CL")}/mes`
    : `$${(info?.anual   ?? 0).toLocaleString("es-CL")}/año`;

  // Si ya está logueado al cargar la página, disparar checkout directamente
  useEffect(() => {
    if (!isLoading && isAuthenticated && info && !stripeStarted.current) {
      stripeStarted.current = true;
      void goToStripe();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading]);

  if (!info) {
    router.push("/bienvenida#precios");
    return null;
  }

  async function goToStripe() {
    setRedirecting(true);
    try {
      const json = await httpClient<{ url?: string }>("/api/stripe/checkout", {
        method: "POST",
        body:   { plan: planKey, billing },
        auth:   true,
      });
      if (json.url) { window.location.href = json.url; return; }
      setErrorMessage("No fue posible iniciar el pago.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error al conectar con el servidor de pagos.");
    } finally {
      setRedirecting(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    if (password.length < 8) { setErrorMessage("La contraseña debe tener al menos 8 caracteres."); return; }
    setSubmitting(true);
    try {
      // 1. Crear cuenta
      const role = planKey === "EMPRESA" ? "empresa" : planKey === "PROFESIONAL" ? "contador" : "personal";
      const regRes  = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName, email, password, role }) });
      const regJson = await regRes.json() as { ok: boolean; message?: string };

      if (!regRes.ok || !regJson.ok) {
        // Email ya existe → mostrar login en lugar de error
        if (regRes.status === 409) {
          setErrorMessage("Este email ya está registrado. Inicia sesión para continuar al pago.");
        } else {
          setErrorMessage(regJson.message ?? "No fue posible crear la cuenta.");
        }
        setSubmitting(false);
        return;
      }

      // 2. Login automático
      try {
        await login(email, password);
      } catch {
        // Si login falla, redirigir a login con el plan
        window.location.href = `/login?plan=${planKey}&billing=${billing}`;
        return;
      }

      // 3. Stripe checkout
      setSubmitting(false);
      stripeStarted.current = true;
      await goToStripe();
    } catch (err) {
      console.error("Checkout error:", err);
      setErrorMessage("Error inesperado. Intenta nuevamente.");
      setSubmitting(false);
    }
  }

  const busy = submitting || redirecting;

  return (
    <main style={{ minHeight: "100vh", background: "#0A1F2E", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "var(--font-body)" }}>
      <style>{`* { box-sizing: border-box; } input::placeholder { color: #334155; } input:focus { outline: none; border-color: ${info.color} !important; }`}</style>

      <div style={{ width: "100%", maxWidth: "860px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px", alignItems: "stretch" }}>

        {/* ── Panel izquierdo: resumen del plan ── */}
        <div style={{ background: info.bg, border: `1px solid ${info.color}30`, borderRadius: "20px", padding: "2rem" }}>
          <Link href="/bienvenida#precios" style={{ fontSize: "13px", color: "#64748B", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "1.5rem" }}>
            ← Volver a precios
          </Link>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: `${info.color}18`, border: `1px solid ${info.color}30`, borderRadius: "100px", padding: "4px 14px", marginBottom: "1rem" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: info.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>Plan {info.label}</span>
          </div>

          <p style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 700, color: "#F1F5F9", margin: "0 0 4px", lineHeight: 1 }}>
            {priceLabel}
          </p>
          {billing === "anual" && (
            <p style={{ fontSize: "13px", color: info.color, margin: "0 0 1.5rem", fontWeight: 600 }}>
              Equivale a ${Math.round((info.anual) / 12).toLocaleString("es-CL")}/mes · Ahorra 17%
            </p>
          )}

          <ul style={{ listStyle: "none", padding: 0, margin: "1.5rem 0 0", display: "flex", flexDirection: "column", gap: "10px" }}>
            {info.features.map(f => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#CBD5E1" }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: `${info.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={info.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                {f}
              </li>
            ))}
          </ul>

          <div style={{ marginTop: "2rem", padding: "1rem", background: "rgba(255,255,255,0.04)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: "12px", color: "#64748B", margin: 0, lineHeight: 1.6 }}>
              🔒 Pago seguro con Stripe. Puedes cancelar en cualquier momento desde tu perfil.
            </p>
          </div>
        </div>

        {/* ── Panel derecho: formulario o redirigiendo ── */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "2rem" }}>

          {isLoading || (isAuthenticated && !errorMessage) ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "260px", gap: "16px" }}>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ width: 32, height: 32, border: `2px solid ${info.color}30`, borderTopColor: info.color, borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />
              <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>Redirigiendo a Stripe…</p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
                <Logo variant="light" size="md" showSubtitle />
              </div>

              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "#F1F5F9", margin: "0 0 4px", textAlign: "center" }}>
                Crea tu cuenta y paga
              </h2>
              <p style={{ fontSize: "13px", color: "#64748B", textAlign: "center", margin: "0 0 1.5rem" }}>
                ¿Ya tienes cuenta?{" "}
                <Link href={`/login?plan=${planKey}&billing=${billing}`} style={{ color: info.color, fontWeight: 600, textDecoration: "none" }}>
                  Inicia sesión
                </Link>
              </p>

              {errorMessage && (
                <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "1rem", fontSize: "13px", color: "#FCA5A5" }}>
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  type="text" placeholder="Nombre completo" required value={fullName} onChange={e => setFullName(e.target.value)}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: "9px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#F1F5F9", fontSize: "14px" }}
                />
                <input
                  type="email" placeholder="Correo electrónico" required value={email} onChange={e => setEmail(e.target.value)}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: "9px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#F1F5F9", fontSize: "14px" }}
                />
                <input
                  type="password" placeholder="Contraseña (mín. 8 caracteres)" required value={password} onChange={e => setPassword(e.target.value)}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: "9px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#F1F5F9", fontSize: "14px" }}
                />

                <button
                  type="submit" disabled={busy}
                  style={{ width: "100%", padding: "13px", borderRadius: "9px", border: "none", background: info.color, color: "#fff", fontSize: "15px", fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.75 : 1, marginTop: "4px" }}
                >
                  {busy ? "Procesando..." : `Continuar al pago · ${priceLabel}`}
                </button>
              </form>

              <p style={{ fontSize: "11px", color: "#475569", textAlign: "center", marginTop: "1rem", lineHeight: 1.6 }}>
                Al continuar aceptas los{" "}
                <Link href="/terminos" style={{ color: "#64748B", textDecoration: "underline" }}>Términos de servicio</Link>{" "}
                y la{" "}
                <Link href="/privacidad" style={{ color: "#64748B", textDecoration: "underline" }}>Política de privacidad</Link>.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
