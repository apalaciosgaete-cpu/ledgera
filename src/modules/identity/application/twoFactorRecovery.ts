import {
  consumeOneTimeToken,
  issueOneTimeToken,
  readOneTimeToken,
} from "@/modules/identity/infrastructure/oneTimeTokenRepository";

const TWO_FACTOR_RECOVERY_TTL_MS = 15 * 60 * 1000;
const PREFIX = "2fa-recovery:";

function buildIdentifier(userId: string, email: string) {
  return `${PREFIX}${userId}:${email.trim().toLowerCase()}`;
}

function parseIdentifier(identifier: string) {
  if (!identifier.startsWith(PREFIX)) return null;

  const value = identifier.slice(PREFIX.length);
  const separatorIndex = value.indexOf(":");
  if (separatorIndex <= 0) return null;

  const userId = value.slice(0, separatorIndex);
  const email = value.slice(separatorIndex + 1).trim().toLowerCase();

  if (!userId || !email) return null;
  return { userId, email };
}

export async function issueTwoFactorRecovery(input: {
  userId: string;
  email: string;
}) {
  return issueOneTimeToken({
    identifier: buildIdentifier(input.userId, input.email),
    ttlMs: TWO_FACTOR_RECOVERY_TTL_MS,
  });
}

export async function readTwoFactorRecovery(token: string) {
  const record = await readOneTimeToken(token);
  if (!record) return null;
  return parseIdentifier(record.identifier);
}

export async function consumeTwoFactorRecovery(token: string) {
  const record = await consumeOneTimeToken(token);
  if (!record) return null;
  return parseIdentifier(record.identifier);
}
