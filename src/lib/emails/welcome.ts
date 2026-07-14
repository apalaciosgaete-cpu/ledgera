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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resolveApplicationUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "https://ledgera.cl"
  ).replace(/\/$/, "");
}

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

  const safeName = escapeHtml(fullName || "Usuario");
  const safeEmail = escapeHtml(to);
  const safeRole = escapeHtml(roleLabel[role] ?? role);
  const loginUrl = escapeHtml(`${resolveApplicationUrl()}/login`);

  const result = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject: "Tu correo fue verificado — Bienvenido a LEDGERA",
    html: `
      <!doctype html>
      <html lang="es">
        <body style="margin:0;background:#07111f;color:#e6edf7;font-family:Arial,sans-serif;padding:32px 16px;">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tu dirección de correo fue confirmada y tu cuenta LEDGERA está lista.</div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#0d1727;border:1px solid #23324a;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 12px;color:#38bdf8;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Cuenta verificada</p>
                <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;color:#ffffff;">Tu cuenta está lista</h1>
                <p style="margin:0 0 12px;color:#cbd5e1;line-height:1.65;">Hola ${safeName},</p>
                <p style="margin:0 0 16px;color:#cbd5e1;line-height:1.65;">Confirmamos correctamente la dirección <strong style="color:#ffffff;">${safeEmail}</strong>.</p>
                <p style="margin:0 0 16px;color:#cbd5e1;line-height:1.65;">Tu perfil de acceso está configurado como <strong style="color:#ffffff;">${safeRole}</strong>. Desde ahora podrás recuperar el acceso de forma segura y recibir comunicaciones importantes relacionadas con tu cuenta.</p>
                <p style="margin:0 0 28px;color:#cbd5e1;line-height:1.65;">Ya puedes continuar trabajando en tu panel de LEDGERA.</p>
                <p style="margin:0 0 28px;">
                  <a href="${loginUrl}" style="display:inline-block;background:#38bdf8;color:#07111f;text-decoration:none;font-weight:800;padding:13px 20px;border-radius:10px;">Ingresar a LEDGERA</a>
                </p>
                <div style="border-top:1px solid #23324a;padding-top:18px;">
                  <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Este mensaje fue enviado porque esta dirección se verificó en una cuenta de LEDGERA. Si no realizaste esta acción, contacta al equipo de soporte.</p>
                </div>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `.trim(),
  });

  if (result.error) {
    throw new Error(result.error.message || "Resend rechazó el correo de bienvenida.");
  }

  return result.data;
}
