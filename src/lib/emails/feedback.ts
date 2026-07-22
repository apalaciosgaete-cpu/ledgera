import { FROM_EMAIL, FROM_NAME, getResendClient } from "@/lib/resend";

type FeedbackEmailParams = {
  expectation: string;
  useful: string;
  clarity: string;
  feature: string;
  contactRequested: boolean;
  email: string;
};

const labels: Array<[keyof Pick<FeedbackEmailParams, "expectation" | "useful" | "clarity" | "feature">, string]> = [
  ["expectation", "¿Qué esperaba resolver?"],
  ["useful", "¿Qué parte fue más útil?"],
  ["clarity", "¿Qué debería ser más claro?"],
  ["feature", "¿Qué función debería incorporarse?"],
];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderAnswer(label: string, answer: string) {
  const safeAnswer = answer
    ? escapeHtml(answer).replaceAll("\n", "<br />")
    : '<span style="color:#64748b;">Sin respuesta</span>';

  return `
    <div style="padding:20px 0;border-bottom:1px solid #23324a;">
      <p style="margin:0 0 8px;color:#c9a84c;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;">${escapeHtml(label)}</p>
      <p style="margin:0;color:#e2e8f0;font-size:15px;line-height:1.65;">${safeAnswer}</p>
    </div>
  `;
}

export async function sendFeedbackEmail(params: FeedbackEmailParams) {
  const resend = getResendClient();
  if (!resend) return null;

  const recipient = process.env.FEEDBACK_TO_EMAIL ?? "admin@ledgera.cl";
  const contactLabel = params.contactRequested
    ? `Sí — ${escapeHtml(params.email)}`
    : "No solicitó contacto";
  const answerHtml = labels
    .map(([key, label]) => renderAnswer(label, params[key]))
    .join("");
  const textAnswers = labels
    .map(([key, label]) => `${label}\n${params[key] || "Sin respuesta"}`)
    .join("\n\n");

  const result = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: recipient,
    subject: "Nueva opinión sobre LEDGERA",
    ...(params.contactRequested && params.email ? { replyTo: params.email } : {}),
    text: `${textAnswers}\n\n¿Solicita contacto?\n${params.contactRequested ? `Sí — ${params.email}` : "No"}`,
    html: `
      <!doctype html>
      <html lang="es">
        <body style="margin:0;background:#07111f;color:#e6edf7;font-family:Arial,sans-serif;padding:32px 16px;">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Nueva opinión enviada desde ledgera.cl.</div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:660px;margin:0 auto;background:#0d1727;border:1px solid #23324a;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 12px;color:#c9a84c;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">Opinión de producto</p>
                <h1 style="margin:0 0 8px;color:#ffffff;font-size:26px;line-height:1.2;">Nueva respuesta desde LEDGERA</h1>
                <p style="margin:0 0 10px;color:#94a3b8;line-height:1.6;">Una persona compartió su experiencia desde el formulario público.</p>
                ${answerHtml}
                <div style="padding-top:20px;">
                  <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;font-weight:800;text-transform:uppercase;">¿Solicita contacto?</p>
                  <p style="margin:0;color:#ffffff;line-height:1.6;">${contactLabel}</p>
                </div>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `.trim(),
  });

  if (result.error) {
    throw new Error(result.error.message || "Resend rechazó el correo de opinión.");
  }

  return result.data;
}
