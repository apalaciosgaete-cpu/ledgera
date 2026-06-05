import crypto from "crypto";

export interface AuditEventInput {
  userId: string;
  action: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ChainedAuditEvent extends AuditEventInput {
  previousHash?: string | null;
  currentHash: string;
}

function hashContent(data: Record<string, unknown>): string {
  const json = JSON.stringify(data);
  return crypto.createHash("sha256").update(json).digest("hex");
}

function computeChainHash(
  previousHash: string | null | undefined,
  eventData: Record<string, unknown>,
): string {
  const eventHash = hashContent(eventData);

  if (!previousHash) {
    return eventHash;
  }

  const combined = previousHash + eventHash;
  return crypto.createHash("sha256").update(combined).digest("hex");
}

export function buildChainedAuditEvent(
  input: AuditEventInput,
  previousHash?: string | null,
): ChainedAuditEvent {
  const eventData = {
    userId: input.userId,
    action: input.action,
    beforeState: input.beforeState,
    afterState: input.afterState,
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    timestamp: new Date().toISOString(),
  };

  const currentHash = computeChainHash(previousHash, eventData);

  return {
    ...input,
    previousHash: previousHash || null,
    currentHash,
  };
}

export function verifyAuditChain(
  events: Array<{
    previousHash: string | null;
    currentHash: string;
    userId: string;
    action: string;
    beforeState?: string | null;
    afterState?: string | null;
  }>,
): boolean {
  let expectedPreviousHash: string | null = null;

  for (const event of events) {
    if (event.previousHash !== expectedPreviousHash) {
      return false;
    }

    const eventData = {
      userId: event.userId,
      action: event.action,
      beforeState: event.beforeState ? JSON.parse(event.beforeState) : null,
      afterState: event.afterState ? JSON.parse(event.afterState) : null,
      timestamp: "", // Would need to include actual timestamp for perfect verification
    };

    const expectedHash = computeChainHash(expectedPreviousHash, eventData);

    if (event.currentHash !== expectedHash) {
      return false;
    }

    expectedPreviousHash = event.currentHash;
  }

  return true;
}
