import crypto from "node:crypto";

import { prisma } from "@/lib/prisma";

export type OneTimeTokenRecord = {
  identifier: string;
  expires: Date;
};

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function issueOneTimeToken(input: {
  identifier: string;
  ttlMs: number;
  revokeIdentifierPrefix?: string;
}) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + input.ttlMs);

  await prisma.$transaction([
    prisma.oneTimeToken.deleteMany({
      where: input.revokeIdentifierPrefix
        ? { identifier: { startsWith: input.revokeIdentifierPrefix } }
        : { identifier: input.identifier },
    }),
    prisma.oneTimeToken.create({
      data: {
        identifier: input.identifier,
        token: hashToken(token),
        expires,
      },
    }),
  ]);

  return { token, expires };
}

export async function readOneTimeToken(
  token: string,
): Promise<OneTimeTokenRecord | null> {
  const normalized = String(token ?? "").trim();
  if (!normalized) return null;

  const record = await prisma.oneTimeToken.findUnique({
    where: { token: hashToken(normalized) },
    select: {
      identifier: true,
      expires: true,
    },
  });

  if (!record) return null;

  if (record.expires.getTime() <= Date.now()) {
    await prisma.oneTimeToken.deleteMany({
      where: { token: hashToken(normalized) },
    });
    return null;
  }

  return record;
}

export async function consumeOneTimeToken(
  token: string,
): Promise<OneTimeTokenRecord | null> {
  const normalized = String(token ?? "").trim();
  if (!normalized) return null;

  const tokenHash = hashToken(normalized);

  return prisma.$transaction(async (tx) => {
    const record = await tx.oneTimeToken.findUnique({
      where: { token: tokenHash },
      select: {
        identifier: true,
        expires: true,
      },
    });

    if (!record) return null;

    const deleted = await tx.oneTimeToken.deleteMany({
      where: { token: tokenHash },
    });

    if (deleted.count !== 1 || record.expires.getTime() <= Date.now()) {
      return null;
    }

    return record;
  });
}

export async function revokeOneTimeToken(token: string) {
  const normalized = String(token ?? "").trim();
  if (!normalized) return;

  await prisma.oneTimeToken.deleteMany({
    where: { token: hashToken(normalized) },
  });
}

export async function replaceOneTimeTokenIdentifier(input: {
  token: string;
  currentIdentifier: string;
  nextIdentifier: string;
}) {
  const normalized = String(input.token ?? "").trim();
  if (!normalized) return false;

  const updated = await prisma.oneTimeToken.updateMany({
    where: {
      token: hashToken(normalized),
      identifier: input.currentIdentifier,
      expires: { gt: new Date() },
    },
    data: { identifier: input.nextIdentifier },
  });

  return updated.count === 1;
}
