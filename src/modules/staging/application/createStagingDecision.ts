import { prisma } from "@/lib/prisma";
import { createStableSha256Hash } from "@/shared/hash";
import { generateDecisionHash } from "./generateDecisionHash";

export type CreateStagingDecisionInput = {
  userId:          string;
  stagingEventId?: string;
  action:          string;
  actorId?:        string;
  actorEmail?:     string;
  beforeStatus?:   string;
  afterStatus?:    string;
  metadata?:       Record<string, unknown>;
};

export type StagingDecisionRecord = {
  id:             string;
  decisionHash:   string;
  validationCode: string;
};

export async function createStagingDecision(
  input: CreateStagingDecisionInput,
): Promise<StagingDecisionRecord> {
  const at = new Date().toISOString();

  const decisionHash = generateDecisionHash({
    userId:    input.userId,
    action:    input.action,
    entityIds: input.stagingEventId ? [input.stagingEventId] : [],
    at,
    metadata:  input.metadata,
  });

  const validationCode = createStableSha256Hash({ decisionHash, userId: input.userId, at });

  const record = await prisma.stagingDecision.create({
    data: {
      userId:         input.userId,
      stagingEventId: input.stagingEventId,
      action:         input.action,
      actorId:        input.actorId,
      actorEmail:     input.actorEmail,
      beforeStatus:   input.beforeStatus,
      afterStatus:    input.afterStatus,
      decisionHash,
      validationCode,
      metadata:       input.metadata ? JSON.stringify(input.metadata) : null,
    },
    select: { id: true, decisionHash: true, validationCode: true },
  });

  return record as StagingDecisionRecord;
}
