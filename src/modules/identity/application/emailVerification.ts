import { sendEmailVerificationEmail } from "@/lib/emails/emailVerification";
import { issueOneTimeToken } from "@/modules/identity/infrastructure/oneTimeTokenRepository";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function resolveApplicationUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "https://ledgera.cl"
  ).replace(/\/$/, "");
}

export function buildEmailVerificationIdentifier(userId: string, email: string) {
  return `email-verification:${userId}:${email.trim().toLowerCase()}`;
}

export function parseEmailVerificationIdentifier(identifier: string) {
  const prefix = "email-verification:";
  if (!identifier.startsWith(prefix)) return null;

  const value = identifier.slice(prefix.length);
  const separatorIndex = value.indexOf(":");
  if (separatorIndex <= 0) return null;

  const userId = value.slice(0, separatorIndex);
  const email = value.slice(separatorIndex + 1).trim().toLowerCase();

  if (!userId || !email) return null;
  return { userId, email };
}

export async function issueEmailVerification(input: {
  userId: string;
  email: string;
  fullName: string;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const identifier = buildEmailVerificationIdentifier(
    input.userId,
    normalizedEmail,
  );
  const { token, expires } = await issueOneTimeToken({
    identifier,
    ttlMs: EMAIL_VERIFICATION_TTL_MS,
  });
  const verificationUrl = `${resolveApplicationUrl()}/api/email-verification/verify?token=${encodeURIComponent(token)}`;

  await sendEmailVerificationEmail({
    to: normalizedEmail,
    fullName: input.fullName,
    verificationUrl,
    expiresAt: expires,
  });

  return { expiresAt: expires };
}
