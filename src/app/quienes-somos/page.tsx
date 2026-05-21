"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const WHATSAPP_URL =
  "https://api.whatsapp.com/send/?phone=56972871569&text=Hola%2C+tengo+una+consulta+sobre+Ledgera&type=phone_number";

const NAV_LINKS = [
  { label: "Cómo funciona", href: "/como-funciona" },
  { label: "Planes", href: "/planes" },
  { label: "Preguntas", href: "/preguntas" },
  { label: "Blog", href: "/blog" },
];

export default function QuienesSomosPage() {
  return (
    <div style={{ background: "#071520", minHeight: "100vh", color: "#F1F5F9" }}>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(7,21,32,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", height: "68px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/bienvenida" style={{ textDecoration: "none" }}>
            <Logo variant="light" size="lg" showSubtitle />
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{ fontSize: "14px", fontWeight: 500, color: "#94A3B8", padding: "6px 14px", borderRadius: "8px", textDecoration: "none" }}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/login" style={{ marginLeft: "8px", fontSize: "14px", fontWeight: 600, color: "#E2E8F0", padding: "8px 18px", borderRadius: "9px", border: "1px solid rgba(255,255,255,0.12)", textDecoration: "none" }}>
              Iniciar sesión
            </Link>
            <Link href="/register" style={{ marginLeft: "6px", fontSize: "14px", fontWeight: 700, color: "#fff", padding: "8px 18px", borderRadius: "9px", background: "#16A34A", textDecoration: "none" }}>
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "5rem 2rem 3rem", background: "linear-gradient(to bottom, #071520, #0A1F2E)" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.22)", borderRadius: "100px", padding: "4px 16px", marginBottom: "1.25rem" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#4ADE80", letterSpacing: "0.04em" }}>Quiénes somos</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "clamp(2.2rem, 5vw, 3.2rem)", fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 1.25rem" }}>
            Nacimos para resolver un problema real
          </h1>
          <p style={{ fontSize: "17px", color: "#94A3B8", lineHeight: 1.75, margin: 0 }}>
            Ledgera surgió de la frustración de inversores chilenos que enfrentaban la normativa del SII sin ninguna herramienta local. Planillas Excel, cálculos manuales y la incertidumbre de saber si el número era correcto. Decidimos construir la solución que nos hubiera gustado tener.
          </p>
        </div>
      </section>

      {/* ── Misión y Visión ─────────────────────────────────────────────────── */}
      <section style={{ padding: "3rem 2rem", background: "#0A1F2E" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "2.5rem" }}>

            {/* Misión */}
            <div style={{ background: "rgba(22,163,74,0.05)", border: "1px solid rgba(22,163,74,0.18)", borderRadius: "20px", padding: "2.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "28px", fontWeight: 800, color: "#4ADE80", letterSpacing: "-0.02em", margin: "0 0 16px" }}>
                Nuestra Misión
              </h2>
              <p style={{ fontSize: "16px", color: "#94A3B8", margin: 0, lineHeight: 1.8 }}>
                Que cualquier persona en Chile pueda declarar sus criptomonedas correctamente al SII, sin necesitar ser contador ni experto tributario. Hacemos que el cumplimiento sea simple, exacto y al alcance de cualquier inversor.
              </p>
            </div>

            {/* Visión */}
            <div style={{ background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.18)", borderRadius: "20px", padding: "2.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "28px", fontWeight: 800, color: "#38BDF8", letterSpacing: "-0.02em", margin: "0 0 16px" }}>
                Nuestra Visión
              </h2>
              <p style={{ fontSize: "16px", color: "#94A3B8", margin: 0, lineHeight: 1.8 }}>
                Ser la plataforma de referencia para el cumplimiento tributario de criptoactivos en Latinoamérica, reconocida por su precisión técnica, trazabilidad verificable e independencia regulatoria, sin importar el país donde el usuario opere.
              </p>
            </div>
          </div>

          {/* Para quién */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "2.5rem", marginBottom: "2.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "22px", fontWeight: 700, color: "#F1F5F9", margin: "0 0 8px" }}>
              Para quién construimos Ledgera
            </h3>
            <p style={{ fontSize: "15px", color: "#94A3B8", margin: "0 0 1.5rem", lineHeight: 1.7 }}>
              Tres perfiles, una sola plataforma adaptada a cada necesidad.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              {[
                { who: "Inversores individuales", desc: "Personas que compran y venden cripto y necesitan saber exactamente cuánto deben declarar al SII cada año." },
                { who: "Contadores y asesores", desc: "Profesionales que gestionan múltiples clientes con criptoactivos y necesitan reportes exportables y auditables." },
                { who: "Empresas con criptoactivos", desc: "Organizaciones que operan en cripto y requieren conciliación contable, trazabilidad completa y cumplimiento institucional." },
              ].map((item) => (
                <div key={item.who} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "14px", padding: "1.5rem" }}>
                  <div style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "15px", fontWeight: 700, color: "#E2E8F0", marginBottom: "8px" }}>{item.who}</div>
                  <p style={{ fontSize: "14px", color: "#94A3B8", margin: 0, lineHeight: 1.65 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pilares */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[
              {
                label: "Precisión",
                detail: "Motor FIFO determinista con tipo de cambio BCCh oficial. Cada cálculo es auditable y reproducible.",
                color: "#16A34A",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ),
              },
              {
                label: "Transparencia",
                detail: "Reportes verificables con hash SHA-256 y QR. Cualquiera puede confirmar que tu declaración no fue alterada.",
                color: "#0EA5E9",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
              },
              {
                label: "Privacidad",
                detail: "Cumplimos la Ley 21.719 de protección de datos de Chile. Tu información nunca se comparte con terceros.",
                color: "#F59E0B",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ),
              },
            ].map((p) => (
              <div key={p.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ width: 40, height: 40, borderRadius: "9px", background: `${p.color}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {p.icon}
                </div>
                <div style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "16px", fontWeight: 700, color: "#F1F5F9" }}>{p.label}</div>
                <p style={{ fontSize: "14px", color: "#94A3B8", margin: 0, lineHeight: 1.65 }}>{p.detail}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem", background: "#071520", textAlign: "center" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)", fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.025em", margin: "0 0 1rem" }}>
            Empieza a declarar con confianza
          </h2>
          <p style={{ fontSize: "17px", color: "#94A3B8", lineHeight: 1.7, margin: "0 0 2rem" }}>
            Crea tu cuenta gratis y calcula tu base imponible en minutos.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ fontSize: "15px", fontWeight: 700, color: "#fff", padding: "13px 28px", borderRadius: "10px", background: "#16A34A", textDecoration: "none" }}>
              Crear cuenta gratis
            </Link>
            <Link href="/planes" style={{ fontSize: "15px", fontWeight: 600, color: "#E2E8F0", padding: "13px 28px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.12)", textDecoration: "none" }}>
              Ver planes
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#040C13", padding: "3rem 2.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "2rem", marginBottom: "2rem" }}>
            <div>
              <div style={{ marginBottom: "12px" }}>
                <Logo variant="light" size="sm" showSubtitle />
              </div>
              <p style={{ fontSize: "13px", color: "#475569", margin: 0, maxWidth: "260px", lineHeight: 1.6 }}>
                Software tributario especializado en criptomonedas para el mercado chileno.
              </p>
            </div>

            <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Producto</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link href="/register" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Comenzar gratis</Link>
                  <Link href="/login" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Iniciar sesión</Link>
                  <Link href="/blog" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Blog</Link>
                </div>
              </div>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Legal</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link href="/terminos" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Términos y condiciones</Link>
                  <Link href="/privacidad" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Política de privacidad</Link>
                  <Link href="/cookies" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Política de cookies</Link>
                </div>
              </div>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Contacto</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <a href="mailto:admin@ledgera.cl" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>admin@ledgera.cl</a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>WhatsApp soporte</a>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <span style={{ fontSize: "12px", color: "#334155" }}>© {new Date().getFullYear()} Ledgera · Chile · Ley 21.719 protección de datos</span>
            <span style={{ fontSize: "12px", color: "#334155" }}>ledgera.cl</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
