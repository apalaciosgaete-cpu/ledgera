// src/app/cookies/page.tsx
import Link from "next/link";
import { LegalNotice, LegalSection, LegalShell, PUBLIC_CONTACT_EMAIL } from "@/components/public/PublicLayout";

export default function CookiesPage() {
  return (
    <LegalShell title="Política de Cookies" updatedAt="8 de mayo de 2026" version="1.0">
      <LegalNotice>
        LEDGERA utiliza cookies y tecnologías similares para operar sesiones, recordar preferencias, mejorar seguridad y medir funcionamiento básico del sitio. No vendemos datos personales a redes publicitarias.
      </LegalNotice>

      <LegalSection title="1. Qué son las cookies">
        <p>
          Las cookies son pequeños archivos que un sitio puede almacenar en el navegador para recordar información técnica o preferencias durante la navegación.
        </p>
        <p>
          También podemos usar tecnologías equivalentes, como localStorage, sessionStorage, tokens de sesión y registros técnicos de seguridad.
        </p>
      </LegalSection>

      <LegalSection title="2. Cookies estrictamente necesarias">
        <p>
          Son esenciales para que la plataforma funcione. Pueden utilizarse para mantener sesión, proteger formularios, recordar estado de autenticación, prevenir abuso y permitir funciones básicas.
        </p>
        <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
          <li>Tokens de sesión.</li>
          <li>Preferencias esenciales de seguridad.</li>
          <li>Registros técnicos necesarios para prevenir fraude o abuso.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Cookies funcionales">
        <p>
          Permiten recordar preferencias del usuario o configuraciones del sitio, por ejemplo aceptación del banner de cookies, preferencias de interfaz o estado de navegación.
        </p>
      </LegalSection>

      <LegalSection title="4. Cookies analíticas">
        <p>
          Podemos usar medición agregada para entender rendimiento, errores, fuentes de tráfico y uso general del sitio. Cuando se utilicen herramientas de terceros, se procurará limitar la información al mínimo necesario.
        </p>
      </LegalSection>

      <LegalSection title="5. Cookies de terceros">
        <p>
          Algunos proveedores de infraestructura, analítica, pagos, seguridad o comunicación pueden usar cookies propias conforme a sus políticas. Ejemplos posibles: proveedores de hosting, CDN, analítica, pagos o comunicaciones.
        </p>
      </LegalSection>

      <LegalSection title="6. Gestión de cookies">
        <p>
          El usuario puede configurar su navegador para bloquear, eliminar o limitar cookies. Algunas funciones de LEDGERA pueden dejar de operar correctamente si se bloquean cookies esenciales.
        </p>
      </LegalSection>

      <LegalSection title="7. Más información">
        <p>
          Esta política se complementa con la <Link href="/privacidad" style={{ color: "#4ADE80" }}>Política de Privacidad</Link> y los <Link href="/terminos" style={{ color: "#4ADE80" }}>Términos y Condiciones</Link>.
        </p>
        <p>
          Para consultas, escribir a <a href={`mailto:${PUBLIC_CONTACT_EMAIL}`} style={{ color: "#4ADE80" }}>{PUBLIC_CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
