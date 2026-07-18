"use client";

import Link from "next/link";

import Logo from "@/components/brand/Logo";

export default function ComercialPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, var(--bg-elev) 0%, var(--bg-elev) 50%, var(--bg-elev) 100%)",
        color: "var(--text)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
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
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Logo />
        </Link>
        <Link
          href="/"
          style={{
            color: "var(--text-soft)",
            fontSize: "0.85rem",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-soft)")}
        >
          ← Volver al inicio
        </Link>
      </nav>

      <main
        style={{ maxWidth: "860px", margin: "0 auto", padding: "4rem 2rem 6rem" }}
      >
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
              color: "var(--accent)",
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
              color: "var(--text)",
              margin: "0 0 1rem",
              lineHeight: 1.15,
            }}
          >
            Política Comercial
          </h1>
          <p style={{ color: "var(--text-soft)", fontSize: "0.9rem" }}>
            Última actualización: 18 de julio de 2026 · Vigente para suscripciones
            LEDGERA
          </p>
        </div>

        <div
          style={{
            background: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.15)",
            borderRadius: "10px",
            padding: "1rem 1.4rem",
            marginBottom: "2.5rem",
          }}
        >
          <p
            style={{
              color: "var(--text-faint)",
              fontSize: "0.88rem",
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            La presente Política Comercial complementa los{" "}
            <Link href="/terminos" style={{ color: "var(--text-faint)" }}>
              Términos y Condiciones
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" style={{ color: "var(--text-faint)" }}>
              Política de Privacidad
            </Link>
            . Regula planes, precios, pagos, facturación, renovación automática,
            cancelación y reembolsos del Servicio LEDGERA.
          </p>
        </div>

        <LegalSection title="1. Planes y precios">
          <p>
            LEDGERA ofrece los siguientes planes de suscripción para personas
            naturales, inversionistas, contadores y asesores:
          </p>
          <ul
            style={{
              paddingLeft: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <li>
              <strong style={{ color: "var(--text)" }}>Gratuito:</strong> sin costo.
              Incluye un análisis preliminar de hasta 50 movimientos y una fuente de
              importación.
            </li>
            <li>
              <strong style={{ color: "var(--text)" }}>Personal:</strong> $5.990 +
              IVA/mes o $65.890 + IVA/año. Permite múltiples fuentes de importación,
              conciliación completa y exportaciones.
            </li>
            <li>
              <strong style={{ color: "var(--text)" }}>Profesional:</strong> $29.990 +
              IVA/mes o $329.890 + IVA/año. Incluye hasta 5 clientes y las funciones
              profesionales de gestión y revisión.
            </li>
          </ul>
          <p>
            Los precios publicados para los planes pagados son valores netos y el IVA
            se agrega al cobro. La modalidad anual entrega 12 meses de acceso por el
            precio de 11 mensualidades.
          </p>
          <p>
            En Profesional, cada cliente adicional tiene un valor de $4.990 + IVA/mes.
          </p>
        </LegalSection>

        <LegalSection title="2. Contratación y aceptación">
          <p>
            La contratación de un plan pagado requiere la aceptación previa de
            los Términos y Condiciones, la Política de Privacidad y esta Política
            Comercial. La aceptación se realiza mediante casillas de consentimiento
            en el checkout previo al pago.
          </p>
          <p>
            Al confirmar el pago, el Usuario autoriza expresamente la renovación
            automática de la suscripción por períodos sucesivos iguales al plan
            contratado, salvo que cancele con antelación.
          </p>
        </LegalSection>

        <LegalSection title="3. Medios de pago y facturación">
          <p>
            Los pagos se procesan a través de proveedores de pago externos
            habilitados (por ejemplo, Flow, Mercado Pago o Stripe, según
            disponibilidad). LEDGERA no almacena datos completos de tarjetas ni
            credenciales de pago.
          </p>
          <p>
            La factura o comprobante de pago será emitida y enviada por el
            proveedor de pago conforme a la normativa vigente. LEDGERA no emite
            boletas ni facturas directamente por los pagos procesados por terceros.
          </p>
        </LegalSection>

        <LegalSection title="4. Renovación automática">
          <p>
            Las suscripciones de planes pagados se renuevan automáticamente al
            término de cada período de facturación (mensual o anual), cargando el
            medio de pago registrado por el Usuario.
          </p>
          <p>
            El Usuario será notificado con anticipación razonable sobre el próximo
            cargo de renovación. La falta de recepción de la notificación no
            exime el cumplimiento de la renovación.
          </p>
          <p>
            Si el medio de pago no puede ser cargado, se podrán realizar intentos
            adicionales y se notificará al Usuario. El incumplimiento del pago
            puede derivar en suspensión o downgrade del plan.
          </p>
        </LegalSection>

        <LegalSection title="5. Cancelación">
          <p>
            El Usuario puede cancelar la renovación automática en cualquier
            momento desde la configuración de su cuenta. La cancelación se hará
            efectiva al término del período ya pagado, manteniéndose el acceso
            hasta esa fecha.
          </p>
          <p>
            También puede solicitarse la cancelación contactando a nuestro equipo
            a través de los canales oficiales. La cancelación no implica
            reembolso de períodos ya transcurridos.
          </p>
        </LegalSection>

        <LegalSection title="6. Cambios de plan">
          <p>
            El Usuario puede cambiar de plan en cualquier momento. El cambio se
            coordinará para evitar duplicar cobros o perder continuidad del
            período pagado.
          </p>
          <p>
            Cuando un cambio de plan requiera pago, el Usuario deberá completar
            el proceso de checkout correspondiente y aceptar nuevamente los
            términos aplicables.
          </p>
        </LegalSection>

        <LegalSection title="7. Reembolsos">
          <p>
            Los montos pagados por períodos ya transcurridos no son
            reembolsables, salvo que la ley lo exija o exista un error de
            activación o cobro duplicado imputable a LEDGERA.
          </p>
          <p>
            Las solicitudes de reembolso se evaluarán caso a caso. Para
            iniciar una solicitud, el Usuario debe contactar a admin@ledgera.cl
            con los antecedentes del pago.
          </p>
        </LegalSection>

        <LegalSection title="8. Derecho de retracto">
          <p>
            Conforme a la Ley N° 19.496 sobre Protección de los Derechos de los
            Consumidores, el Usuario consumidor podrá ejercer su derecho de
            retracto dentro del plazo legal correspondiente, siempre que el
            Servicio no haya sido utilizado materialmente durante dicho período.
          </p>
          <p>
            El ejercicio del retracto debe realizarse por escrito a
            admin@ledgera.cl, indicando claramente la solicitud y los datos de
            la suscripción.
          </p>
        </LegalSection>

        <LegalSection title="9. Modificaciones de precios y planes">
          <p>
            LEDGERA podrá modificar precios, beneficios o condiciones de los
            planes con previo aviso razonable. Los cambios no afectarán los
            períodos ya pagados por el Usuario.
          </p>
          <p>
            El uso continuado del Servicio después de la entrada en vigencia de
            las modificaciones implica su aceptación.
          </p>
        </LegalSection>

        <LegalSection title="10. Contacto">
          <p>
            Para consultas comerciales, facturación, cancelaciones o
            reembolsos, escríbenos a:
          </p>
          <p>
            <strong style={{ color: "var(--text)" }}>Correo:</strong>{" "}
            <a href="mailto:admin@ledgera.cl" style={{ color: "var(--accent)" }}>
              admin@ledgera.cl
            </a>
          </p>
          <p>
            Responderemos en un plazo máximo de 5 días hábiles.
          </p>
        </LegalSection>

        <div
          style={{
            marginTop: "2rem",
            padding: "1rem 1.2rem",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "8px",
          }}
        >
          <p
            style={{
              color: "var(--text)",
              fontSize: "0.8rem",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Esta política puede actualizarse periódicamente. La versión vigente
            será la publicada en ledgera.cl/legal/comercial.
          </p>
        </div>

        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <span
            style={{ color: "var(--text-soft)", fontSize: "0.85rem", alignSelf: "center" }}
          >
            Ver también:
          </span>
          <Link
            href="/terminos"
            style={{
              color: "var(--accent)",
              fontSize: "0.85rem",
              textDecoration: "none",
            }}
          >
            Términos y Condiciones →
          </Link>
          <Link
            href="/privacidad"
            style={{
              color: "var(--accent)",
              fontSize: "0.85rem",
              textDecoration: "none",
            }}
          >
            Política de Privacidad →
          </Link>
        </div>
      </main>
    </div>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "var(--text)",
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
          color: "var(--text-soft)",
          fontSize: "0.92rem",
          lineHeight: 1.75,
        }}
      >
        {children}
      </div>
    </section>
  );
}
