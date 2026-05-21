"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const WHATSAPP_URL =
  "https://api.whatsapp.com/send/?phone=56972871569&text=Hola%2C+tengo+una+consulta+sobre+Ledgera&type=phone_number";

const NAV_LINKS = [
  { label: "Quiénes somos", href: "/quienes-somos" },
  { label: "Cómo funciona", href: "/como-funciona" },
  { label: "Planes", href: "/planes" },
  { label: "Preguntas", href: "/preguntas" },
  { label: "Blog", href: "/blog" },
];

export default function ComoFuncionaPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
              <Link key={item.label} href={item.href} style={{ fontSize: "14px", fontWeight: item.href === "/como-funciona" ? 600 : 500, color: item.href === "/como-funciona" ? "#4ADE80" : "#94A3B8", padding: "6px 14px", borderRadius: "8px", textDecoration: "none" }}>
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
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#4ADE80", letterSpacing: "0.04em" }}>Cómo funciona</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "clamp(2.2rem, 5vw, 3.2rem)", fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 1.25rem" }}>
            3 pasos para declarar sin errores
          </h1>
          <p style={{ fontSize: "17px", color: "#94A3B8", lineHeight: 1.75, margin: "0 0 2rem" }}>
            De tus movimientos en el exchange a tu declaración verificable ante el SII, en minutos. Sin contadores, sin planillas, sin errores.
          </p>
          <Link href="/register" style={{ display: "inline-block", fontSize: "15px", fontWeight: 700, color: "#fff", padding: "13px 28px", borderRadius: "10px", background: "#16A34A", textDecoration: "none" }}>
            Empezar gratis
          </Link>
        </div>
      </section>

      {/* ── Pasos ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem", background: "#0A1F2E" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>

            {/* Paso 01 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center", padding: "3rem", background: "rgba(22,163,74,0.04)", border: "1px solid rgba(22,163,74,0.15)", borderRadius: "20px", marginBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.25rem" }}>
                  <span style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "56px", fontWeight: 800, color: "rgba(22,163,74,0.25)", lineHeight: 1 }}>01</span>
                  <div style={{ width: 48, height: 48, borderRadius: "12px", background: "rgba(22,163,74,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                </div>
                <h2 style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "26px", fontWeight: 800, color: "#F1F5F9", margin: "0 0 12px", lineHeight: 1.2 }}>
                  Registra tus movimientos
                </h2>
                <p style={{ fontSize: "16px", color: "#94A3B8", margin: 0, lineHeight: 1.75 }}>
                  Importa tu historial en CSV desde Binance, Buda u Orionx, o ingresa cada operación manualmente. Ledgera acepta compras, ventas e intercambios de cualquier criptomoneda.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {["Importación CSV desde exchanges", "Ingreso manual de operaciones", "Compras, ventas e intercambios", "Múltiples criptomonedas en simultáneo"].map((feat) => (
                  <div key={feat} style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span style={{ fontSize: "14px", color: "#CBD5E1" }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Paso 02 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center", padding: "3rem", background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "20px", marginBottom: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {["Método FIFO determinista", "Tipo de cambio BCCh oficial por fecha", "Costo base y ganancia por operación", "Clasificación automática según SII"].map((feat) => (
                  <div key={feat} style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span style={{ fontSize: "14px", color: "#CBD5E1" }}>{feat}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.25rem" }}>
                  <span style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "56px", fontWeight: 800, color: "rgba(124,58,237,0.25)", lineHeight: 1 }}>02</span>
                  <div style={{ width: 48, height: 48, borderRadius: "12px", background: "rgba(124,58,237,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </div>
                </div>
                <h2 style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "26px", fontWeight: 800, color: "#F1F5F9", margin: "0 0 12px", lineHeight: 1.2 }}>
                  El motor FIFO calcula todo
                </h2>
                <p style={{ fontSize: "16px", color: "#94A3B8", margin: 0, lineHeight: 1.75 }}>
                  Ledgera aplica el método FIFO con el tipo de cambio oficial del Banco Central de Chile de cada fecha. Determina tu costo base, ganancia realizada y clasifica cada evento tributario según la normativa del SII automáticamente.
                </p>
              </div>
            </div>

            {/* Paso 03 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center", padding: "3rem", background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "20px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.25rem" }}>
                  <span style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "56px", fontWeight: 800, color: "rgba(245,158,11,0.25)", lineHeight: 1 }}>03</span>
                  <div style={{ width: 48, height: 48, borderRadius: "12px", background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M9 15l2 2 4-4" />
                    </svg>
                  </div>
                </div>
                <h2 style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "26px", fontWeight: 800, color: "#F1F5F9", margin: "0 0 12px", lineHeight: 1.2 }}>
                  Descarga tu DDJJ verificable
                </h2>
                <p style={{ fontSize: "16px", color: "#94A3B8", margin: 0, lineHeight: 1.75 }}>
                  Genera tu declaración en PDF o CSV con código único y hash de integridad SHA-256. El reporte es verificable públicamente y sirve como respaldo ante una fiscalización del SII.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {["PDF y CSV descargables", "Hash SHA-256 de integridad", "Código QR de verificación pública", "Válido como respaldo ante el SII"].map((feat) => (
                  <div key={feat} style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span style={{ fontSize: "14px", color: "#CBD5E1" }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Módulos de la plataforma ─────────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem", background: "#071520" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h2 style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)", fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.025em", margin: "0 0 0.75rem" }}>
              Todo lo que necesitas en un solo lugar
            </h2>
            <p style={{ fontSize: "16px", color: "#94A3B8", margin: 0 }}>
              Ledgera automatiza el proceso completo desde el movimiento hasta el reporte SII.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {[
              {
                label: "Portafolio",
                description: "Registra compras y ventas de cualquier criptomoneda. Control total de tu historial de operaciones.",
                accent: "#16A34A",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  </svg>
                ),
              },
              {
                label: "Motor FIFO",
                description: "Calcula automáticamente el costo base y la ganancia realizada. Determinista, auditable y con tipo de cambio BCCh.",
                accent: "#7C3AED",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                ),
              },
              {
                label: "Tributario",
                description: "Clasifica eventos según normativa SII. Genera reportes verificables con código único para tu declaración.",
                accent: "#F59E0B",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                ),
              },
              {
                label: "Auditoría",
                description: "Trazabilidad completa de cada período tributario. Cierre, reapertura y hash de integridad inmutable.",
                accent: "#0EA5E9",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "1.75rem" }}>
                <div style={{ width: 46, height: 46, borderRadius: "10px", background: `${item.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
                  {item.icon}
                </div>
                <h3 style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "18px", fontWeight: 700, color: "#F1F5F9", margin: "0 0 10px" }}>
                  {item.label}
                </h3>
                <p style={{ fontSize: "15px", color: "#94A3B8", margin: 0, lineHeight: 1.65 }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Por qué FIFO ────────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem", background: "#0A1F2E" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: "20px", padding: "3rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
              <div style={{ width: 44, height: 44, borderRadius: "10px", background: "rgba(124,58,237,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "22px", fontWeight: 800, color: "#F1F5F9", margin: 0 }}>
                ¿Por qué FIFO y no otro método?
              </h2>
            </div>
            <p style={{ fontSize: "16px", color: "#94A3B8", lineHeight: 1.8, margin: "0 0 1.5rem" }}>
              El SII no ha establecido un método específico para criptomonedas, pero el criterio FIFO (First In, First Out) es el más aceptado y auditado internacionalmente. Significa que la primera unidad que compraste es la primera que vendes — lo que determina el costo base de cada venta.
            </p>
            <p style={{ fontSize: "16px", color: "#94A3B8", lineHeight: 1.8, margin: 0 }}>
              Sin FIFO correcto, tu base imponible puede estar inflada o deflada, lo que resulta en multas o pagos en exceso. Ledgera implementa FIFO determinista: el mismo conjunto de datos siempre produce el mismo resultado, lo que permite que cualquier auditor verifique tu declaración.
            </p>
            <div style={{ marginTop: "1.5rem" }}>
              <Link href="/blog/metodo-fifo-criptomonedas-chile" style={{ fontSize: "14px", color: "#A78BFA", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                Leer: El método FIFO y las criptomonedas →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tipo de cambio ──────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem", background: "#071520" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.18)", borderRadius: "20px", padding: "3rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
              <div style={{ width: 44, height: 44, borderRadius: "10px", background: "rgba(14,165,233,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "22px", fontWeight: 800, color: "#F1F5F9", margin: 0 }}>
                Tipo de cambio oficial BCCh
              </h2>
            </div>
            <p style={{ fontSize: "16px", color: "#94A3B8", lineHeight: 1.8, margin: "0 0 1.5rem" }}>
              Todas las conversiones a pesos chilenos se realizan con el tipo de cambio publicado por el Banco Central de Chile (BCCh) para la fecha exacta de cada operación. Esto es fundamental: el SII exige valorizar activos en CLP al momento de la transacción.
            </p>
            <p style={{ fontSize: "16px", color: "#94A3B8", lineHeight: 1.8, margin: 0 }}>
              Usar tasas aproximadas o promedio puede invalidar tu declaración. Ledgera conecta directamente con la fuente oficial para que cada número sea trazable y verificable.
            </p>
            <div style={{ marginTop: "1.5rem" }}>
              <Link href="/blog/tipo-cambio-bcch-criptomonedas" style={{ fontSize: "14px", color: "#38BDF8", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                Leer: Tipo de cambio BCCh para criptomonedas →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem", background: "#0A1F2E", textAlign: "center" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)", fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.025em", margin: "0 0 1rem" }}>
            Listo para declarar correctamente
          </h2>
          <p style={{ fontSize: "17px", color: "#94A3B8", lineHeight: 1.7, margin: "0 0 2rem" }}>
            Empieza gratis. Sin tarjeta, sin compromiso.
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

      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Volver arriba"
          style={{ position: "fixed", bottom: "92px", right: "28px", width: "44px", height: "44px", borderRadius: "50%", background: "rgba(10,31,46,0.92)", border: "1px solid rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 998, backdropFilter: "blur(8px)" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 13V5M5 9l4-4 4 4" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
        style={{ position: "fixed", bottom: "28px", right: "28px", width: "52px", height: "52px", borderRadius: "50%", background: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", zIndex: 999 }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}
