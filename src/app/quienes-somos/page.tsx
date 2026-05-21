import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Quiénes somos · Ledgera",
  description:
    "Conoce la misión, visión y valores de Ledgera: la plataforma chilena para declarar criptomonedas al SII con precisión y trazabilidad.",
};

const h2Style = {
  fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
  fontSize: "clamp(2rem, 4vw, 2.75rem)",
  fontWeight: 800,
  color: "#F1F5F9",
  letterSpacing: "-0.025em",
  lineHeight: 1.15,
};

const h3Style = {
  fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
  fontSize: "18px",
  fontWeight: 700,
  color: "#F1F5F9",
  margin: "0 0 10px",
};

const NAV_LINKS = [
  { label: "Cómo funciona", href: "/bienvenida#como-funciona" },
  { label: "Planes", href: "/planes" },
  { label: "Preguntas", href: "/preguntas" },
  { label: "Blog", href: "/blog" },
];

const PILLARS = [
  {
    label: "Precisión",
    detail:
      "Motor FIFO determinista con tipo de cambio BCCh oficial. Cada cálculo es auditable y reproducible. No hay margen para errores en tu declaración.",
    color: "#16A34A",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    label: "Transparencia",
    detail:
      "Reportes verificables con hash SHA-256 y QR. Cualquiera puede confirmar que tu declaración no fue alterada.",
    color: "#0EA5E9",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: "Privacidad",
    detail:
      "Cumplimos la Ley 21.719 de protección de datos de Chile. Tu información financiera viaja encriptada y nunca se comparte con terceros.",
    color: "#F59E0B",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
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
            <Link
              href="/login"
              style={{ marginLeft: "8px", fontSize: "14px", fontWeight: 600, color: "#E2E8F0", padding: "8px 18px", borderRadius: "9px", border: "1px solid rgba(255,255,255,0.12)", textDecoration: "none" }}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              style={{ marginLeft: "6px", fontSize: "14px", fontWeight: 700, color: "#fff", padding: "8px 18px", borderRadius: "9px", background: "#16A34A", textDecoration: "none" }}
            >
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "6rem 2rem 4rem", background: "linear-gradient(to bottom, #071520, #0A1F2E)" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.22)", borderRadius: "100px", padding: "4px 16px", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#4ADE80", letterSpacing: "0.04em" }}>Quiénes somos</span>
          </div>
          <h1 style={{ ...h2Style, fontSize: "clamp(2.4rem, 5vw, 3.5rem)", margin: "0 0 1.5rem" }}>
            Nacimos para resolver un problema real
          </h1>
          <p style={{ fontSize: "18px", color: "#94A3B8", lineHeight: 1.75, margin: 0 }}>
            Ledgera surgió de la frustración de inversores chilenos que enfrentaban la normativa del SII sin ninguna herramienta local. Planillas Excel, cálculos manuales y la incertidumbre de saber si el número era correcto. Decidimos construir la solución que nos hubiera gustado tener.
          </p>
        </div>
      </section>

      {/* ── Misión y Visión ─────────────────────────────────────────────────── */}
      <section style={{ padding: "5rem 2rem", background: "#0A1F2E" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "3rem" }}>

            {/* Misión */}
            <div style={{ background: "rgba(22,163,74,0.05)", border: "1px solid rgba(22,163,74,0.18)", borderRadius: "20px", padding: "2.5rem" }}>
              <div style={{ width: 48, height: 48, borderRadius: "12px", background: "rgba(22,163,74,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
                </svg>
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#4ADE80", letterSpacing: "0.08em", marginBottom: "10px" }}>MISIÓN</div>
              <h2 style={{ ...h3Style, fontSize: "22px", margin: "0 0 14px" }}>
                Cumplimiento tributario accesible para todos
              </h2>
              <p style={{ fontSize: "16px", color: "#94A3B8", margin: 0, lineHeight: 1.75 }}>
                Que cualquier persona en Chile pueda declarar sus criptomonedas correctamente al SII, sin necesitar ser contador ni experto tributario. Hacemos que el cumplimiento sea simple, exacto y al alcance de cualquier inversor.
              </p>
            </div>

            {/* Visión */}
            <div style={{ background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.18)", borderRadius: "20px", padding: "2.5rem" }}>
              <div style={{ width: 48, height: 48, borderRadius: "12px", background: "rgba(14,165,233,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" /><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /><path d="M12 5v2M12 17v2M5 12H3M21 12h-2" />
                </svg>
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#38BDF8", letterSpacing: "0.08em", marginBottom: "10px" }}>VISIÓN</div>
              <h2 style={{ ...h3Style, fontSize: "22px", margin: "0 0 14px" }}>
                El estándar de confianza cripto en Latinoamérica
              </h2>
              <p style={{ fontSize: "16px", color: "#94A3B8", margin: 0, lineHeight: 1.75 }}>
                Ser la plataforma de referencia para el cumplimiento tributario de criptoactivos en la región, reconocida por su precisión técnica, trazabilidad verificable e independencia regulatoria, sin importar el país donde el usuario opere.
              </p>
            </div>
          </div>

          {/* Para quién */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "2.5rem", marginBottom: "3rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "12px", background: "rgba(124,58,237,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 style={{ ...h3Style, fontSize: "20px" }}>Para quién construimos Ledgera</h3>
            <p style={{ fontSize: "16px", color: "#94A3B8", margin: "0 0 1.5rem", lineHeight: 1.75 }}>
              Tres perfiles, una sola plataforma adaptada a cada necesidad.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              {[
                { who: "Inversores individuales", desc: "Personas que compran y venden cripto y necesitan saber exactamente cuánto deben declarar al SII cada año." },
                { who: "Contadores y asesores", desc: "Profesionales que gestionan múltiples clientes con criptoactivos y necesitan reportes exportables y auditables." },
                { who: "Empresas con criptoactivos", desc: "Organizaciones que operan en cripto y requieren conciliación contable, trazabilidad completa y cumplimiento institucional." },
              ].map((item) => (
                <div key={item.who} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.12)", borderRadius: "14px", padding: "1.5rem" }}>
                  <div style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "15px", fontWeight: 700, color: "#E2E8F0", marginBottom: "8px" }}>{item.who}</div>
                  <p style={{ fontSize: "14px", color: "#94A3B8", margin: 0, lineHeight: 1.65 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pilares */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {PILLARS.map((p) => (
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
      <section style={{ padding: "5rem 2rem", background: "#071520", textAlign: "center" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ ...h2Style, fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)", margin: "0 0 1rem" }}>
            Empieza a declarar con confianza
          </h2>
          <p style={{ fontSize: "17px", color: "#94A3B8", lineHeight: 1.7, margin: "0 0 2.5rem" }}>
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

      {/* ── Footer mínimo ───────────────────────────────────────────────────── */}
      <footer style={{ padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>
          © {new Date().getFullYear()} Ledgera · Todos los derechos reservados ·{" "}
          <Link href="/bienvenida" style={{ color: "#475569" }}>Volver al inicio</Link>
        </p>
      </footer>

    </div>
  );
}
