import { FROM_EMAIL, FROM_NAME, getResendClient } from "@/lib/resend";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendTwoFactorRecoveryEmail(input: {
  to: string;
  fullName: string;
  recoveryUrl: string;
  expiresAt: Date;
}) {
  const resend = getResendClient();

  if (!resend) {
    throw new Error("RESEND_API_KEY no está configurada.");
  }

  const fullName = escapeHtml(input.fullName || "Usuario");
  const recoveryUrl = escapeHtml(input.recoveryUrl);
  const expiresLabel = input.expiresAt.toLocaleString("es-CL", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Santiago",
  });

  const result = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: input.to,
    subject: "Recupera tu autenticador en LEDGERA",
    html: `
      <!doctype html>
      <html lang="es">
        <body style="margin:0;background:#07111f;color:#e6edf7;font-family:Arial,sans-serif;padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#0d1727;border:1px solid #23324a;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 12px;color:#38bdf8;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Seguridad de cuenta</p>
                <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;color:#ffffff;">Recupera el acceso a tu autenticador</h1>
                <p style="margin:0 0 12px;color:#cbd5e1;line-height:1.65;">Hola ${fullName},</p>
                <p style="margin:0 0 24px;color:#cbd5e1;line-height:1.65;">Se solicitó reemplazar el autenticador TOTP asociado a tu cuenta LEDGERA. Abre el enlace para generar un nuevo código QR y completar la recuperación.</p>
                <p style="margin:0 0 28px;">
                  <a href="${recoveryUrl}" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:10px;">Recuperar autenticador</a>
                </p>
                <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;line-height:1.55;">El enlace vence el ${escapeHtml(expiresLabel)}.</p>
                <p style="margin:0;color:#64748b;font-size:12px;line-height:1.55;">Si no solicitaste esta recuperación, cambia tu contraseña y contacta al soporte de LEDGERA. No compartas este enlace.</p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `.trim(),
  });

  if (result.error) {
    throw new Error(result.error.message || "Resend rechazó el correo de recuperación 2FA.");
  }

  return result.data;
}
