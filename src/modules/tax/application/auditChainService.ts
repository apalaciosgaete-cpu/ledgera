import { createStableSha256Hash } from "@/shared/hash";

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

function normalizeNullable(value: unknown): unknown {
  return value === undefined ? null : value;
}

function computeChainHash(
  previousHash: string | null | undefined,
  eventData: Record<string, unknown>,
): string {
  return createStableSha256Hash({
    algorithm: "LEDGERA_AUDIT_CHAIN_V1",
    previousHash: previousHash ?? null,
    eventHash: createStableSha256Hash(eventData),
  });
}

function parseJsonOrNull(value: string | null | undefined): unknown {
  if (!value) {
    return null;
  }

  return JSON.parse(value);
}

export function buildChainedAuditEvent(
  input: AuditEventInput,
  previousHash?: string | null,
): ChainedAuditEvent {
  const eventData = {
    userId: input.userId,
    action: input.action,
    beforeState: normalizeNullable(input.beforeState),
    afterState: normalizeNullable(input.afterState),
    actorId: input.actorId ?? null,
    actorEmail: input.actorEmail ?? null,
    metadata: normalizeNullable(input.metadata),
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
    actorId?: string | null;
    actorEmail?: string | null;
    beforeState?: string | null;
    afterState?: string | null;
    metadata?: string | null;
  }>,
): boolean {
  let expectedPreviousHash: string | null = null;

  for (const event of events) {
    if (event.previousHash !== expectedPreviousHash) {
      return false;
    }

    let eventData: Record<string, unknown>;

    try {
      eventData = {
        userId: event.userId,
        action: event.action,
        beforeState: parseJsonOrNull(event.beforeState),
        afterState: parseJsonOrNull(event.afterState),
        actorId: event.actorId ?? null,
        actorEmail: event.actorEmail ?? null,
        metadata: parseJsonOrNull(event.metadata),
      };
    } catch {
      return false;
    }

    const expectedHash = computeChainHash(expectedPreviousHash, eventData);

    if (event.currentHash !== expectedHash) {
      return false;
    }

    expectedPreviousHash = event.currentHash;
  }

  return true;
}
