import { sendPasswordResetEmail } from "@/lib/emails/passwordReset";
import { issueOneTimeToken } from "@/modules/identity/infrastructure/oneTimeTokenRepository";

const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const PREFIX = "password-reset:";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://ledgera.cl").replace(/\/$/, "");
}

export function parsePasswordResetIdentifier(identifier: string) {
  if (!identifier.startsWith(PREFIX)) return null;
  const userId = identifier.slice(PREFIX.length).trim();
  return userId || null;
}

export async function issuePasswordReset(input: { userId: string; email: string; fullName: string }) {
  const { token, expires } = await issueOneTimeToken({
    identifier: `${PREFIX}${input.userId}`,
    ttlMs: PASSWORD_RESET_TTL_MS,
  });
  await sendPasswordResetEmail({
    to: input.email,
    fullName: input.fullName,
    resetUrl: `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`,
    expiresAt: expires,
  });
  return { expiresAt: expires };
}
