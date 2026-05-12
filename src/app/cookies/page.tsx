"use client";

import Link from "next/link";
import Logo from "@/components/brand/Logo";

export default function TerminosPage() {
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

      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "2rem",
          textAlign: "center",
          color: "#475569",
          fontSize: "0.8rem",
        }}
      >
        © {new Date().getFullYear()} Ledgera SpA · Santiago, Chile
      </footer>
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