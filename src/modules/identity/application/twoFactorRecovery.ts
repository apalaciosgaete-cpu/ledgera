import {
  consumeOneTimeToken,
  issueOneTimeToken,
  readOneTimeToken,
  replaceOneTimeTokenIdentifier,
} from "@/modules/identity/infrastructure/oneTimeTokenRepository";
import {
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
} from "@/modules/identity/application/twoFactorSecret";

const TWO_FACTOR_RECOVERY_TTL_MS = 15 * 60 * 1000;
const PREFIX = "2fa-recovery:";
const VERSION_MARKER = "v2:";

type RecoveryPayload = {
  email: string;
  pendingSecret?: string;
};

type RecoveryIdentity = {
  userId: string;
  email: string;
  pendingSecret: string | null;
};

function buildUserPrefix(userId: string) {
  return `${PREFIX}${userId}:`;
}

function buildIdentifier(input: {
  userId: string;
  email: string;
  pendingSecret?: string;
}) {
  const payload: RecoveryPayload = {
    email: input.email.trim().toLowerCase(),
    ...(input.pendingSecret
      ? { pendingSecret: encryptTwoFactorSecret(input.pendingSecret) }
      : {}),
  };

  return `${buildUserPrefix(input.userId)}${VERSION_MARKER}${Buffer.from(
    JSON.stringify(payload),
    "utf8",
  ).toString("base64url")}`;
}

function parseIdentifier(identifier: string): RecoveryIdentity | null {
  if (!identifier.startsWith(PREFIX)) return null;

  const value = identifier.slice(PREFIX.length);
  const separatorIndex = value.indexOf(":");
  if (separatorIndex <= 0) return null;

  const userId = value.slice(0, separatorIndex);
  const remainder = value.slice(separatorIndex + 1);
  if (!userId || !remainder) return null;

  // Backward compatibility for recovery links issued before pending secrets
  // were kept separate from the active authenticator.
  if (!remainder.startsWith(VERSION_MARKER)) {
    const email = remainder.trim().toLowerCase();
    return email ? { userId, email, pendingSecret: null } : null;
  }

  try {
    const encodedPayload = remainder.slice(VERSION_MARKER.length);
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as RecoveryPayload;
    const email = String(payload.email ?? "").trim().toLowerCase();
    if (!email) return null;

    return {
      userId,
      email,
      pendingSecret: payload.pendingSecret
        ? decryptTwoFactorSecret(payload.pendingSecret)
        : null,
    };
  } catch {
    return null;
  }
}

export async function issueTwoFactorRecovery(input: {
  userId: string;
  email: string;
}) {
  return issueOneTimeToken({
    identifier: buildIdentifier(input),
    revokeIdentifierPrefix: buildUserPrefix(input.userId),
    ttlMs: TWO_FACTOR_RECOVERY_TTL_MS,
  });
}

export async function readTwoFactorRecovery(token: string) {
  const record = await readOneTimeToken(token);
  if (!record) return null;
  return parseIdentifier(record.identifier);
}

export async function prepareTwoFactorRecovery(
  token: string,
  pendingSecret: string,
) {
  const record = await readOneTimeToken(token);
  if (!record) return null;

  const identity = parseIdentifier(record.identifier);
  if (!identity) return null;
  if (identity.pendingSecret) return identity;

  const nextIdentifier = buildIdentifier({
    userId: identity.userId,
    email: identity.email,
    pendingSecret,
  });
  const replaced = await replaceOneTimeTokenIdentifier({
    token,
    currentIdentifier: record.identifier,
    nextIdentifier,
  });

  if (replaced) {
    return { ...identity, pendingSecret };
  }

  // A concurrent page load may have prepared the same recovery first. Re-read
  // the token so every tab receives the single canonical pending secret.
  return readTwoFactorRecovery(token);
}

export async function consumeTwoFactorRecovery(token: string) {
  const record = await consumeOneTimeToken(token);
  if (!record) return null;
  return parseIdentifier(record.identifier);
}
