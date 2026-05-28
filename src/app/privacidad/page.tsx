// src/app/privacidad/page.tsx
import Link from "next/link";
import { LegalNotice, LegalSection, LegalShell, PUBLIC_CONTACT_EMAIL } from "@/components/public/PublicLayout";

export default function PrivacidadPage() {
  return (
    <LegalShell title="Política de Privacidad" updatedAt="8 de mayo de 2026" version="2.0">
      <LegalNotice>
        Esta política explica cómo LEDGERA trata datos personales y operacionales para prestar el servicio, proteger cuentas, mantener trazabilidad y cumplir obligaciones legales aplicables en Chile.
      </LegalNotice>

      <LegalSection title="1. Responsable del tratamiento">
        <p>
          El responsable del tratamiento de datos es LEDGERA. Para consultas relacionadas con privacidad o protección de datos, el canal oficial es <a href={`mailto:${PUBLIC_CONTACT_EMAIL}`} style={{ color: "#4ADE80" }}>{PUBLIC_CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>

      <LegalSection title="2. Datos que podemos tratar">
        <p>Según el uso de la plataforma, LEDGERA puede tratar:</p>
        <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
          <li>Datos de identificación y contacto: nombre, correo, empresa o rol.</li>
          <li>Datos de cuenta: credenciales cifradas, sesiones, actividad de acceso y configuración.</li>
          <li>Datos financieros importados o cargados por el usuario: movimientos, montos, fechas, activos, exchanges, bancos y archivos asociados.</li>
          <li>Datos técnicos: dirección IP, user agent, registros de auditoría, errores y eventos de seguridad.</li>
          <li>Datos comerciales: plan, estado de suscripción, solicitudes de contacto y comunicaciones.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Finalidades del tratamiento">
        <p>Los datos se utilizan para:</p>
        <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
          <li>Crear y administrar cuentas.</li>
          <li>Prestar funciones de importación, conciliación, portafolio, reportes y trazabilidad.</li>
          <li>Proteger la seguridad de la plataforma y prevenir accesos indebidos.</li>
          <li>Generar registros de auditoría y respaldos operacionales.</li>
          <li>Responder consultas, soporte y solicitudes comerciales.</li>
          <li>Cumplir obligaciones legales o requerimientos de autoridad cuando corresponda.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Base legal y responsabilidad del usuario">
        <p>
          El tratamiento puede fundarse en la ejecución del servicio contratado, consentimiento, interés legítimo, cumplimiento legal o medidas precontractuales.
        </p>
        <p>
          El usuario declara contar con autorización suficiente para cargar información propia o de terceros cuando use LEDGERA como contador, asesor, empresa o administrador de clientes.
        </p>
      </LegalSection>

      <LegalSection title="5. Seguridad y trazabilidad">
        <p>
          LEDGERA aplica medidas técnicas y organizativas para proteger la información, incluyendo controles de sesión, registros de auditoría, separación de responsabilidades y monitoreo de eventos relevantes.
        </p>
        <p>
          Ningún sistema es completamente invulnerable. Ante incidentes, LEDGERA evaluará medidas de contención, comunicación y corrección según corresponda.
        </p>
      </LegalSection>

      <LegalSection title="6. Conservación de datos">
        <p>
          Los datos pueden conservarse mientras la cuenta esté activa, mientras exista una relación contractual, mientras sean necesarios para trazabilidad, respaldo, seguridad, cumplimiento legal o defensa ante reclamos.
        </p>
      </LegalSection>

      <LegalSection title="7. Derechos del titular">
        <p>
          El titular puede solicitar acceso, rectificación, actualización, eliminación, oposición o bloqueo cuando corresponda conforme a la normativa aplicable.
        </p>
        <p>
          Las solicitudes deben enviarse a <a href={`mailto:${PUBLIC_CONTACT_EMAIL}`} style={{ color: "#4ADE80" }}>{PUBLIC_CONTACT_EMAIL}</a> indicando el asunto “Protección de datos”.
        </p>
      </LegalSection>

      <LegalSection title="8. Relación con otros documentos">
        <p>
          Esta política se complementa con los <Link href="/terminos" style={{ color: "#4ADE80" }}>Términos y Condiciones</Link> y la <Link href="/cookies" style={{ color: "#4ADE80" }}>Política de Cookies</Link>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
