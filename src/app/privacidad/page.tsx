"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/brand/Logo";

export default function PrivacidadPage() {
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
        background: "linear-gradient(135deg, var(--bg-elev) 0%, var(--bg-elev) 50%, var(--bg-elev) 100%)",
        color: "var(--text)",
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
            Política de Privacidad
          </h1>
          <p style={{ color: "var(--text-soft)", fontSize: "0.9rem" }}>
            Última actualización: 8 de mayo de 2026 · Versión 2.0
          </p>
        </div>

        {/* AVISO NORMATIVO */}
        <InfoBox color="indigo">
          La presente Política regula el tratamiento de datos personales efectuado por{" "}
          <strong style={{ color: "var(--text-faint)" }}>Ledgera SpA</strong> de conformidad con la{" "}
          <strong style={{ color: "var(--text-faint)" }}>Ley N° 21.719</strong> de Protección de
          Datos Personales de Chile, el{" "}
          <strong style={{ color: "var(--text-faint)" }}>Código Civil</strong>, la{" "}
          <strong style={{ color: "var(--text-faint)" }}>Ley N° 19.496</strong> de Protección al
          Consumidor y demás normativa aplicable. Forma parte integrante de los{" "}
          <Link href="/terminos" style={{ color: "var(--accent)" }}>
            Términos y Condiciones
          </Link>{" "}
          de Ledgera.
        </InfoBox>

        {/* SECCIONES */}

        <LegalSection title="1. Responsable del tratamiento y Encargado de Protección de Datos">
          <p>
            El <strong style={{ color: "var(--text)" }}>responsable del tratamiento</strong> de
            sus datos personales es:
          </p>
          <InfoBox color="indigo">
            <strong style={{ color: "var(--text-faint)" }}>Ledgera SpA</strong>
            {"  ·  "}
            Domicilio: Región Metropolitana, Chile
            {"  ·  "}
            Correo:{" "}
            <a href="mailto:admin@ledgera.cl" style={{ color: "var(--accent)" }}>
              admin@ledgera.cl
            </a>
          </InfoBox>
          <p>
            Conforme a la{" "}
            <strong style={{ color: "var(--text)" }}>Ley N° 21.719</strong>, Ledgera SpA ha
            designado un{" "}
            <strong style={{ color: "var(--text)" }}>
              Encargado de Protección de Datos (EPD)
            </strong>{" "}
            responsable de velar por el cumplimiento de esta Política y de atender las
            solicitudes de los titulares. Puede contactarlo en:
          </p>
          <InfoBox color="indigo">
            <strong style={{ color: "var(--text-faint)" }}>EPD — Ledgera SpA</strong>
            {"  ·  "}
            <a href="mailto:admin@ledgera.cl" style={{ color: "var(--accent)" }}>
              admin@ledgera.cl
            </a>
            {"  ·  "}
            Asunto: "Protección de datos"
          </InfoBox>
        </LegalSection>

        <LegalSection title="2. Principios rectores — Ley N° 21.719">
          <p>
            El tratamiento de datos personales realizado por Ledgera se rige por los
            siguientes principios establecidos en la Ley N° 21.719:
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
          >
            {[
              {
                nombre: "Licitud",
                desc: "Todo tratamiento cuenta con una base jurídica válida.",
              },
              {
                nombre: "Finalidad",
                desc: "Los datos se recogen para fines determinados, explícitos y legítimos, y no se tratan de manera incompatible con dichos fines.",
              },
              {
                nombre: "Proporcionalidad",
                desc: "Solo se tratan los datos estrictamente necesarios para la finalidad declarada.",
              },
              {
                nombre: "Calidad",
                desc: "Los datos deben ser exactos y, cuando sea necesario, actualizados.",
              },
              {
                nombre: "Seguridad",
                desc: "Se aplican medidas técnicas y organizativas adecuadas para proteger los datos.",
              },
              {
                nombre: "Transparencia",
                desc: "El titular es informado de manera clara sobre el tratamiento de sus datos.",
              },
            ].map((p) => (
              <div
                key={p.nombre}
                style={{
                  display: "flex",
                  gap: "0.8rem",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    background: "rgba(99,102,241,0.15)",
                    color: "var(--text-faint)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.6rem",
                    borderRadius: "999px",
                    whiteSpace: "nowrap",
                    marginTop: "0.15rem",
                    flexShrink: 0,
                  }}
                >
                  {p.nombre}
                </span>
                <span style={{ color: "var(--text-soft)", fontSize: "0.9rem", lineHeight: 1.7 }}>
                  {p.desc}
                </span>
              </div>
            ))}
          </div>
        </LegalSection>

        <LegalSection title="3. Datos personales que tratamos">
          <p>
            Ledgera trata las siguientes categorías de datos personales, según la fuente de
            obtención:
          </p>
          <DataTable
            headers={["Categoría", "Datos específicos", "Origen"]}
            rows={[
              [
                "Identificación",
                "Nombre completo, correo electrónico, RUT (opcional)",
                "Proporcionado por el Usuario al registrarse",
              ],
              [
                "Acceso y seguridad",
                "Contraseña (hash bcrypt, nunca en texto plano), token de sesión, historial de inicio de sesión, intentos fallidos",
                "Generado automáticamente al autenticarse",
              ],
              [
                "Tributarios y financieros",
                "Movimientos de activos digitales, montos, fechas, exchanges de origen, cálculos FIFO, PnL por período",
                "Importados por el Usuario (CSV o integración con exchange)",
              ],
              [
                "Uso de la plataforma",
                "Páginas visitadas, funciones utilizadas, acciones realizadas, log de auditoría interno",
                "Generado automáticamente durante el uso",
              ],
              [
                "Técnicos y de red",
                "Dirección IP, tipo de navegador, sistema operativo, zona horaria",
                "Recogido automáticamente por razones de seguridad y diagnóstico",
              ],
              [
                "Facturación",
                "Estado de suscripción, plan contratado, historial de pagos. Ledgera NO almacena datos de tarjetas.",
                "El procesador de pagos notifica el resultado; Ledgera recibe solo la confirmación",
              ],
            ]}
          />
          <InfoBox color="indigo">
            Ledgera{" "}
            <strong style={{ color: "var(--text-faint)" }}>no recopila datos sensibles</strong> en los
            términos del Art. 4 de la Ley N° 21.719 (datos de salud, origen racial o
            étnico, opiniones políticas, creencias religiosas, datos biométricos, etc.).
          </InfoBox>
        </LegalSection>

        <LegalSection title="4. Finalidad y base jurídica del tratamiento">
          <p>
            Cada tratamiento que realiza Ledgera cuenta con una base jurídica específica
            conforme a los Arts. 8 y siguientes de la Ley N° 21.719:
          </p>
          <DataTable
            headers={["Finalidad", "Base jurídica (Ley 21.719)"]}
            rows={[
              [
                "Prestar el servicio de gestión tributaria de activos digitales contratado",
                "Ejecución del contrato — Art. 8 letra b)",
              ],
              [
                "Autenticación, control de acceso y prevención del fraude",
                "Ejecución del contrato + Interés legítimo — Art. 8 letras b) y f)",
              ],
              [
                "Facturación, cobro de suscripciones y gestión de reembolsos",
                "Ejecución del contrato — Art. 8 letra b)",
              ],
              [
                "Notificaciones del servicio: alertas tributarias, actualizaciones, cambios en Términos",
                "Ejecución del contrato — Art. 8 letra b)",
              ],
              [
                "Cumplimiento de obligaciones legales ante SII, UAF u otras autoridades",
                "Obligación legal — Art. 8 letra c)",
              ],
              [
                "Mejora del servicio mediante análisis estadísticos anónimos y agregados",
                "Interés legítimo — Art. 8 letra f)",
              ],
              [
                "Comunicaciones de marketing y novedades (opcionales)",
                "Consentimiento expreso y revocable — Art. 8 letra a)",
              ],
            ]}
          />
          <p>
            Los datos tributarios del Usuario{" "}
            <strong style={{ color: "var(--text)" }}>
              no se utilizan con fines publicitarios
            </strong>{" "}
            ni se comparten con terceros para ese propósito.
          </p>
        </LegalSection>

        <LegalSection title="5. Decisiones automatizadas e indicadores de riesgo">
          <p>
            En cumplimiento del{" "}
            <strong style={{ color: "var(--text)" }}>Art. 16 de la Ley N° 21.719</strong>,
            Ledgera informa que la Plataforma genera de forma automatizada los siguientes
            análisis basados en los datos del Usuario:
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
              <strong style={{ color: "var(--text)" }}>Indicadores de riesgo tributario:</strong>{" "}
              calculados a partir del volumen de operaciones, consistencia de registros y
              brechas detectadas entre períodos.
            </li>
            <li>
              <strong style={{ color: "var(--text)" }}>Alertas accionables:</strong> notificaciones
              automáticas sobre inconsistencias, operaciones sin clasificar o aproximación
              al cierre de período tributario.
            </li>
            <li>
              <strong style={{ color: "var(--text)" }}>Cálculo FIFO automatizado:</strong>{" "}
              determinación del costo tributario de cada activo aplicando el método First In,
              First Out conforme a la Circular SII N° 31/2021.
            </li>
          </ul>
          <InfoBox color="amber">
            <strong style={{ color: "var(--warn)" }}>Importante:</strong> Estas decisiones
            automatizadas son herramientas de{" "}
            <strong style={{ color: "var(--warn)" }}>asistencia informativa</strong> y no
            producen efectos jurídicos vinculantes sobre el Usuario. El Usuario conserva
            el control total de sus declaraciones ante el SII. Si desea impugnar o revisar
            cualquier cálculo automatizado, puede hacerlo directamente dentro de la
            Plataforma o contactando al EPD.
          </InfoBox>
        </LegalSection>

        <LegalSection title="6. Conservación de los datos">
          <p>
            Los datos personales se conservan durante la vigencia de la suscripción y por un
            período adicional de{" "}
            <strong style={{ color: "var(--text)" }}>5 años</strong> desde la cancelación de la
            cuenta, conforme al plazo de prescripción tributaria ordinaria establecido en el{" "}
            <strong style={{ color: "var(--text)" }}>Art. 200 del Código Tributario</strong>.
            Este plazo puede extenderse a{" "}
            <strong style={{ color: "var(--text)" }}>6 años</strong> cuando corresponda aplicar
            la prescripción extraordinaria del mismo artículo.
          </p>
          <DataTable
            headers={["Categoría de dato", "Plazo de conservación", "Fundamento"]}
            rows={[
              ["Datos de identificación y acceso", "Vigencia + 5 años", "Prescripción tributaria ordinaria"],
              ["Datos tributarios y financieros", "Vigencia + 5/6 años", "Art. 200 Código Tributario"],
              ["Logs de auditoría", "Vigencia + 5 años (solo lectura)", "Integridad del registro inmutable"],
              ["Datos técnicos y de red", "12 meses desde su generación", "Interés legítimo en seguridad"],
              ["Datos de facturación", "Vigencia + 7 años", "Ley N° 18.045 y normativa contable"],
            ]}
          />
          <p>
            Transcurridos los plazos indicados, los datos se eliminan de forma segura o se
            anonimizan de manera permanente, salvo que una obligación legal exija conservarlos
            por un período mayor.
          </p>
        </LegalSection>

        <LegalSection title="7. Destinatarios y transferencias internacionales">
          <p>
            Ledgera puede compartir datos con los siguientes proveedores en la medida
            estrictamente necesaria para prestar el servicio:
          </p>
          <DataTable
            headers={["Proveedor", "Rol", "País", "Base de la transferencia internacional"]}
            rows={[
              [
                "Vercel Inc.",
                "Encargado del tratamiento — Hosting y despliegue",
                "EE.UU.",
                "Cláusulas contractuales tipo + Data Processing Agreement (DPA) suscrito con Vercel",
              ],
              [
                "Cloudflare Inc.",
                "Encargado del tratamiento — CDN, seguridad y protección DDoS",
                "EE.UU.",
                "Cláusulas contractuales tipo + DPA suscrito con Cloudflare",
              ],
              [
                "Autoridades competentes (SII, UAF, tribunales)",
                "Receptor legal",
                "Chile",
                "Obligación legal — Art. 8 letra c) Ley 21.719",
              ],
            ]}
          />
          <InfoBox color="amber">
            <strong style={{ color: "var(--warn)" }}>Transferencias internacionales:</strong>{" "}
            Los datos transferidos a Vercel y Cloudflare (ambos radicados en EE.UU.) se
            amparan en{" "}
            <strong style={{ color: "var(--warn)" }}>
              Acuerdos de Procesamiento de Datos (DPA)
            </strong>{" "}
            que incluyen cláusulas contractuales tipo equivalentes a las exigidas por el{" "}
            <strong style={{ color: "var(--warn)" }}>Art. 27 de la Ley N° 21.719</strong> como
            garantía adecuada para la transferencia internacional. Ledgera no transfiere
            datos a países sin nivel de protección adecuado sin contar con dichas garantías.
          </InfoBox>
          <p>
            Ledgera{" "}
            <strong style={{ color: "var(--text)" }}>no vende, arrienda ni cede</strong> datos
            personales a terceros con fines comerciales o publicitarios.
          </p>
        </LegalSection>

        <LegalSection title="8. Derechos del titular">
          <p>
            Conforme a la{" "}
            <strong style={{ color: "var(--text)" }}>Ley N° 21.719</strong>, el Usuario tiene
            los siguientes derechos sobre sus datos personales, con los plazos de respuesta
            que la ley establece para cada uno:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {[
              {
                derecho: "Acceso",
                arts: "Art. 13",
                desc: "Conocer qué datos personales tratamos, con qué finalidad y obtener una copia.",
                plazo: "30 días corridos",
                color: "var(--accent)",
              },
              {
                derecho: "Rectificación",
                arts: "Art. 14",
                desc: "Corregir datos inexactos, incompletos o desactualizados.",
                plazo: "5 días hábiles",
                color: "var(--accent)",
              },
              {
                derecho: "Supresión",
                arts: "Art. 15",
                desc: "Solicitar la eliminación de datos cuando ya no sean necesarios, salvo obligación legal de conservarlos.",
                plazo: "5 días hábiles",
                color: "var(--accent)",
              },
              {
                derecho: "Oposición",
                arts: "Art. 16",
                desc: "Oponerse al tratamiento basado en interés legítimo o revocar el consentimiento otorgado.",
                plazo: "5 días hábiles",
                color: "var(--accent)",
              },
              {
                derecho: "Portabilidad",
                arts: "Art. 17",
                desc: "Recibir sus datos en formato estructurado, de uso común y legible por máquina (CSV o JSON).",
                plazo: "30 días corridos",
                color: "var(--accent)",
              },
              {
                derecho: "Limitación",
                arts: "Art. 18",
                desc: "Solicitar la suspensión del tratamiento mientras se verifica una reclamación o impugnación.",
                plazo: "5 días hábiles",
                color: "var(--accent)",
              },
              {
                derecho: "Impugnar decisiones automatizadas",
                arts: "Art. 16 bis",
                desc: "Solicitar revisión humana de cualquier indicador de riesgo o cálculo automatizado que le afecte.",
                plazo: "10 días hábiles",
                color: "var(--warn)",
              },
            ].map((d) => (
              <div
                key={d.derecho}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "10px",
                  padding: "0.9rem 1.1rem",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flexShrink: 0, minWidth: "130px" }}>
                  <span
                    style={{
                      display: "block",
                      color: d.color,
                      fontWeight: 700,
                      fontSize: "0.88rem",
                    }}
                  >
                    {d.derecho}
                  </span>
                  <span style={{ color: "var(--text)", fontSize: "0.75rem" }}>{d.arts}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 0.35rem", color: "var(--text-soft)", fontSize: "0.87rem", lineHeight: 1.6 }}>
                    {d.desc}
                  </p>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-soft)",
                      background: "rgba(255,255,255,0.04)",
                      padding: "0.1rem 0.5rem",
                      borderRadius: "999px",
                    }}
                  >
                    Plazo de respuesta: {d.plazo}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p>
            Para ejercer cualquiera de estos derechos, envíe una solicitud escrita a{" "}
            <a href="mailto:admin@ledgera.cl" style={{ color: "var(--accent)" }}>
              admin@ledgera.cl
            </a>{" "}
            con asunto <em>"Ejercicio de derechos — Ley 21.719"</em>, indicando el derecho
            que desea ejercer y adjuntando copia de su documento de identidad.
          </p>
        </LegalSection>

        <LegalSection title="9. Retiro del consentimiento">
          <p>
            Cuando el tratamiento de datos se base en el{" "}
            <strong style={{ color: "var(--text)" }}>consentimiento del Usuario</strong> (por
            ejemplo, comunicaciones de marketing opcionales), este podrá retirarlo en
            cualquier momento sin que ello afecte a la licitud del tratamiento previo.
          </p>
          <p>
            El retiro del consentimiento puede ejercerse:
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
              Mediante el enlace de baja incluido en cualquier correo electrónico de
              marketing enviado por Ledgera.
            </li>
            <li>
              Enviando una solicitud a{" "}
              <a href="mailto:admin@ledgera.cl" style={{ color: "var(--accent)" }}>
                admin@ledgera.cl
              </a>{" "}
              con asunto <em>"Retiro de consentimiento"</em>.
            </li>
            <li>
              Desde la configuración de notificaciones dentro de la Plataforma (cuando
              esta función esté disponible).
            </li>
          </ul>
          <InfoBox color="amber">
            <strong style={{ color: "var(--warn)" }}>Importante:</strong> El retiro del
            consentimiento para el tratamiento necesario para la ejecución del contrato
            (autenticación, cálculos FIFO, facturación) equivale a la resolución del contrato
            de servicios, por lo que implicará la cancelación de la cuenta.
          </InfoBox>
        </LegalSection>

        <LegalSection title="10. Seguridad de los datos">
          <p>
            En cumplimiento del{" "}
            <strong style={{ color: "var(--text)" }}>Art. 11 de la Ley N° 21.719</strong>,
            Ledgera implementa las siguientes medidas técnicas y organizativas:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {[
              { label: "Cifrado en tránsito", desc: "TLS 1.3 en todas las comunicaciones entre el Usuario y la Plataforma." },
              { label: "Contraseñas", desc: "Almacenadas con hash bcrypt. Nunca se guardan en texto plano ni se transmiten." },
              { label: "Sesiones", desc: "Tokens de corta duración con renovación automática y revocación inmediata al cerrar sesión." },
              { label: "Doble factor (2FA)", desc: "Disponible para todos los usuarios. Recomendado para cuentas con datos tributarios." },
              { label: "Control de acceso interno", desc: "Acceso a datos de producción restringido al equipo mínimo necesario, con trazabilidad." },
              { label: "Auditoría inmutable", desc: "Registro inalterable de eventos sensibles dentro de la Plataforma." },
              { label: "Proveedores certificados", desc: "Vercel y Cloudflare cuentan con certificaciones SOC 2 Type II e ISO 27001." },
            ].map((m) => (
              <div
                key={m.label}
                style={{ display: "flex", gap: "0.8rem", alignItems: "flex-start" }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--accent)",
                    marginTop: "0.6rem",
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "var(--text-soft)", fontSize: "0.9rem", lineHeight: 1.7 }}>
                  <strong style={{ color: "var(--text)" }}>{m.label}:</strong> {m.desc}
                </span>
              </div>
            ))}
          </div>
          <p>
            En caso de producirse una brecha de seguridad que pueda afectar los derechos del
            Usuario, Ledgera lo notificará en el plazo y forma exigidos por el{" "}
            <strong style={{ color: "var(--text)" }}>Art. 11 de la Ley N° 21.719</strong>, y
            adoptará las medidas correctivas de forma inmediata.
          </p>
        </LegalSection>

        <LegalSection title="11. Menores de edad">
          <p>
            La Plataforma está destinada exclusivamente a personas naturales mayores de{" "}
            <strong style={{ color: "var(--text)" }}>18 años</strong> y a personas jurídicas
            debidamente representadas. Ledgera no recopila conscientemente datos de menores
            de edad sin consentimiento parental.
          </p>
          <p>
            Si detectamos que un menor de 18 años ha proporcionado datos personales sin
            autorización de su representante legal, procederemos a eliminarlos de forma
            inmediata y a cancelar la cuenta asociada, en cumplimiento del{" "}
            <strong style={{ color: "var(--text)" }}>Art. 16 de la Ley N° 21.719</strong>.
          </p>
        </LegalSection>

        <LegalSection title="12. Relación con la Política de Cookies">
          <p>
            Las cookies y tecnologías similares utilizadas por Ledgera implican el
            tratamiento de datos personales (dirección IP, identificadores de sesión,
            preferencias) y forman parte del sistema de privacidad descrito en esta Política.
          </p>
          <p>
            La información detallada sobre los tipos de cookies utilizadas, su finalidad,
            duración y los proveedores que las instalan se encuentra en la{" "}
            <Link href="/cookies" style={{ color: "var(--accent)" }}>
              Política de Cookies
            </Link>
            , que complementa y debe leerse junto con la presente Política de Privacidad.
          </p>
          <InfoBox color="indigo">
            Las cookies estrictamente necesarias (sesión y seguridad) se tratan bajo la base
            jurídica de{" "}
            <strong style={{ color: "var(--text-faint)" }}>ejecución del contrato</strong>. Las cookies
            analíticas opcionales requieren{" "}
            <strong style={{ color: "var(--text-faint)" }}>consentimiento expreso</strong>, revocable
            en cualquier momento desde la configuración del navegador.
          </InfoBox>
        </LegalSection>

        <LegalSection title="13. Modificaciones">
          <p>
            Ledgera podrá actualizar esta Política para reflejar cambios en la normativa,
            en los proveedores o en las funcionalidades de la Plataforma.
          </p>
          <p>
            Los cambios significativos serán notificados al correo electrónico registrado
            con al menos{" "}
            <strong style={{ color: "var(--text)" }}>10 días hábiles de anticipación</strong>.
            Continuando con el uso de la Plataforma tras ese plazo, el Usuario manifiesta
            su aceptación de la nueva versión.
          </p>
          <p>
            Si el Usuario no acepta los cambios, podrá resolver el contrato conforme a lo
            dispuesto en los{" "}
            <Link href="/terminos" style={{ color: "var(--accent)" }}>
              Términos y Condiciones
            </Link>{" "}
            sección 12.
          </p>
        </LegalSection>

        <LegalSection title="14. Contacto y reclamaciones">
          <p>
            Para consultas, solicitudes de ejercicio de derechos o reporte de incidentes de
            seguridad:
          </p>
          <InfoBox color="indigo">
            <strong style={{ color: "var(--text-faint)" }}>EPD — Ledgera SpA</strong>
            {"  ·  "}
            <a href="mailto:admin@ledgera.cl" style={{ color: "var(--accent)" }}>
              admin@ledgera.cl
            </a>
            {"  ·  "}
            Asunto: "Protección de datos"
          </InfoBox>
          <p>
            Si considera que su solicitud no fue atendida de forma satisfactoria, tiene
            derecho a presentar una reclamación ante la{" "}
            <strong style={{ color: "var(--text)" }}>
              Agencia de Protección de Datos Personales
            </strong>{" "}
            (autoridad de control establecida por la Ley N° 21.719) o, en forma transitoria
            mientras dicha institución completa su constitución, ante el{" "}
            <strong style={{ color: "var(--text)" }}>Consejo para la Transparencia</strong>.
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
          <span style={{ color: "var(--text-soft)", fontSize: "0.85rem", alignSelf: "center" }}>
            Ver también:
          </span>
          <Link
            href="/terminos"
            style={{ color: "var(--accent)", fontSize: "0.85rem", textDecoration: "none" }}
          >
            Términos y Condiciones →
          </Link>
          <Link
            href="/cookies"
            style={{ color: "var(--accent)", fontSize: "0.85rem", textDecoration: "none" }}
          >
            Política de Cookies →
          </Link>
        </div>
      </main>

      {/* FOOTER */}
      <footer
        style={{
          background: "var(--bg-elev)",
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
                  color: "var(--text)",
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
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
                  Producto
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link href="/register" style={{ fontSize: "13px", color: "var(--text)", textDecoration: "none" }}>Comenzar gratis</Link>
                  <Link href="/login" style={{ fontSize: "13px", color: "var(--text)", textDecoration: "none" }}>Iniciar sesión</Link>
                  <Link href="/blog" style={{ fontSize: "13px", color: "var(--text)", textDecoration: "none" }}>Blog</Link>
                </div>
              </div>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
                  Legal
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link href="/terminos" style={{ fontSize: "13px", color: "var(--text)", textDecoration: "none" }}>Términos y condiciones</Link>
                  <Link href="/privacidad" style={{ fontSize: "13px", color: "var(--text)", textDecoration: "none" }}>Política de privacidad</Link>
                  <Link href="/cookies" style={{ fontSize: "13px", color: "var(--text)", textDecoration: "none" }}>Política de cookies</Link>
                </div>
              </div>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
                  Contacto
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <a href="mailto:admin@ledgera.cl" style={{ fontSize: "13px", color: "var(--text)", textDecoration: "none" }}>admin@ledgera.cl</a>
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
            <span style={{ fontSize: "12px", color: "var(--text)" }}>
              © {new Date().getFullYear()} Ledgera SpA · Chile · Ley 21.719 protección de datos
            </span>
            <span style={{ fontSize: "12px", color: "var(--text)" }}>ledgera.cl</span>
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
              stroke="var(--text-faint)"
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

function InfoBox({
  children,
  color = "indigo",
}: {
  children: React.ReactNode;
  color?: "indigo" | "amber" | "red";
}) {
  const palette = {
    indigo: { bg: "rgba(99,102,241,0.06)", border: "rgba(99,102,241,0.15)", text: "var(--text-faint)" },
    amber: { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.18)", text: "var(--warn)" },
    red: { bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.18)", text: "var(--loss)" },
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

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.84rem",
          color: "var(--text-soft)",
        }}
      >
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "0.6rem 0.8rem",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--text-faint)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{
                background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
              }}
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "0.6rem 0.8rem",
                    color: j === 0 ? "var(--text)" : "var(--text-soft)",
                    fontWeight: j === 0 ? 500 : 400,
                    verticalAlign: "top",
                    lineHeight: 1.6,
                  }}
                >
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
