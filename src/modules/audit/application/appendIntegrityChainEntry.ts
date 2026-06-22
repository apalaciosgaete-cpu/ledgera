import { prisma } from "@/lib/prisma";
import { createStableSha256Hash } from "@/shared/hash";

export type IntegrityChainInput = {
  userId:     string;
  entityType: string;
  entityId:   string;
  action:     string;
  payload:    Record<string, unknown>;
};

export async function appendIntegrityChainEntry(input: IntegrityChainInput): Promise<string> {
  const { userId, entityType, entityId, action, payload } = input;

  const last = await prisma.integrityChainEntry.findFirst({
    where:   { userId, entityType, entityId },
    orderBy: { sequence: "desc" },
    select:  { sequence: true, currentHash: true },
  });

  const sequence     = (last?.sequence ?? 0) + 1;
  const previousHash = last?.currentHash ?? null;
  const payloadHash  = createStableSha256Hash(payload);
  const currentHash  = createStableSha256Hash({
    userId, entityType, entityId, action, sequence, previousHash, payloadHash,
  });

  await prisma.integrityChainEntry.create({
    data: { userId, entityType, entityId, action, sequence, previousHash, currentHash, payloadHash },
  });

  return currentHash;
}
