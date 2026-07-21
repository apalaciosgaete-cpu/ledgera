"use client";

import Link from "next/link";
import Logo from "@/components/brand/Logo";
import { openPrivacyPreferences } from "@/lib/privacy/consent";

export default function PrivacidadPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-elev)", color: "var(--text)", fontFamily: "'Manrope', system-ui, sans-serif" }}>
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

      <main style={{ maxWidth: "920px", margin: "0 auto", padding: "4rem 2rem 6rem" }}>
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
            Política de Privacidad
          </h1>
          <p style={{ color: "var(--text-soft)", fontSize: "0.9rem" }}>
            Última actualización: 9 de julio de 2026 · Versión 3.0 · Preparación Ley 21.719
          </p>
        </header>

        <InfoBox tone="indigo">
          Esta Política explica cómo LEDGERA trata datos personales conforme a la Ley N° 19.628, modificada por la Ley N° 21.719, y a los estándares de preparación exigibles antes de su entrada en vigencia plena el 1 de diciembre de 2026.
        </InfoBox>

        <LegalSection title="1. Responsable del tratamiento y canal de privacidad">
          <p>
            El responsable del tratamiento es LEDGERA, plataforma web de apoyo tributario para operaciones con activos digitales en Chile. Para consultas, solicitudes o reclamos sobre datos personales, el canal habilitado es {" "}
            <a href="mailto:admin@ledgera.cl" style={{ color: "var(--accent)" }}>
              admin@ledgera.cl
            </a>{" "}
            con asunto “Protección de datos”.
          </p>
          <p>
            Si una solicitud requiere verificar identidad o representación, LEDGERA podrá pedir antecedentes estrictamente necesarios para confirmar que quien solicita es el titular de los datos o su representante autorizado.
          </p>
        </LegalSection>

        <LegalSection title="2. Principios aplicados">
          <PrincipleGrid
            rows={[
              ["Licitud", "Cada tratamiento se asocia a una base de legitimidad: contrato, obligación legal, consentimiento o interés legítimo debidamente ponderado."],
              ["Finalidad", "Los datos se usan para finalidades determinadas, explícitas y compatibles con el servicio tributario contratado."],
              ["Proporcionalidad", "Se solicitan y conservan solo los datos necesarios para operar, calcular, auditar o cumplir obligaciones legales."],
              ["Transparencia", "La app informa categorías de datos, finalidades, proveedores, derechos y canales de ejercicio."],
              ["Seguridad", "Se aplican controles técnicos y organizativos, cifrado en tránsito, autenticación y registros de auditoría."],
              ["Responsabilidad", "El sistema mantiene trazabilidad de operaciones relevantes y prueba auditable de decisiones de consentimiento."],
            ]}
          />
        </LegalSection>

        <LegalSection title="3. Categorías de datos personales tratados">
          <DataTable
            headers={["Categoría", "Datos", "Origen"]}
            rows={[
              ["Identificación", "Nombre, correo electrónico, RUT cuando el usuario lo entrega, país y datos de contacto.", "Registro, perfil o comunicaciones del usuario."],
              ["Acceso y seguridad", "Hash de contraseña, token de sesión, configuración 2FA, eventos de acceso y alertas de seguridad.", "Generado por la plataforma."],
              ["Tributarios y financieros", "Operaciones de activos digitales, fechas, montos, exchanges, balances, costos, PnL, respaldos PDF/Excel y clasificaciones tributarias.", "Importaciones del usuario, archivos CSV, integraciones o carga manual."],
              ["Uso de la plataforma", "Flujos utilizados, eventos funcionales, logs de auditoría, preferencias y métricas agregadas.", "Uso normal de LEDGERA."],
              ["Técnicos", "Dirección IP o huella hash, navegador, sistema operativo, zona horaria, errores y telemetría de rendimiento.", "Captura técnica automática."],
              ["Facturación", "Plan, estado de suscripción, pagos, comprobantes y metadatos mínimos del proveedor de pago.", "Usuario y proveedor de pago."],
            ]}
          />
          <InfoBox tone="amber">
            Los datos tributarios y financieros pueden revelar aspectos de la situación económica del titular. Por eso LEDGERA los trata con estándar reforzado de confidencialidad, minimización, acceso restringido y trazabilidad, aunque no se usen para publicidad ni venta a terceros.
          </InfoBox>
        </LegalSection>

        <LegalSection title="4. Finalidades y bases de legitimidad">
          <DataTable
            headers={["Finalidad", "Base de legitimidad", "Ejemplos"]}
            rows={[
              ["Prestar el servicio contratado", "Ejecución del contrato", "Importar operaciones, calcular resultados, generar respaldos y mantener cuenta de usuario."],
              ["Cumplir obligaciones legales y tributarias", "Obligación legal", "Conservación de respaldos, trazabilidad y atención ante autoridades competentes cuando corresponda."],
              ["Seguridad y prevención de abuso", "Interés legítimo", "Autenticación, detección de accesos anómalos, antifraude, logs de seguridad."],
              ["Mejora de producto", "Consentimiento para analítica no esencial o interés legítimo en métricas internas estrictamente necesarias", "Medición agregada, rendimiento y estabilidad."],
              ["Comunicaciones comerciales opcionales", "Consentimiento revocable", "Novedades, ofertas o comunicaciones no indispensables para el servicio."],
              ["Atención de derechos del titular", "Obligación legal", "Registro y resolución de solicitudes de acceso, rectificación, supresión, oposición o portabilidad."],
            ]}
          />
        </LegalSection>

        <LegalSection title="5. Cookies, analítica y consentimiento">
          <p>
            Las cookies estrictamente necesarias se mantienen activas porque permiten iniciar sesión y operar la plataforma. Las categorías funcionales y analíticas se activan solo con consentimiento previo y pueden modificarse en cualquier momento.
          </p>
          <p>
            LEDGERA mantiene prueba auditable de la decisión: versión de política, fecha, categorías y huella criptográfica. No usa cookies publicitarias ni perfiles comerciales de terceros.
          </p>
          <button
            type="button"
            onClick={openPrivacyPreferences}
            style={{
              border: "1px solid rgba(63,166,135,0.45)",
              background: "rgba(63,166,135,0.13)",
              color: "var(--text)",
              borderRadius: "9px",
              padding: "0.8rem 1.1rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Gestionar preferencias de privacidad
          </button>
        </LegalSection>

        <LegalSection title="6. Decisiones automatizadas e indicadores">
          <p>
            LEDGERA genera cálculos e indicadores automatizados para asistir al usuario: clasificación de operaciones, cálculo de costo tributario, alertas de consistencia y reportes. Estos resultados son herramientas informativas y no sustituyen la revisión profesional ni la decisión final del usuario frente al SII.
          </p>
          <p>
            Cuando un cálculo automatizado pueda afectar significativamente la interpretación tributaria del usuario, este puede solicitar revisión, corrección o explicación mediante el canal de privacidad o los mecanismos internos de la app.
          </p>
        </LegalSection>

        <LegalSection title="7. Conservación de datos">
          <DataTable
            headers={["Dato", "Plazo referencial", "Fundamento"]}
            rows={[
              ["Cuenta e identificación", "Vigencia de la cuenta y plazo posterior necesario", "Ejecución del contrato, defensa de derechos y obligaciones legales."],
              ["Datos tributarios y respaldos", "Vigencia de la cuenta y hasta 5/6 años según prescripción tributaria aplicable", "Conservación de respaldo tributario y trazabilidad."],
              ["Logs de auditoría", "Plazo necesario para seguridad, integridad y defensa", "Prevención de fraude, prueba de operaciones y cumplimiento."],
              ["Consentimiento", "Mientras la prueba sea necesaria o hasta reemplazo por nueva versión", "Demostración de licitud del tratamiento basado en consentimiento."],
              ["Datos técnicos", "12 meses salvo incidente o obligación legal", "Seguridad, diagnóstico y disponibilidad."],
              ["Facturación", "Plazos contables, tributarios y contractuales aplicables", "Cumplimiento legal y gestión de pagos."],
            ]}
          />
        </LegalSection>

        <LegalSection title="8. Destinatarios y transferencias internacionales">
          <p>
            LEDGERA utiliza proveedores tecnológicos para hosting, seguridad, analítica opcional, correo, pagos o soporte. Cuando el proveedor trata datos por cuenta de LEDGERA, debe actuar como encargado del tratamiento y bajo instrucciones contractuales.
          </p>
          <DataTable
            headers={["Proveedor", "Rol", "Ubicación"]}
            rows={[
              ["Vercel", "Hosting, despliegue, rendimiento y analítica opcional", "Estados Unidos / infraestructura global"],
              ["Cloudflare", "CDN, seguridad, protección DDoS y disponibilidad", "Estados Unidos / infraestructura global"],
              ["Google", "Analítica opcional, verificación o servicios auxiliares cuando estén configurados", "Estados Unidos / infraestructura global"],
              ["PostHog", "Analítica de producto opcional cuando esté configurada", "Estados Unidos / Unión Europea según configuración"],
              ["Proveedor de pagos", "Confirmación de pago y suscripción; LEDGERA no almacena tarjetas", "Según proveedor contratado"],
              ["Autoridades competentes", "Entrega de información cuando exista obligación legal", "Chile"],
            ]}
          />
          <p>
            En transferencias internacionales se exigirán garantías adecuadas, acuerdos de procesamiento de datos u otros mecanismos equivalentes conforme a la normativa aplicable.
          </p>
        </LegalSection>

        <LegalSection title="9. Derechos del titular">
          <p>
            El titular puede ejercer, cuando proceda, los derechos de acceso, rectificación, supresión, oposición, portabilidad y otros derechos reconocidos por la normativa aplicable. También puede retirar consentimientos otorgados sin afectar la licitud del tratamiento previo al retiro.
          </p>
          <p>
            Para ejercerlos, escribe a {" "}
            <a href="mailto:admin@ledgera.cl" style={{ color: "var(--accent)" }}>
              admin@ledgera.cl
            </a>{" "}
            con el asunto “Ejercicio de derechos — Ley 21.719”, indicando el derecho solicitado y los antecedentes mínimos para identificar la cuenta o tratamiento relacionado.
          </p>
        </LegalSection>

        <LegalSection title="10. Seguridad de los datos">
          <PrincipleGrid
            rows={[
              ["Cifrado", "Tráfico protegido mediante HTTPS/TLS y resguardo de credenciales mediante hash o cifrado según corresponda."],
              ["Autenticación", "Sesiones controladas, 2FA disponible y controles de acceso por rol."],
              ["Trazabilidad", "Registros de auditoría para eventos tributarios, clasificación, declaraciones y consentimiento."],
              ["Minimización", "Solo se capturan datos necesarios para la finalidad informada."],
              ["Proveedor", "Uso de proveedores con medidas de seguridad y acuerdos contractuales pertinentes."],
              ["Incidentes", "Gestión interna de incidentes y comunicación cuando corresponda conforme a la normativa aplicable."],
            ]}
          />
        </LegalSection>

        <LegalSection title="11. Cambios de esta política">
          <p>
            LEDGERA podrá actualizar esta Política para reflejar cambios legales, técnicos, operativos o de proveedores. Cuando una modificación afecte finalidades, categorías o tratamientos basados en consentimiento, se podrá solicitar una nueva decisión al usuario.
          </p>
        </LegalSection>

        <div style={{ marginTop: "3rem", padding: "1.5rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <span style={{ color: "var(--text-soft)", fontSize: "0.85rem", alignSelf: "center" }}>Ver también:</span>
          <Link href="/cookies" style={{ color: "var(--accent)", fontSize: "0.85rem", textDecoration: "none" }}>
            Política de cookies →
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

function InfoBox({ children, tone }: { children: React.ReactNode; tone: "indigo" | "amber" }) {
  const isAmber = tone === "amber";
  return (
    <div style={{ margin: "1rem 0", background: isAmber ? "rgba(232,184,75,0.08)" : "rgba(99,102,241,0.08)", border: `1px solid ${isAmber ? "rgba(232,184,75,0.22)" : "rgba(99,102,241,0.18)"}`, borderRadius: "12px", padding: "1.1rem 1.25rem", color: "var(--text-soft)", fontSize: "0.92rem", lineHeight: 1.7 }}>
      {children}
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", color: "var(--text-soft)" }}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} style={{ textAlign: "left", padding: "0.75rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "var(--text)", fontWeight: 700, whiteSpace: "nowrap" }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${row[0]}-${cellIndex}`} style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.04)", color: cellIndex === 0 ? "var(--text)" : "var(--text-soft)", fontWeight: cellIndex === 0 ? 700 : 400 }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PrincipleGrid({ rows }: { rows: string[][] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.8rem" }}>
      {rows.map(([title, body]) => (
        <div key={title} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "0.95rem 1rem" }}>
          <p style={{ color: "var(--text)", fontWeight: 700, margin: "0 0 0.35rem", fontSize: "0.9rem" }}>{title}</p>
          <p style={{ color: "var(--text-soft)", margin: 0, fontSize: "0.83rem", lineHeight: 1.6 }}>{body}</p>
        </div>
      ))}
    </div>
  );
}
