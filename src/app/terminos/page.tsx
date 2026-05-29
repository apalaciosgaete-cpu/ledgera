"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/brand/Logo";

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
            Términos y Condiciones de Uso
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            Última actualización: 29 de mayo de 2026 · Versión 1.0 · Plataforma v0.1.0.26
          </p>
        </div>

        {/* AVISO PRELIMINAR */}
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
            Los presentes Términos y Condiciones de Uso constituyen un contrato legalmente
            vinculante entre el titular de LEDGERA y toda persona que acceda o utilice la
            Plataforma. Al registrarse, acceder o utilizar el Servicio, el Usuario declara
            haber leído, comprendido y aceptado íntegramente estos Términos. Este documento
            se rige por la legislación de la{" "}
            <strong style={{ color: "#c7d2fe" }}>República de Chile</strong>. Su aceptación
            electrónica produce los efectos previstos en la{" "}
            <strong style={{ color: "#c7d2fe" }}>Ley N° 19.799</strong> sobre Documentos
            Electrónicos, Firma Electrónica y Servicios de Certificación de dicha Firma.
          </p>
        </div>

        {/* SECCIONES */}

        <LegalSection title="1. Definiciones">
          <p>Para los efectos de estos Términos, se entenderá por:</p>
          <ul style={{ paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Plataforma o Servicio:</strong> el conjunto
              de funcionalidades de software de LEDGERA accesibles mediante navegador web u
              otros medios habilitados, destinadas al registro, normalización, cálculo,
              clasificación y reporte de información contable y tributaria asociada a
              criptoactivos.
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Usuario:</strong> toda persona natural o
              jurídica que crea una cuenta o utiliza el Servicio.
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Criptoactivo o activo financiero virtual:</strong>{" "}
              representación digital de unidades de valor, bienes o servicios, con excepción
              del dinero en moneda nacional o divisas, que puede ser transferida, almacenada
              o intercambiada digitalmente, conforme a la definición incorporada por la Ley
              N° 21.521.
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Movimientos de portafolio:</strong> los
              registros de transacciones que el Usuario ingresa o que se ingieren desde
              fuentes externas, y que constituyen la fuente de verdad del sistema.
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Evento tributario:</strong> resultado
              derivado de forma determinística por la Plataforma a partir de los movimientos,
              conforme al método FIFO y a la lógica de cálculo del sistema.
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Conectores de exchange:</strong> módulos
              de ingestión que importan información desde plataformas de intercambio de
              terceros hacia los movimientos de portafolio.
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Contenido del Usuario:</strong> todo dato,
              archivo, registro o información que el Usuario ingrese, cargue o conecte a la
              Plataforma.
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Datos personales:</strong> los definidos
              en la Ley N° 19.628 y, a partir de su entrada en vigencia, en la Ley N° 21.719.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="2. Naturaleza y alcance del Servicio">
          <p>
            LEDGERA es una herramienta de software de gestión contable y tributaria que
            convierte transacciones de criptoactivos en información estructurada, calculando
            eventos tributarios y generando reportes y antecedentes de apoyo. LEDGERA se
            posiciona como una capa contable de las finanzas digitales.
          </p>
          <InfoBox color="amber">
            <strong style={{ color: "#fcd34d" }}>LEDGERA NO es ni presta los siguientes servicios:</strong>{" "}
            no es exchange, casa de cambio ni mercado de criptoactivos; no custodia ni
            administra criptoactivos o fondos; no intermedia ni ejecuta operaciones de compra
            o venta; no presta asesoría de inversión, contable, tributaria ni legal
            personalizada.
          </InfoBox>
          <p>
            <strong style={{ color: "#e2e8f0" }}>Exclusión del perímetro regulado por la Ley N° 21.521 (Ley Fintec).</strong>{" "}
            LEDGERA no presta ninguno de los servicios financieros regulados taxativamente
            por dicha ley (plataformas de financiamiento colectivo, sistemas alternativos de
            transacción, asesoría crediticia y de inversión, custodia de instrumentos
            financieros, e intermediación de órdenes). En consecuencia, LEDGERA no se
            encuentra inscrita ni requiere inscripción en el Registro de Prestadores de
            Servicios Financieros.
          </p>
          <p>
            <strong style={{ color: "#e2e8f0" }}>Etapa de desarrollo.</strong> El Usuario
            reconoce que la Plataforma se encuentra en etapa de desarrollo activo
            (versión v0.1.0.x). Las funcionalidades pueden cambiar, ser corregidas,
            suspendidas o discontinuadas sin previo aviso. El Servicio se entrega en su
            estado actual y según disponibilidad.
          </p>
        </LegalSection>

        <LegalSection title="3. Carácter referencial de los cálculos tributarios">
          <p>
            Los eventos tributarios, resúmenes, indicadores (incluyendo Tax Health y Tax
            Overview), declaraciones de apoyo y exportaciones generados por la Plataforma
            tienen <strong style={{ color: "#e2e8f0" }}>carácter informativo y referencial</strong>.
            Se calculan de manera determinística a partir de la información ingresada por el
            Usuario o ingerida desde fuentes externas, aplicando el método FIFO y la lógica
            vigente del sistema.
          </p>
          <p>
            La exactitud de los resultados depende íntegramente de la veracidad, integridad
            y oportunidad de la información ingresada. LEDGERA no valida la existencia real
            de las transacciones ni la titularidad de los activos.
          </p>
          <InfoBox color="red">
            <strong style={{ color: "#fca5a5" }}>El Usuario es el único y exclusivo responsable</strong>{" "}
            del cumplimiento de sus obligaciones tributarias ante el SII y cualquier otra
            autoridad competente, incluyendo la presentación correcta y oportuna de
            declaraciones y el pago de los tributos que correspondan.
          </InfoBox>
          <p>
            LEDGERA recomienda enfáticamente que el Usuario valide los resultados de la
            Plataforma con un contador, auditor o asesor tributario habilitado antes de
            presentarlos ante cualquier autoridad.
          </p>
          <p>
            LEDGERA no responde por interpretaciones, criterios, oficios, resoluciones o
            cambios normativos del SII u otras autoridades, ni por diferencias, sanciones,
            multas, intereses o recargos derivados de la actuación del Usuario.
          </p>
        </LegalSection>

        <LegalSection title="4. Registro, cuenta y seguridad">
          <p>
            El uso del Servicio requiere la creación de una cuenta con información veraz,
            exacta y actualizada. El Usuario se obliga a mantener actualizada dicha
            información.
          </p>
          <p>
            El Usuario es responsable de la confidencialidad de sus credenciales de acceso
            y de toda actividad realizada bajo su cuenta. La Plataforma ofrece autenticación
            de dos factores (2FA), cuya activación se recomienda. El Usuario debe notificar
            de inmediato cualquier uso no autorizado de su cuenta.
          </p>
          <p>
            Para utilizar el Servicio, el Usuario debe ser mayor de 18 años y tener
            capacidad legal para contratar conforme al derecho chileno. Si actúa en
            representación de una persona jurídica, declara contar con facultades suficientes
            para obligarla.
          </p>
          <p>
            LEDGERA podrá rechazar, suspender o cancelar registros que infrinjan estos
            Términos o la ley.
          </p>
        </LegalSection>

        <LegalSection title="5. Licencia de uso">
          <p>
            Sujeto al cumplimiento de estos Términos y, cuando corresponda, al pago de la
            suscripción, LEDGERA concede al Usuario una licencia{" "}
            <strong style={{ color: "#e2e8f0" }}>
              limitada, personal, revocable, no exclusiva, no transferible y no sublicenciable
            </strong>{" "}
            para utilizar el Servicio con fines lícitos.
          </p>
          <p>
            Esta licencia no transfiere propiedad alguna sobre la Plataforma ni sobre sus
            componentes. Todo derecho no concedido expresamente queda reservado a LEDGERA.
          </p>
        </LegalSection>

        <LegalSection title="6. Conducta del Usuario y usos prohibidos">
          <p>El Usuario se obliga a no:</p>
          <ul style={{ paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>
              Utilizar el Servicio para fines ilícitos, fraudulentos o contrarios a la
              moral, el orden público o la buena fe.
            </li>
            <li>
              Ingresar información falsa, o destinada a ocultar el origen ilícito de fondos
              o activos.
            </li>
            <li>
              Vulnerar, sobrecargar, interferir o intentar acceder sin autorización a los
              sistemas, infraestructura o datos de la Plataforma o de terceros.
            </li>
            <li>
              Realizar ingeniería inversa, descompilar, desensamblar o intentar obtener el
              código fuente del Servicio, salvo en la medida permitida por la ley.
            </li>
            <li>
              Revender, redistribuir o explotar comercialmente el Servicio sin autorización
              escrita.
            </li>
            <li>
              Introducir software malicioso o realizar actividades que comprometan la
              seguridad o disponibilidad del Servicio.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="7. Prevención de lavado de activos y financiamiento del terrorismo">
          <p>
            El Usuario declara y garantiza que los criptoactivos, fondos y transacciones
            registrados en la Plataforma provienen de fuentes lícitas y que su uso del
            Servicio cumple la legislación aplicable, incluyendo la{" "}
            <strong style={{ color: "#e2e8f0" }}>Ley N° 19.913</strong> que crea la Unidad
            de Análisis Financiero (UAF) y la normativa sobre prevención de lavado de activos
            y financiamiento del terrorismo.
          </p>
          <p>
            LEDGERA podrá suspender o terminar el acceso del Usuario y, cuando la ley lo
            exija, reportar a las autoridades competentes, ante indicios fundados de uso
            ilícito del Servicio.
          </p>
        </LegalSection>

        <LegalSection title="8. Propiedad intelectual">
          <p>
            La Plataforma, su código fuente, arquitectura, módulos, motor de cálculo,
            diseño, marca, logotipos, interfaces y toda la documentación asociada son de
            propiedad exclusiva de LEDGERA o de sus licenciantes, y se encuentran protegidos
            por la legislación chilena sobre propiedad intelectual e industrial.
          </p>
          <p>
            El Contenido del Usuario es y seguirá siendo de propiedad del Usuario. El
            Usuario concede a LEDGERA una licencia limitada para procesar, almacenar y
            tratar dicho contenido con la única finalidad de prestar el Servicio, conforme
            a la{" "}
            <Link href="/privacidad" style={{ color: "#818cf8" }}>
              Política de Privacidad
            </Link>
            .
          </p>
          <p>
            Queda prohibido el uso de las marcas, signos distintivos o materiales de
            LEDGERA sin autorización previa y por escrito.
          </p>
        </LegalSection>

        <LegalSection title="9. Servicios y fuentes de terceros">
          <p>
            La Plataforma puede integrar o depender de servicios de terceros, incluyendo
            conectores de exchanges (Binance, Coinbase, Kraken y otros), proveedores de
            datos de mercado (CoinGecko), proveedores de tipo de cambio (mindicador.cl),
            proveedores de infraestructura y de procesamiento de pagos.
          </p>
          <p>
            LEDGERA no controla dichos servicios y no garantiza su disponibilidad, exactitud,
            continuidad ni vigencia. La Plataforma no responde por interrupciones, errores,
            retrasos, cambios de API, indisponibilidad de precios o tipos de cambio, ni por
            cualquier perjuicio derivado de fallas de terceros.
          </p>
          <p>
            Los conectores de exchange operan mediante una capa de ingestión y normalización
            y no ejecutan operaciones de trading. El Usuario es responsable de las
            credenciales, permisos y claves de API que conecte; se recomienda otorgar
            permisos de solo lectura.
          </p>
        </LegalSection>

        <LegalSection title="10. Suscripciones, precios y pagos">
          <p>
            El acceso a determinadas funcionalidades puede requerir el pago de una
            suscripción. Los precios, planes, periodicidad y condiciones serán informados de
            manera previa, clara y oportuna, conforme a la{" "}
            <strong style={{ color: "#e2e8f0" }}>Ley N° 19.496</strong> sobre Protección de
            los Derechos de los Consumidores cuando esta resulte aplicable.
          </p>
          <p>
            Los pagos se procesan a través de proveedores de pago externos. LEDGERA no
            almacena ni accede a los datos completos de tarjetas u otros medios de pago del
            Usuario.
          </p>
          <p>
            Las suscripciones podrán renovarse automáticamente según el plan contratado. El
            Usuario podrá cancelar la renovación conforme a las condiciones del plan y a la
            normativa aplicable, incluyendo el derecho de retracto cuando proceda en
            términos de la Ley N° 19.496.
          </p>
          <p>
            Salvo disposición legal en contrario o lo indicado expresamente en el plan, los
            montos pagados por periodos ya transcurridos no son reembolsables. LEDGERA podrá
            modificar precios y planes, informando con antelación razonable; los cambios no
            afectarán periodos ya pagados.
          </p>
        </LegalSection>

        <LegalSection title="11. Protección de datos personales">
          <p>
            El tratamiento de datos personales por parte de LEDGERA se rige por la{" "}
            <strong style={{ color: "#e2e8f0" }}>Ley N° 19.628</strong> sobre Protección de
            la Vida Privada y, a partir de su entrada en vigencia plena el 1 de diciembre de
            2026, por la{" "}
            <strong style={{ color: "#e2e8f0" }}>Ley N° 21.719</strong>, así como por la{" "}
            <Link href="/privacidad" style={{ color: "#818cf8" }}>
              Política de Privacidad
            </Link>{" "}
            de LEDGERA, que forma parte integrante de estos Términos.
          </p>
          <p>
            LEDGERA trata los datos personales del Usuario con la finalidad de prestar el
            Servicio, sobre la base del consentimiento del Usuario y de la ejecución del
            presente contrato.
          </p>
          <p>
            El Usuario podrá ejercer sus derechos de acceso, rectificación, cancelación o
            supresión, oposición y portabilidad conforme a la normativa vigente, mediante
            los canales indicados en la cláusula 21.
          </p>
          <p>
            LEDGERA adopta medidas técnicas y organizativas de seguridad razonables,
            incluyendo control de acceso, registros de auditoría, limitación de tasa en
            endpoints críticos, respaldos y monitoreo. El Usuario reconoce que, por razones
            de infraestructura tecnológica, sus datos pueden ser almacenados o procesados
            en servidores ubicados fuera de Chile, adoptándose los resguardos adecuados
            conforme a la normativa aplicable.{" "}
            <strong style={{ color: "#e2e8f0" }}>LEDGERA no vende los datos personales del Usuario a terceros.</strong>
          </p>
        </LegalSection>

        <LegalSection title="12. Disponibilidad, mantenimiento y respaldos">
          <p>
            LEDGERA procurará mantener el Servicio disponible de forma continua, pero no
            garantiza disponibilidad ininterrumpida ni libre de errores. Podrán existir
            interrupciones por mantenimiento, actualizaciones, fallas técnicas o causas de
            fuerza mayor.
          </p>
          <p>
            Aunque LEDGERA realiza respaldos de información, el Usuario es responsable de
            conservar copias de su propia información relevante. LEDGERA no garantiza la
            recuperación íntegra de datos en todos los escenarios.
          </p>
        </LegalSection>

        <LegalSection title="13. Garantías y exención de responsabilidad">
          <p>
            El Servicio se proporciona{" "}
            <strong style={{ color: "#e2e8f0" }}>"en su estado actual"</strong> y{" "}
            <strong style={{ color: "#e2e8f0" }}>"según disponibilidad"</strong>, sin
            garantías de ningún tipo más allá de las que la ley imponga de manera imperativa.
          </p>
          <p>
            En la máxima medida permitida por la legislación chilena, LEDGERA no garantiza
            que el Servicio satisfaga requerimientos específicos del Usuario, que opere sin
            interrupciones o errores, ni que los resultados sean exactos o suficientes para
            un fin determinado.
          </p>
          <InfoBox color="indigo">
            Ninguna disposición de estos Términos excluye o limita responsabilidades que,
            conforme a la ley chilena, no puedan ser excluidas ni limitadas, incluyendo las
            derivadas de{" "}
            <strong style={{ color: "#c7d2fe" }}>dolo o culpa grave</strong> y, cuando
            resulte aplicable, las garantías legales de la{" "}
            <strong style={{ color: "#c7d2fe" }}>Ley N° 19.496</strong>.
          </InfoBox>
        </LegalSection>

        <LegalSection title="14. Limitación de responsabilidad">
          <p>
            En la máxima medida permitida por la ley, LEDGERA no será responsable por
            daños indirectos, incidentales, especiales, punitivos o consecuenciales, ni por
            lucro cesante, pérdida de datos, pérdida de oportunidades de negocio, sanciones
            tributarias o perjuicios derivados de decisiones del Usuario basadas en la
            Plataforma.
          </p>
          <p>
            En aquellos casos en que LEDGERA deba responder y la limitación sea legalmente
            admisible, su responsabilidad total acumulada quedará limitada al monto
            efectivamente pagado por el Usuario en concepto de suscripción durante los{" "}
            <strong style={{ color: "#e2e8f0" }}>doce (12) meses</strong> anteriores al
            hecho que origina la responsabilidad.
          </p>
          <p>
            Las limitaciones de esta cláusula no afectan los derechos irrenunciables que la
            ley reconozca al Usuario consumidor.
          </p>
        </LegalSection>

        <LegalSection title="15. Indemnidad">
          <p>
            El Usuario mantendrá indemne a LEDGERA, sus titulares, administradores,
            colaboradores y proveedores frente a cualquier reclamo, demanda, sanción,
            pérdida o gasto (incluidos honorarios razonables de defensa) derivado de:
          </p>
          <ul style={{ paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>El incumplimiento de estos Términos.</li>
            <li>La infracción de la ley o de derechos de terceros.</li>
            <li>La información ingresada por el Usuario.</li>
            <li>
              El uso que el Usuario haga de los resultados del Servicio, especialmente en
              materia tributaria.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="16. Suspensión y terminación">
          <p>
            LEDGERA podrá suspender o terminar el acceso del Usuario, total o parcialmente,
            en caso de incumplimiento de estos Términos, uso ilícito, falta de pago o por
            requerimiento de autoridad competente.
          </p>
          <p>
            El Usuario podrá terminar el uso del Servicio en cualquier momento, cancelando
            su cuenta o suscripción según corresponda.
          </p>
          <p>
            Terminada la relación, el tratamiento y conservación de datos se regirá por la
            Política de Privacidad y por las obligaciones de conservación que imponga la ley.
            El Usuario podrá solicitar la exportación de su información antes del cierre de
            la cuenta, dentro de los plazos y formatos disponibles.
          </p>
        </LegalSection>

        <LegalSection title="17. Modificaciones a los Términos y al Servicio">
          <p>
            LEDGERA podrá modificar estos Términos para adecuarlos a cambios legales,
            técnicos o del Servicio. Las modificaciones se informarán con antelación
            razonable a través de la Plataforma o por los medios de contacto registrados.
          </p>
          <p>
            El uso continuado del Servicio luego de la entrada en vigencia de las
            modificaciones implica su aceptación. Si el Usuario no las acepta, podrá
            terminar el uso del Servicio conforme a la cláusula 16.
          </p>
        </LegalSection>

        <LegalSection title="18. Fuerza mayor">
          <p>
            LEDGERA no será responsable por el incumplimiento o retraso en sus obligaciones
            cuando obedezca a caso fortuito o fuerza mayor, incluyendo fallas de
            infraestructura de terceros, cortes de energía o conectividad, ciberataques,
            actos de autoridad o desastres.
          </p>
        </LegalSection>

        <LegalSection title="19. Confidencialidad">
          <p>
            Las partes mantendrán reserva sobre la información confidencial a la que accedan
            con ocasión del uso del Servicio, salvo obligación legal de revelarla o
            autorización expresa de la parte titular.
          </p>
        </LegalSection>

        <LegalSection title="20. Cesión, divisibilidad e integridad">
          <p>
            El Usuario no podrá ceder estos Términos sin autorización previa y escrita de
            LEDGERA. LEDGERA podrá cederlos en el marco de reorganizaciones societarias,
            informando al Usuario.
          </p>
          <p>
            Si alguna disposición de estos Términos fuere declarada nula o inaplicable, las
            restantes mantendrán plena vigencia.
          </p>
          <p>
            Estos Términos, junto con la{" "}
            <Link href="/privacidad" style={{ color: "#818cf8" }}>
              Política de Privacidad
            </Link>{" "}
            y las condiciones específicas de cada plan, constituyen el acuerdo íntegro entre
            las partes respecto del uso del Servicio.
          </p>
        </LegalSection>

        <LegalSection title="21. Notificaciones y contacto">
          <p>
            Las comunicaciones del Usuario relativas a estos Términos, al ejercicio de
            derechos sobre datos personales o a reclamos, podrán dirigirse a los canales de
            contacto oficiales de LEDGERA publicados en la Plataforma.
          </p>
          <InfoBox>
            <strong>Correo:</strong>{" "}
            <a href="mailto:admin@ledgera.cl" style={{ color: "#818cf8" }}>
              admin@ledgera.cl
            </a>
                      </InfoBox>
          <p>
            LEDGERA dirigirá sus comunicaciones al correo electrónico u otros datos de
            contacto registrados por el Usuario. Respondemos consultas en un plazo máximo
            de <strong style={{ color: "#e2e8f0" }}>5 días hábiles</strong>.
          </p>
        </LegalSection>

        <LegalSection title="22. Legislación aplicable y jurisdicción">
          <p>
            Estos Términos se rigen por las leyes de la{" "}
            <strong style={{ color: "#e2e8f0" }}>República de Chile</strong>.
          </p>
          <p>
            Toda controversia derivada de estos Términos se someterá a los tribunales
            ordinarios de justicia con asiento en la{" "}
            <strong style={{ color: "#e2e8f0" }}>comuna de Santiago</strong>, sin perjuicio
            de los derechos que la Ley N° 19.496 reconozca al Usuario consumidor, incluida
            la competencia que corresponda a los juzgados de su domicilio y la facultad de
            recurrir al{" "}
            <strong style={{ color: "#e2e8f0" }}>Servicio Nacional del Consumidor (SERNAC)</strong>.
          </p>
        </LegalSection>

        <LegalSection title="23. Idioma">
          <p>
            Estos Términos se otorgan en idioma{" "}
            <strong style={{ color: "#e2e8f0" }}>español</strong>, lengua que prevalecerá
            ante cualquier traducción.
          </p>
        </LegalSection>

        {/* NOTA DE PIE */}
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem 1.2rem",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "8px",
          }}
        >
          <p style={{ color: "#475569", fontSize: "0.8rem", margin: 0, lineHeight: 1.6 }}>
            Documento redactado sobre la base del marco legal chileno vigente a la fecha de
            actualización. No constituye asesoría legal. Se recomienda su revisión y
            validación por un abogado habilitado en Chile.
          </p>
        </div>

        {/* VER TAMBIÉN */}
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
