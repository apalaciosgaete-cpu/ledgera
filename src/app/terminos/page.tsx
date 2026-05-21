"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/brand/Logo";

const WHATSAPP_URL =
  "https://api.whatsapp.com/send/?phone=56972871569&text=Hola%2C+tengo+una+consulta+sobre+Ledgera&type=phone_number";

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
        background:
          "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%)",
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
        <Link
          href="/"
          style={{ textDecoration: "none", display: "flex", alignItems: "center" }}
        >
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
        {/* ENCABEZADO */}
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
            Última actualización: 8 de mayo de 2026 · Versión 2.0
          </p>
        </div>

        {/* AVISO NORMATIVO */}
        <div
          style={{
            background: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.15)",
            borderRadius: "10px",
            padding: "1rem 1.4rem",
            marginBottom: "2.5rem",
          }}
        >
          <p style={{ color: "#a5b4fc", fontSize: "0.88rem", margin: 0, lineHeight: 1.7 }}>
            El presente documento constituye un contrato de adhesión en los términos del{" "}
            <strong style={{ color: "#c7d2fe" }}>Art. 16 de la Ley N° 19.496</strong> de
            Protección al Consumidor. Su aceptación se perfecciona electrónicamente conforme
            a la{" "}
            <strong style={{ color: "#c7d2fe" }}>Ley N° 19.799</strong> de Firma Electrónica.
            Resultan también aplicables la{" "}
            <strong style={{ color: "#c7d2fe" }}>Ley N° 21.719</strong> de Protección de
            Datos Personales, el{" "}
            <strong style={{ color: "#c7d2fe" }}>Código Civil</strong> y la normativa del{" "}
            <strong style={{ color: "#c7d2fe" }}>SII</strong> sobre activos digitales.
          </p>
        </div>

        {/* SECCIONES */}

        <LegalSection title="1. Identificación del prestador">
          <p>
            <strong style={{ color: "#e2e8f0" }}>Ledgera</strong> (en adelante,{" "}
            <em>"la Plataforma"</em>) es un servicio de software como servicio (SaaS)
            operado por{" "}
            <strong style={{ color: "#e2e8f0" }}>Ledgera SpA</strong>, sociedad por acciones
            constituida en la República de Chile, con domicilio en la Región Metropolitana.
          </p>
          <InfoBox>
            <strong>Correo:</strong>{" "}
            <a href="mailto:admin@ledgera.cl" style={{ color: "#818cf8" }}>
              admin@ledgera.cl
            </a>
            {"  ·  "}
            <strong>Web:</strong> ledgera.cl
          </InfoBox>
          <p>
            La Plataforma está diseñada para asistir a personas naturales y jurídicas en la
            gestión, clasificación y reporte de operaciones con activos digitales
            (criptomonedas) frente al Servicio de Impuestos Internos (SII) de Chile.
          </p>
        </LegalSection>

        <LegalSection title="2. Aceptación electrónica del contrato">
          <p>
            Al registrarse, acceder o utilizar cualquier función de Ledgera, el Usuario
            manifiesta su voluntad de contratar y declara haber leído, comprendido y aceptado
            en su totalidad los presentes Términos y Condiciones (en adelante, <em>"los Términos"</em>
            ), así como la{" "}
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
            Esta aceptación constituye una firma electrónica simple en los términos del{" "}
            <strong style={{ color: "#e2e8f0" }}>Art. 2 letra g) de la Ley N° 19.799</strong>{" "}
            de Firma Electrónica, y tiene plena validez jurídica equivalente a la firma
            manuscrita para estos efectos.
          </p>
          <p>
            Si el Usuario no está de acuerdo con alguna de las condiciones establecidas en los
            presentes Términos, deberá abstenerse de utilizar la Plataforma.
          </p>
        </LegalSection>

        <LegalSection title="3. Descripción del servicio">
          <p>Ledgera ofrece las siguientes funcionalidades principales:</p>
          <ul style={{ paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>
              Importación y clasificación de movimientos de activos digitales mediante
              archivos CSV o integración automática con exchanges.
            </li>
            <li>
              Aplicación del método FIFO (First In, First Out) para el cálculo del costo
              tributario, conforme a las instrucciones del SII (Circular N° 31/2021 y
              Circular N° 43/2021).
            </li>
            <li>
              Generación de reportes de ganancias y pérdidas de capital para la declaración
              anual de impuestos a la renta.
            </li>
            <li>
              Panel de control tributario con indicadores de riesgo, PnL y alertas
              accionables.
            </li>
            <li>
              Registro de auditoría inmutable de eventos tributarios y cierres de período.
            </li>
            <li>
              Motor de conversión de divisas basado en datos oficiales del Banco Central de
              Chile (BCCh).
            </li>
          </ul>
          <InfoBox color="amber">
            Ledgera es una{" "}
            <strong style={{ color: "#fcd34d" }}>herramienta de asistencia tributaria</strong>{" "}
            y no reemplaza la asesoría profesional de un contador, abogado o asesor
            tributario habilitado. El Usuario es el único responsable ante el SII por el
            contenido de sus declaraciones de impuestos.
          </InfoBox>
        </LegalSection>

        <LegalSection title="4. Registro y cuenta de usuario">
          <p>
            El acceso a las funciones avanzadas de la Plataforma requiere la creación de una
            cuenta personal. Al registrarse, el Usuario se compromete a:
          </p>
          <ul style={{ paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>
              Proporcionar información veraz, actualizada y completa durante el proceso de
              registro y mantenerla así durante toda la vigencia de la relación contractual.
            </li>
            <li>
              Mantener la confidencialidad de sus credenciales de acceso (correo electrónico
              y contraseña), siendo el único responsable de su custodia.
            </li>
            <li>
              Notificar de inmediato a Ledgera ante cualquier uso no autorizado de su cuenta
              o brecha de seguridad de la que tome conocimiento.
            </li>
            <li>
              Asumir plena responsabilidad por todas las actividades realizadas bajo su
              cuenta, incluso si fueron efectuadas por terceros con acceso a sus credenciales.
            </li>
          </ul>
          <p>
            Ledgera se reserva el derecho de suspender o cancelar cuentas que incumplan los
            presentes Términos, que presenten información falsa o que realicen un uso
            fraudulento de la Plataforma, sin perjuicio de las acciones legales que
            correspondan.
          </p>
        </LegalSection>

        <LegalSection title="5. Planes, precios y facturación">
          <p>
            Ledgera ofrece distintos planes de suscripción cuyos precios y características
            se detallan en la{" "}
            <Link href="/planes" style={{ color: "#818cf8" }}>
              página de planes
            </Link>
            . Todos los montos se expresan en pesos chilenos (CLP) e incluyen el Impuesto al
            Valor Agregado (IVA) cuando corresponda según la normativa tributaria vigente.
          </p>
          <p>
            El cobro se realiza de forma anticipada al inicio de cada período de
            suscripción (mensual o anual). El procesamiento de pagos es realizado por{" "}
            <strong style={{ color: "#e2e8f0" }}>MercadoPago</strong>, proveedor externo que
            opera bajo su propia política de privacidad y seguridad. Ledgera no almacena
            datos de tarjetas de crédito ni débito.
          </p>
          <p>
            La falta de pago al vencimiento del período vigente habilita a Ledgera a
            restringir el acceso al servicio. El Usuario será notificado previamente por
            correo electrónico antes de la restricción.
          </p>
        </LegalSection>

        <LegalSection title="6. Derecho a retracto — Ley N° 19.496">
          <div
            style={{
              background: "rgba(34,197,94,0.07)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: "10px",
              padding: "1rem 1.2rem",
              marginBottom: "0.5rem",
            }}
          >
            <p style={{ color: "#86efac", fontSize: "0.9rem", margin: 0, lineHeight: 1.7 }}>
              Conforme al{" "}
              <strong style={{ color: "#bbf7d0" }}>Art. 3 bis de la Ley N° 19.496</strong>{" "}
              de Protección al Consumidor, el Usuario tiene derecho a retractarse del contrato
              dentro de los{" "}
              <strong style={{ color: "#bbf7d0" }}>10 días hábiles</strong> siguientes a la
              fecha de contratación del plan, con reembolso total del monto pagado.
            </p>
          </div>
          <p>
            Para ejercer el derecho a retracto, el Usuario debe enviar una comunicación
            escrita a{" "}
            <a href="mailto:admin@ledgera.cl" style={{ color: "#818cf8" }}>
              admin@ledgera.cl
            </a>{" "}
            indicando su intención de retractarse. El reembolso se realizará por el mismo
            medio de pago utilizado en un plazo máximo de 10 días hábiles desde la
            recepción de la solicitud.
          </p>
          <InfoBox color="amber">
            <strong style={{ color: "#fcd34d" }}>Excepción legal:</strong> El derecho a
            retracto no aplica cuando el Usuario haya solicitado o descargado reportes
            tributarios durante el período, conforme al Art. 3 bis letra b) de la Ley
            19.496, que excluye los servicios digitales cuya ejecución haya comenzado con
            acuerdo del consumidor.
          </InfoBox>
        </LegalSection>

        <LegalSection title="7. Derechos del consumidor">
          <p>
            En virtud de la{" "}
            <strong style={{ color: "#e2e8f0" }}>Ley N° 19.496</strong> de Protección al
            Consumidor, el Usuario tiene derecho a:
          </p>
          <ul style={{ paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Información veraz y oportuna</strong> sobre
              el servicio contratado, sus características, condiciones y precios (Art. 3
              letra b).
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>No discriminación arbitraria</strong> en el
              acceso al servicio y en las condiciones de la prestación (Art. 3 letra c).
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Seguridad en el servicio</strong> y en los
              datos que el Usuario proporciona a la Plataforma (Art. 3 letra d).
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Retracto</strong> en los términos indicados
              en la sección 6 precedente (Art. 3 bis).
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Reclamo y reparación</strong> ante el{" "}
              <strong style={{ color: "#e2e8f0" }}>SERNAC</strong> (Servicio Nacional del
              Consumidor) o ante los Juzgados de Policía Local competentes, si considera que
              sus derechos han sido vulnerados.
            </li>
          </ul>
          <p>
            Ledgera se compromete a no incluir cláusulas contrarias a las normas de orden
            público de la Ley 19.496. Cualquier cláusula que contravenga dicha ley se
            tendrá por no escrita.
          </p>
        </LegalSection>

        <LegalSection title="8. Uso aceptable">
          <p>
            El Usuario se compromete a utilizar la Plataforma exclusivamente para fines
            lícitos y de conformidad con los presentes Términos. Queda expresamente
            prohibido:
          </p>
          <ul style={{ paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>
              Ingresar datos falsos, manipulados o que induzcan a error en las declaraciones
              tributarias presentadas ante el SII u otras autoridades.
            </li>
            <li>
              Evadir, eludir o defraudar al SII u otras autoridades fiscales nacionales o
              extranjeras.
            </li>
            <li>
              Realizar operaciones vinculadas a lavado de activos, financiamiento del
              terrorismo o cualquier actividad ilícita conforme a la{" "}
              <strong style={{ color: "#e2e8f0" }}>Ley N° 19.913</strong> y su normativa
              complementaria de la UAF.
            </li>
            <li>
              Realizar ingeniería inversa, descompilar, desensamblar o intentar acceder al
              código fuente de la Plataforma.
            </li>
            <li>
              Revender, sublicenciar, ceder o transferir el acceso a la Plataforma a
              terceros sin autorización expresa y escrita de Ledgera SpA.
            </li>
            <li>
              Utilizar sistemas automatizados (bots, scrapers u otros) para extraer datos
              de la Plataforma de forma masiva sin autorización previa.
            </li>
          </ul>
          <p>
            El incumplimiento de estas obligaciones faculta a Ledgera para suspender o
            cancelar el acceso de forma inmediata y adoptar las acciones legales que
            correspondan, sin perjuicio de la responsabilidad penal o civil del Usuario.
          </p>
        </LegalSection>

        <LegalSection title="9. Responsabilidad y limitaciones">
          <p>
            Ledgera realiza sus mejores esfuerzos para mantener la Plataforma operativa,
            segura y actualizada conforme a la normativa SII vigente. Sin perjuicio de ello,{" "}
            <strong style={{ color: "#e2e8f0" }}>no garantiza</strong>:
          </p>
          <ul style={{ paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>
              Que los cálculos tributarios generados sean aceptados sin observaciones por el
              SII en todos los casos, dado que la fiscalización depende de criterios propios
              de dicha institución.
            </li>
            <li>
              La disponibilidad ininterrumpida del servicio. Ledgera procurará notificar con
              anticipación cualquier mantención programada.
            </li>
            <li>
              Que los tipos de cambio FX provistos por el BCCh correspondan exactamente a
              los exigidos en una fiscalización específica, pues el criterio de conversión
              aplicable en cada caso es determinado por el SII.
            </li>
          </ul>
          <p>
            La responsabilidad máxima de Ledgera frente al Usuario, por concepto de daños
            directos, no podrá exceder el monto equivalente a las sumas efectivamente pagadas
            por el Usuario en los <strong style={{ color: "#e2e8f0" }}>3 meses</strong>{" "}
            inmediatamente anteriores al evento generador del daño.
          </p>
          <InfoBox color="red">
            <strong style={{ color: "#fca5a5" }}>Límite legal infranqueable:</strong>{" "}
            Conforme al{" "}
            <strong style={{ color: "#fca5a5" }}>Art. 1465 del Código Civil</strong>, la
            limitación de responsabilidad anterior{" "}
            <strong style={{ color: "#fca5a5" }}>
              no aplica en casos de dolo o culpa grave
            </strong>{" "}
            imputable a Ledgera SpA. En tales supuestos, Ledgera responderá por la totalidad
            de los perjuicios causados conforme a las reglas generales del derecho civil
            chileno.
          </InfoBox>
          <p>
            Ledgera no será responsable por daños indirectos, lucro cesante, pérdida de
            datos o daño emergente derivado del uso o imposibilidad de uso de la Plataforma,
            salvo en los casos de dolo o culpa grave señalados precedentemente.
          </p>
        </LegalSection>

        <LegalSection title="10. Protección de datos personales">
          <p>
            El tratamiento de los datos personales del Usuario se rige por la{" "}
            <strong style={{ color: "#e2e8f0" }}>Ley N° 21.719</strong> de Protección de
            Datos Personales de Chile y se describe en detalle en la{" "}
            <Link href="/privacidad" style={{ color: "#818cf8" }}>
              Política de Privacidad
            </Link>
            , que forma parte integrante de los presentes Términos.
          </p>
          <p>
            Al aceptar estos Términos, el Usuario otorga su consentimiento expreso para el
            tratamiento de sus datos personales con las finalidades, bases legales y
            condiciones descritas en dicha Política.
          </p>
          <p>
            Los datos tributarios del Usuario (movimientos, carteras, cálculos FIFO) son
            tratados exclusivamente para la prestación del servicio contratado y no son
            compartidos con terceros salvo en los casos indicados en la Política de
            Privacidad.
          </p>
        </LegalSection>

        <LegalSection title="11. Propiedad intelectual">
          <p>
            Todos los derechos de propiedad intelectual sobre la Plataforma, incluyendo
            diseño, código fuente, algoritmos, marca comercial, logotipos y contenidos, son
            de titularidad exclusiva de{" "}
            <strong style={{ color: "#e2e8f0" }}>Ledgera SpA</strong> y se encuentran
            protegidos por la{" "}
            <strong style={{ color: "#e2e8f0" }}>Ley N° 17.336</strong> de Propiedad
            Intelectual de Chile y los convenios internacionales aplicables.
          </p>
          <p>
            En virtud de los presentes Términos, el Usuario recibe una{" "}
            <strong style={{ color: "#e2e8f0" }}>
              licencia limitada, no exclusiva, intransferible y revocable
            </strong>{" "}
            para acceder y utilizar la Plataforma durante la vigencia de su suscripción y
            únicamente para los fines previstos en estos Términos.
          </p>
          <p>
            Queda expresamente prohibida cualquier reproducción, distribución, modificación
            o explotación comercial de los contenidos de la Plataforma sin autorización
            previa y escrita de Ledgera SpA.
          </p>
        </LegalSection>

        <LegalSection title="12. Modificaciones">
          <p>
            Ledgera podrá modificar los presentes Términos en cualquier momento, por razones
            de adecuación normativa, cambios en el servicio u otras causas justificadas.
          </p>
          <p>
            Los cambios serán notificados al correo electrónico registrado con al menos{" "}
            <strong style={{ color: "#e2e8f0" }}>10 días hábiles de anticipación</strong>{" "}
            a su entrada en vigor. Continuando con el uso de la Plataforma tras el plazo
            indicado, el Usuario manifiesta su aceptación de los nuevos Términos.
          </p>
          <p>
            Si el Usuario no acepta las modificaciones, podrá ejercer su derecho a retracto
            o resolver el contrato en los términos de la sección 6, sin costo adicional,
            dentro de los 10 días hábiles siguientes a la notificación del cambio.
          </p>
        </LegalSection>

        <LegalSection title="13. Ley aplicable y jurisdicción">
          <p>
            Los presentes Términos y la relación contractual entre Ledgera SpA y el Usuario
            se rigen íntegramente por las leyes de la{" "}
            <strong style={{ color: "#e2e8f0" }}>República de Chile</strong>.
          </p>
          <p>
            Para la resolución de cualquier controversia derivada o relacionada con los
            presentes Términos, las partes se someten a la jurisdicción de los:
          </p>
          <ul style={{ paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Juzgados de Policía Local</strong>{" "}
              competentes, cuando se trate de controversias entre Ledgera y consumidores
              finales en el marco de la Ley N° 19.496.
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>
                Tribunales Ordinarios de Justicia de Santiago
              </strong>
              , para cualquier otra controversia de carácter civil o comercial, con expresa
              renuncia a cualquier otro fuero o domicilio.
            </li>
          </ul>
          <p>
            Lo anterior es sin perjuicio del derecho del Usuario-consumidor a recurrir ante
            el <strong style={{ color: "#e2e8f0" }}>SERNAC</strong> en cualquier momento.
          </p>
        </LegalSection>

        <LegalSection title="14. Contacto">
          <p>Para consultas sobre estos Términos o sobre el servicio en general:</p>
          <InfoBox>
            <strong>Correo:</strong>{" "}
            <a href="mailto:admin@ledgera.cl" style={{ color: "#818cf8" }}>
              admin@ledgera.cl
            </a>
            {"  ·  "}
            <strong>WhatsApp:</strong>{" "}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#818cf8" }}>
              Soporte en línea
            </a>
          </InfoBox>
          <p>
            Respondemos consultas en un plazo máximo de{" "}
            <strong style={{ color: "#e2e8f0" }}>5 días hábiles</strong>.
          </p>
        </LegalSection>

        {/* VER TAMBIÉN */}
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
          <span style={{ color: "#64748b", fontSize: "0.85rem", alignSelf: "center" }}>
            Ver también:
          </span>
          <Link
            href="/privacidad"
            style={{ color: "#818cf8", fontSize: "0.85rem", textDecoration: "none" }}
          >
            Política de Privacidad →
          </Link>
          <Link
            href="/cookies"
            style={{ color: "#818cf8", fontSize: "0.85rem", textDecoration: "none" }}
          >
            Política de Cookies →
          </Link>
        </div>
      </main>

      {/* FOOTER */}
      <footer
        style={{
          background: "#040C13",
          padding: "3rem 2.5rem",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "2rem",
              marginBottom: "2rem",
            }}
          >
            <div>
              <div style={{ marginBottom: "12px" }}>
                <Logo variant="light" size="sm" showSubtitle />
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "#475569",
                  margin: 0,
                  maxWidth: "260px",
                  lineHeight: 1.6,
                }}
              >
                Software tributario especializado en criptomonedas para el mercado chileno.
              </p>
            </div>
            <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: "0 0 12px",
                  }}
                >
                  Producto
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link href="/register" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>
                    Comenzar gratis
                  </Link>
                  <Link href="/login" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>
                    Iniciar sesión
                  </Link>
                  <Link href="/blog" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>
                    Blog
                  </Link>
                </div>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: "0 0 12px",
                  }}
                >
                  Legal
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link href="/terminos" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>
                    Términos y condiciones
                  </Link>
                  <Link href="/privacidad" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>
                    Política de privacidad
                  </Link>
                  <Link href="/cookies" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>
                    Política de cookies
                  </Link>
                </div>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: "0 0 12px",
                  }}
                >
                  Contacto
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <a
                    href="mailto:admin@ledgera.cl"
                    style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}
                  >
                    admin@ledgera.cl
                  </a>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}
                  >
                    WhatsApp soporte
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.04)",
              paddingTop: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <span style={{ fontSize: "12px", color: "#334155" }}>
              © {new Date().getFullYear()} Ledgera SpA · Chile · Ley 19.496 · Ley 21.719
            </span>
            <span style={{ fontSize: "12px", color: "#334155" }}>ledgera.cl</span>
          </div>
        </div>
      </footer>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Volver arriba"
          style={{
            position: "fixed",
            bottom: "92px",
            right: "28px",
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "rgba(10,31,46,0.92)",
            border: "1px solid rgba(255,255,255,0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 998,
            backdropFilter: "blur(8px)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 13V5M5 9l4-4 4 4"
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "#16A34A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          zIndex: 999,
        }}
      >
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

function InfoBox({
  children,
  color = "indigo",
}: {
  children: React.ReactNode;
  color?: "indigo" | "amber" | "red";
}) {
  const palette = {
    indigo: {
      bg: "rgba(99,102,241,0.06)",
      border: "rgba(99,102,241,0.15)",
      text: "#a5b4fc",
    },
    amber: {
      bg: "rgba(245,158,11,0.06)",
      border: "rgba(245,158,11,0.18)",
      text: "#fcd34d",
    },
    red: {
      bg: "rgba(239,68,68,0.06)",
      border: "rgba(239,68,68,0.18)",
      text: "#fca5a5",
    },
  };
  const p = palette[color];
  return (
    <div
      style={{
        background: p.bg,
        border: `1px solid ${p.border}`,
        borderRadius: "10px",
        padding: "0.9rem 1.2rem",
      }}
    >
      <p style={{ color: p.text, fontSize: "0.88rem", margin: 0, lineHeight: 1.7 }}>
        {children}
      </p>
    </div>
  );
}
