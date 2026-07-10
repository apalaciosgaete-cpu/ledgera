"use client";

import Link from "next/link";
import Logo from "@/components/brand/Logo";
import { CONSENT_POLICY_VERSION, openPrivacyPreferences } from "@/lib/privacy/consent";

export default function CookiesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-elev)", color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>
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
        <Link href="/" style={{ color: "var(--text-soft)", fontSize: "0.85rem", textDecoration: "none" }}>
          ← Volver al inicio
        </Link>
      </nav>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "4rem 2rem 6rem" }}>
        <header style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: "999px",
              padding: "0.3rem 1rem",
              fontSize: "0.78rem",
              color: "var(--accent)",
              marginBottom: "1.5rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Documento legal
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 1rem", lineHeight: 1.15 }}>
            Política de Cookies
          </h1>
          <p style={{ color: "var(--text-soft)", fontSize: "0.9rem" }}>
            Última actualización: 9 de julio de 2026 · Versión 2.0 · Consentimiento {CONSENT_POLICY_VERSION}
          </p>
        </header>

        <InfoBox>
          LEDGERA aplica un modelo de consentimiento previo para cookies y tecnologías no esenciales. Puedes aceptar, rechazar o configurar por categoría; rechazar no esenciales es tan simple como aceptar.
        </InfoBox>

        <LegalSection title="1. Qué son las cookies y tecnologías similares">
          <p>
            Las cookies son pequeños archivos que un sitio o aplicación web almacena en el navegador. También usamos tecnologías equivalentes, como localStorage, almacenamiento de sesión y SDKs de medición, cuando cumplen una finalidad técnica o funcional.
          </p>
          <p>
            En LEDGERA las cookies necesarias permiten operar la plataforma. Las cookies funcionales y analíticas solo se activan si das tu consentimiento expreso desde el banner o desde este panel.
          </p>
        </LegalSection>

        <LegalSection title="2. Categorías utilizadas por LEDGERA">
          <CookieTable
            rows={[
              {
                category: "Estrictamente necesarias",
                purpose: "Inicio de sesión, seguridad, prevención de fraude, protección CSRF, disponibilidad y funcionamiento básico.",
                examples: "Tokens de sesión, cookies de seguridad, preferencias técnicas mínimas.",
                legalBase: "Ejecución del contrato, seguridad e interés legítimo. Siempre activas.",
              },
              {
                category: "Funcionales",
                purpose: "Recordar preferencias de visualización o configuración para mejorar la experiencia dentro de la aplicación.",
                examples: "Preferencias de interfaz, período de trabajo o configuración no esencial.",
                legalBase: "Consentimiento revocable.",
              },
              {
                category: "Analíticas",
                purpose: "Medición agregada de uso para mejorar rendimiento, usabilidad y estabilidad.",
                examples: "Vercel Analytics, Speed Insights, Google Analytics o PostHog, solo cuando estén configurados y consentidos.",
                legalBase: "Consentimiento revocable.",
              },
              {
                category: "Publicitarias",
                purpose: "Seguimiento para publicidad comportamental o perfiles comerciales externos.",
                examples: "No utilizadas actualmente por LEDGERA.",
                legalBase: "No aplica mientras la categoría no se use.",
              },
            ]}
          />
        </LegalSection>

        <LegalSection title="3. Gestión del consentimiento">
          <p>
            El consentimiento queda asociado a una versión de política. Si cambia la finalidad del tratamiento, las categorías o los proveedores relevantes, LEDGERA puede solicitar una nueva decisión.
          </p>
          <p>
            Puedes modificar o retirar tu consentimiento en cualquier momento. El retiro no afecta la licitud del tratamiento realizado antes de la revocación.
          </p>
          <button
            type="button"
            onClick={openPrivacyPreferences}
            style={{
              marginTop: "0.5rem",
              border: "1px solid rgba(63,166,135,0.45)",
              background: "rgba(63,166,135,0.13)",
              color: "var(--text)",
              borderRadius: "9px",
              padding: "0.8rem 1.1rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Abrir preferencias de privacidad
          </button>
        </LegalSection>

        <LegalSection title="4. Registro auditable">
          <p>
            Para demostrar la decisión adoptada por el titular, LEDGERA registra fecha, versión de política, categorías aceptadas o rechazadas, un identificador seudónimo y una huella criptográfica de integridad. Este registro se usa exclusivamente como prueba de cumplimiento y defensa de derechos.
          </p>
          <p>
            No guardamos en claro la dirección IP ni el agente de usuario en el registro de consentimiento. Cuando se requiere trazabilidad técnica, se almacena una huella hash minimizada.
          </p>
        </LegalSection>

        <LegalSection title="5. Proveedores y transferencias internacionales">
          <p>
            Algunos proveedores tecnológicos pueden operar fuera de Chile. En esos casos, LEDGERA informa el destinatario en su Política de Privacidad y exige garantías contractuales o mecanismos equivalentes de protección para la transferencia internacional.
          </p>
          <ProviderTable
            rows={[
              ["Vercel", "Hosting, despliegue, analítica opcional y rendimiento", "Estados Unidos / infraestructura global"],
              ["Cloudflare", "CDN, seguridad, protección DDoS y disponibilidad", "Estados Unidos / infraestructura global"],
              ["Google Analytics", "Analítica web opcional, si está configurada", "Estados Unidos / infraestructura global"],
              ["PostHog", "Analítica de producto opcional, si está configurada", "Estados Unidos / Unión Europea según configuración"],
            ]}
          />
        </LegalSection>

        <LegalSection title="6. Cómo bloquear cookies desde el navegador">
          <p>
            También puedes bloquear o eliminar cookies desde la configuración del navegador. Si bloqueas cookies estrictamente necesarias, el inicio de sesión y ciertas funciones de LEDGERA pueden dejar de operar correctamente.
          </p>
          <ul style={{ paddingLeft: "1.5rem", color: "var(--text-soft)", lineHeight: 1.8 }}>
            <li>Chrome: configuración de privacidad y seguridad.</li>
            <li>Safari: privacidad y administración de datos de sitios web.</li>
            <li>Firefox: privacidad y protección contra rastreo.</li>
            <li>Edge: cookies y permisos del sitio.</li>
          </ul>
        </LegalSection>

        <LegalSection title="7. Contacto">
          <p>
            Para consultas o solicitudes sobre privacidad y cookies, escribe a {" "}
            <a href="mailto:admin@ledgera.cl" style={{ color: "var(--accent)" }}>
              admin@ledgera.cl
            </a>{" "}
            con el asunto “Privacidad y cookies”.
          </p>
        </LegalSection>

        <div style={{ marginTop: "3rem", padding: "1.5rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <span style={{ color: "var(--text-soft)", fontSize: "0.85rem", alignSelf: "center" }}>Ver también:</span>
          <Link href="/privacidad" style={{ color: "var(--accent)", fontSize: "0.85rem", textDecoration: "none" }}>
            Política de privacidad →
          </Link>
          <Link href="/terminos" style={{ color: "var(--accent)", fontSize: "0.85rem", textDecoration: "none" }}>
            Términos y condiciones →
          </Link>
        </div>
      </main>
    </div>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.4rem" }}>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", color: "var(--text-soft)", fontSize: "0.92rem", lineHeight: 1.75 }}>
        {children}
      </div>
    </section>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "2.4rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: "12px", padding: "1.1rem 1.25rem", color: "var(--text-soft)", fontSize: "0.92rem", lineHeight: 1.7 }}>
      {children}
    </div>
  );
}

function CookieTable({
  rows,
}: {
  rows: { category: string; purpose: string; examples: string; legalBase: string }[];
}) {
  return (
    <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", color: "var(--text-soft)" }}>
        <thead>
          <tr>
            {["Categoría", "Finalidad", "Ejemplos", "Base"].map((header) => (
              <th key={header} style={{ textAlign: "left", padding: "0.75rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "var(--text)", fontWeight: 700, whiteSpace: "nowrap" }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.category}>
              <td style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "var(--text)", fontWeight: 700 }}>{row.category}</td>
              <td style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{row.purpose}</td>
              <td style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{row.examples}</td>
              <td style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{row.legalBase}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProviderTable({ rows }: { rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", color: "var(--text-soft)" }}>
        <thead>
          <tr>
            {["Proveedor", "Uso", "Ubicación"].map((header) => (
              <th key={header} style={{ textAlign: "left", padding: "0.75rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "var(--text)", fontWeight: 700, whiteSpace: "nowrap" }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([provider, use, country]) => (
            <tr key={provider}>
              <td style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "var(--text)", fontWeight: 700 }}>{provider}</td>
              <td style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{use}</td>
              <td style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{country}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
