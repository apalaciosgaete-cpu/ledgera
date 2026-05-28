// src/app/terminos/page.tsx
import Link from "next/link";
import { LegalNotice, LegalSection, LegalShell, PUBLIC_CONTACT_EMAIL } from "@/components/public/PublicLayout";

export default function TerminosPage() {
  return (
    <LegalShell title="Términos y Condiciones" updatedAt="8 de mayo de 2026" version="2.0">
      <LegalNotice>
        LEDGERA es una plataforma de software para ordenar información financiera-tributaria relacionada con criptoactivos. No reemplaza la asesoría de un contador, abogado o asesor tributario. El usuario mantiene la responsabilidad final sobre sus antecedentes y declaraciones.
      </LegalNotice>

      <LegalSection title="1. Identificación del prestador">
        <p>
          LEDGERA es un servicio de software como servicio orientado a personas, contadores y empresas que necesitan organizar movimientos crypto, banco, portafolio y base tributaria trazable en Chile.
        </p>
        <p>
          Contacto oficial: <a href={`mailto:${PUBLIC_CONTACT_EMAIL}`} style={{ color: "#4ADE80" }}>{PUBLIC_CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>

      <LegalSection title="2. Aceptación del servicio">
        <p>
          Al registrarse, acceder o utilizar LEDGERA, el usuario declara haber leído y aceptado estos términos, junto con la <Link href="/privacidad" style={{ color: "#4ADE80" }}>Política de Privacidad</Link> y la <Link href="/cookies" style={{ color: "#4ADE80" }}>Política de Cookies</Link>.
        </p>
        <p>
          Si el usuario no está de acuerdo con estas condiciones, debe abstenerse de usar la plataforma.
        </p>
      </LegalSection>

      <LegalSection title="3. Descripción del servicio">
        <p>LEDGERA puede incluir, según el plan o etapa del producto:</p>
        <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
          <li>Registro, importación y revisión de movimientos de criptoactivos.</li>
          <li>Conciliación entre banco, exchange y portafolio.</li>
          <li>Cálculos financieros y tributarios con trazabilidad.</li>
          <li>Reportes exportables para revisión profesional.</li>
          <li>Auditoría de cambios, respaldos y verificación pública de reportes cuando corresponda.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Cuenta de usuario y seguridad">
        <p>
          El usuario debe entregar información verdadera, mantener la confidencialidad de sus credenciales y notificar cualquier uso no autorizado de su cuenta.
        </p>
        <p>
          LEDGERA podrá suspender o limitar cuentas cuando existan indicios de uso indebido, fraude, afectación de seguridad, incumplimiento legal o vulneración de estos términos.
        </p>
      </LegalSection>

      <LegalSection title="5. Alcance tributario">
        <p>
          LEDGERA prepara y organiza información. La interpretación tributaria final, presentación ante autoridades y validación profesional dependen del usuario y de sus asesores.
        </p>
        <p>
          Los cálculos y reportes deben revisarse antes de ser usados como respaldo tributario, contable o financiero.
        </p>
      </LegalSection>

      <LegalSection title="6. Disponibilidad y cambios">
        <p>
          LEDGERA puede actualizar, modificar, suspender o discontinuar funciones para mejorar seguridad, cumplimiento, rendimiento o viabilidad operacional.
        </p>
        <p>
          Las condiciones comerciales, planes y funcionalidades pueden variar según etapa del producto, disponibilidad técnica y revisión comercial.
        </p>
      </LegalSection>

      <LegalSection title="7. Propiedad intelectual">
        <p>
          La marca, software, diseño, textos, estructura, componentes y documentación de LEDGERA pertenecen a sus titulares o licenciantes. El usuario no adquiere derechos de propiedad intelectual por usar la plataforma.
        </p>
      </LegalSection>

      <LegalSection title="8. Contacto">
        <p>
          Para consultas legales, comerciales o de soporte, escribir a <a href={`mailto:${PUBLIC_CONTACT_EMAIL}`} style={{ color: "#4ADE80" }}>{PUBLIC_CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
