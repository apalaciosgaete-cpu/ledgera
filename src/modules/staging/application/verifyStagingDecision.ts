import { prisma } from "@/lib/prisma";
import { createStableSha256Hash } from "@/shared/hash";
import { StagingError } from "../domain/StagingError";

export type StagingDecisionVerification = {
  validationCode: string;
  action:         string;
  actorEmail:     string | null;
  beforeStatus:   string | null;
  afterStatus:    string | null;
  decisionHash:   string;
  hashValid:      boolean;
  createdAt:      string;
  metadata:       Record<string, unknown>;
};

function parseMeta(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
}

export async function verifyStagingDecision(
  validationCode: string,
): Promise<StagingDecisionVerification> {
  const decision = await prisma.stagingDecision.findUnique({
    where: { validationCode },
  });

  if (!decision) throw new StagingError("NOT_FOUND");

  const meta = parseMeta(decision.metadata);

  const recomputedHash = createStableSha256Hash({
    userId:        decision.userId,
    action:        decision.action,
    stagingEventId: decision.stagingEventId,
    beforeStatus:  decision.beforeStatus,
    afterStatus:   decision.afterStatus,
    actorId:       decision.actorId,
    metadata:      meta,
    createdAt:     decision.createdAt.toISOString(),
  });

  return {
    validationCode: decision.validationCode!,
    action:         decision.action,
    actorEmail:     decision.actorEmail,
    beforeStatus:   decision.beforeStatus,
    afterStatus:    decision.afterStatus,
    decisionHash:   decision.decisionHash,
    hashValid:      recomputedHash === decision.decisionHash,
    createdAt:      decision.createdAt.toISOString(),
    metadata:       meta,
  };
}
