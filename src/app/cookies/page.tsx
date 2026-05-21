"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/brand/Logo";

const WHATSAPP_URL = "https://api.whatsapp.com/send/?phone=56972871569&text=Hola%2C+tengo+una+consulta+sobre+Ledgera&type=phone_number";

export default function TerminosPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%)",
        color: "#e2e8f0",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* NAV */}
      <nav
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "1rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: "rgba(10,10,15,0.9)",
          backdropFilter: "blur(12px)",
          zIndex: 50,
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Logo />
        </Link>
        <Link
          href="/"
          style={{
            color: "#94a3b8",
            fontSize: "0.85rem",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e2e8f0")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          ← Volver al inicio
        </Link>
      </nav>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "4rem 2rem 6rem" }}>
        <div style={{ marginBottom: "3rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: "999px",
              padding: "0.3rem 1rem",
              fontSize: "0.78rem",
              color: "#818cf8",
              marginBottom: "1.5rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Documento legal
          </div>
          <h1
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 800,
              color: "#f8fafc",
              margin: "0 0 1rem",
              lineHeight: 1.15,
            }}
          >
            Términos y Condiciones
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            Última actualización: 8 de mayo de 2026 · Versión 1.0
          </p>
        </div>

        <LegalSection title="1. Identificación del prestador">
          <p>
            <strong style={{ color: "#e2e8f0" }}>Ledgera</strong> (en adelante, "la Plataforma") es
            un servicio de software como servicio (SaaS) operado por{" "}
            <strong style={{ color: "#e2e8f0" }}>Ledgera SpA</strong>, empresa constituida en Chile,
            con domicilio en la Región Metropolitana, correo de contacto:{" "}
            <a href="mailto:admin@ledgera.cl" style={{ color: "#818cf8" }}>
              admin@ledgera.cl
            </a>
            .
          </p>
          <p>
            La Plataforma está diseñada para asistir a personas naturales y jurídicas en la gestión,
            clasificación y reporte de operaciones con activos digitales (criptomonedas) frente al
            Servicio de Impuestos Internos (SII) de Chile.
          </p>
        </LegalSection>

        <LegalSection title="2. Aceptación de los términos">
          <p>
            Al registrarse, acceder o utilizar cualquier función de Ledgera, el Usuario declara haber
            leído, comprendido y aceptado en su totalidad los presentes Términos y Condiciones, así
            como la{" "}
            <Link href="/privacidad" style={{ color: "#818cf8" }}>
              Política de Privacidad
            </Link>{" "}
            y la{" "}
            <Link href="/cookies" style={{ color: "#818cf8" }}>
              Política de Cookies
            </Link>
            .
          </p>
          <p>
            Si no está de acuerdo con alguna de las condiciones, deberá abstenerse de utilizar la
            Plataforma.
          </p>
        </LegalSection>

        <LegalSection title="3. Descripción del servicio">
          <p>Ledgera ofrece las siguientes funcionalidades principales:</p>
          <ul style={{ paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>Importación y clasificación de movimientos de activos digitales mediante CSV o integración automática.</li>
            <li>Aplicación del método FIFO (First In, First Out) para el cálculo del costo tributario según instrucciones del SII.</li>
            <li>Generación de reportes de ganancias y pérdidas de capital para declaración de impuestos.</li>
            <li>Panel de control tributario con indicadores de riesgo, PnL y alertas accionables.</li>
            <li>Auditoría inmutable de eventos tributarios y cierres de período.</li>
            <li>Motor de conversión FX basado en datos del Banco Central de Chile (BCCh).</li>
          </ul>
          <p>
            Ledgera es una{" "}
            <strong style={{ color: "#e2e8f0" }}>herramienta de asistencia tributaria</strong> y no
            reemplaza la asesoría profesional de un contador, abogado o asesor tributario habilitado.
          </p>
        </LegalSection>

        <LegalSection title="4. Registro y cuenta de usuario">
          <p>El acceso a las funciones avanzadas requiere la creación de una cuenta. El Usuario se compromete a:</p>
          <ul style={{ paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>Proporcionar información veraz, actualizada y completa durante el registro.</li>
            <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
            <li>Notificar de inmediato a Ledgera ante cualquier uso no autorizado de su cuenta.</li>
            <li>Ser el único responsable de todas las actividades realizadas bajo su cuenta.</li>
          </ul>
          <p>
            Ledgera se reserva el derecho de suspender o cancelar cuentas que incumplan estos
            Términos, presenten información falsa o realicen un uso fraudulento de la Plataforma.
          </p>
        </LegalSection>

        <LegalSection title="5. Planes, precios y facturación">
          <p>
            Ledgera ofrece distintos planes de suscripción, cuyos precios y características se
            detallan en la página de precios de la Plataforma. Los montos se expresan en pesos
            chilenos (CLP) e incluyen IVA cuando corresponda.
          </p>
          <p>
            El cobro se realiza de forma anticipada al inicio de cada período (mensual o anual). La
            falta de pago habilita a Ledgera a restringir el acceso al servicio sin previo aviso.
          </p>
          <p>
            Se podrá solicitar reembolso dentro de los primeros{" "}
            <strong style={{ color: "#e2e8f0" }}>7 días corridos</strong> desde la contratación del
            plan, siempre que no se hayan generado reportes tributarios durante ese período.
          </p>
        </LegalSection>

        <LegalSection title="6. Uso aceptable">
          <p>El Usuario se compromete a NO utilizar la Plataforma para:</p>
          <ul style={{ paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>Ingresar datos falsos, manipulados o que induzcan a error en las declaraciones tributarias.</li>
            <li>Evadir, eludir o defraudar al SII u otras autoridades fiscales.</li>
            <li>Actividades relacionadas con lavado de activos, financiamiento del terrorismo o cualquier actividad ilícita.</li>
            <li>Realizar ingeniería inversa, descompilar o intentar acceder al código fuente de la Plataforma.</li>
            <li>Revender, sublicenciar o ceder el acceso a terceros sin autorización expresa de Ledgera.</li>
          </ul>
        </LegalSection>

        <LegalSection title="7. Responsabilidad y limitaciones">
          <p>
            Ledgera realiza sus mejores esfuerzos para mantener la Plataforma operativa, segura y
            actualizada conforme a la normativa SII vigente. Sin embargo,{" "}
            <strong style={{ color: "#e2e8f0" }}>no garantiza</strong>:
          </p>
          <ul style={{ paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>Que los cálculos generados sean aceptados sin observaciones por el SII en todos los casos.</li>
            <li>La disponibilidad ininterrumpida del servicio.</li>
            <li>Que los tipos de cambio FX provistos por el BCCh correspondan exactamente a los exigidos en una fiscalización específica.</li>
          </ul>
          <p>
            La responsabilidad máxima de Ledgera frente al Usuario no podrá exceder el monto
            equivalente a los pagos realizados en los últimos 3 meses anteriores al evento que genera
            el daño.
          </p>
        </LegalSection>

        <LegalSection title="8. Propiedad intelectual">
          <p>
            Todos los derechos de propiedad intelectual sobre la Plataforma, incluyendo diseño,
            código, algoritmos, marca, logotipos y contenidos, son de titularidad exclusiva de
            Ledgera SpA y están protegidos por la legislación chilena e internacional aplicable.
          </p>
          <p>
            El Usuario recibe una licencia limitada, no exclusiva e intransferible para usar la
            Plataforma durante la vigencia de su suscripción.
          </p>
        </LegalSection>

        <LegalSection title="9. Modificaciones">
          <p>
            Ledgera podrá modificar estos Términos en cualquier momento. Los cambios serán notificados
            al correo registrado con al menos{" "}
            <strong style={{ color: "#e2e8f0" }}>10 días de anticipación</strong> antes de su entrada
            en vigor.
          </p>
        </LegalSection>

        <LegalSection title="10. Ley aplicable y jurisdicción">
          <p>
            Los presentes Términos se rigen por las leyes de la República de Chile. Cualquier
            controversia será sometida a la jurisdicción de los Tribunales Ordinarios de Justicia de
            Santiago, Chile.
          </p>
        </LegalSection>

        <LegalSection title="11. Contacto">
          <p>
            Para consultas:{" "}
            <a href="mailto:admin@ledgera.cl" style={{ color: "#818cf8" }}>
              admin@ledgera.cl
            </a>
          </p>
        </LegalSection>

        <div
          style={{
            marginTop: "3rem",
            padding: "1.5rem",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <span style={{ color: "#64748b", fontSize: "0.85rem", alignSelf: "center" }}>Ver también:</span>
          <Link href="/privacidad" style={{ color: "#818cf8", fontSize: "0.85rem", textDecoration: "none" }}>
            Política de Privacidad →
          </Link>
          <Link href="/cookies" style={{ color: "#818cf8", fontSize: "0.85rem", textDecoration: "none" }}>
            Política de Cookies →
          </Link>
        </div>
      </main>

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
                  <a href="https://api.whatsapp.com/send/?phone=56972871569&text=Hola%2C+tengo+una+consulta+sobre+Ledgera&type=phone_number" target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>WhatsApp soporte</a>
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

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "#f1f5f9",
          marginBottom: "1rem",
          paddingBottom: "0.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
          color: "#94a3b8",
          fontSize: "0.92rem",
          lineHeight: 1.75,
        }}
      >
        {children}
      </div>
    </section>
  );
}