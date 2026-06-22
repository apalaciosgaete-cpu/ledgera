import { FROM_EMAIL, FROM_NAME, getResendClient } from "@/lib/resend";

type WelcomeEmailParams = {
  to: string;
  fullName: string;
  role: string;
};

const roleLabel: Record<string, string> = {
  personal: "Persona natural",
  contador: "Contador",
  empresa: "Empresa",
  admin: "Administrador",
};

export async function sendWelcomeEmail({
  to,
  fullName,
  role,
}: WelcomeEmailParams) {
  const resend = getResendClient();

  if (!resend) {
    console.warn("[sendWelcomeEmail] RESEND_API_KEY no configurada. Email omitido.");
    return;
  }

  const label = roleLabel[role] ?? role;

  await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject: "Bienvenido a Ledgera — Tu cuenta está lista",
    html: `
      <h1>Bienvenido, ${fullName}</h1>
      <p>Tu cuenta en Ledgera ha sido creada exitosamente como <strong>${label}</strong>.</p>
      <p>Correo: ${to}</p>
      <p><a href="https://ledgera.cl/login">Ingresar a Ledgera</a></p>
    `.trim(),
  });
}