import { prisma } from "@/lib/prisma";
import {
  buildChainedAuditEvent,
  type AuditEventInput,
} from "@/modules/tax/application/auditChainService";

// ────── TaxClassification Audit ──────────────────────────────────────────────

export type TaxClassificationAuditAction =
  | "TAX_CLASSIFICATION_CREATED"
  | "TAX_CLASSIFICATION_UPDATED"
  | "TAX_CLASSIFICATION_APPROVED"
  | "TAX_CLASSIFICATION_REJECTED";

export async function createTaxClassificationAuditLog(
  input: Omit<AuditEventInput, "action"> & {
    action: TaxClassificationAuditAction;
    movementId: string;
  },
) {
  const previousLog = await prisma.taxClassificationAuditLog.findFirst({
    where: { userId: input.userId },
    orderBy: { createdAt: "desc" },
  });

  const chainedEvent = buildChainedAuditEvent(input, previousLog?.currentHash);

  try {
    return await prisma.taxClassificationAuditLog.create({
      data: {
        userId: input.userId,
        movementId: input.movementId,
        action: input.action,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        beforeState: input.beforeState
          ? JSON.stringify(input.beforeState)
          : null,
        afterState: input.afterState ? JSON.stringify(input.afterState) : null,
        previousHash: chainedEvent.previousHash,
        currentHash: chainedEvent.currentHash,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (error) {
    console.error("[audit] Failed to create TaxClassificationAuditLog", error);
    return null;
  }
}

// ────── TaxEvent Audit ──────────────────────────────────────────────────────

export type TaxEventAuditAction =
  | "TAX_EVENT_GENERATED"
  | "TAX_EVENT_REBUILT"
  | "TAX_EVENT_CORRECTED";

export async function createTaxEventAuditLog(
  input: Omit<AuditEventInput, "action"> & {
    action: TaxEventAuditAction;
    taxEventId: string;
    taxYear: number;
  },
) {
  const previousLog = await prisma.taxEventAuditLog.findFirst({
    where: { userId: input.userId, taxYear: input.taxYear },
    orderBy: { createdAt: "desc" },
  });

  const chainedEvent = buildChainedAuditEvent(input, previousLog?.currentHash);

  try {
    return await prisma.taxEventAuditLog.create({
      data: {
        userId: input.userId,
        taxEventId: input.taxEventId,
        action: input.action,
        taxYear: input.taxYear,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        beforeState: input.beforeState
          ? JSON.stringify(input.beforeState)
          : null,
        afterState: input.afterState ? JSON.stringify(input.afterState) : null,
        previousHash: chainedEvent.previousHash,
        currentHash: chainedEvent.currentHash,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (error) {
    console.error("[audit] Failed to create TaxEventAuditLog", error);
    return null;
  }
}

// ────── Movement Audit ──────────────────────────────────────────────────────

export type MovementAuditAction =
  | "MOVEMENT_CREATED"
  | "MOVEMENT_UPDATED"
  | "MOVEMENT_DELETED";

export async function createMovementAuditLog(
  input: Omit<AuditEventInput, "action"> & {
    action: MovementAuditAction;
    movementId: string;
  },
) {
  const previousLog = await prisma.movementAuditLog.findFirst({
    where: { userId: input.userId },
    orderBy: { createdAt: "desc" },
  });

  const chainedEvent = buildChainedAuditEvent(input, previousLog?.currentHash);

  try {
    return await prisma.movementAuditLog.create({
      data: {
        userId: input.userId,
        movementId: input.movementId,
        action: input.action,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        beforeState: input.beforeState
          ? JSON.stringify(input.beforeState)
          : null,
        afterState: input.afterState ? JSON.stringify(input.afterState) : null,
        previousHash: chainedEvent.previousHash,
        currentHash: chainedEvent.currentHash,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (error) {
    console.error("[audit] Failed to create MovementAuditLog", error);
    return null;
  }
}

// ────── List Audit Logs ─────────────────────────────────────────────────────

export async function listAuditLogs(input: {
  userId: string;
  action?: string;
  limit?: number;
}) {
  const limit = input.limit || 100;

  const [taxDeclarationLogs, taxClassificationLogs, taxEventLogs, movementLogs] =
    await Promise.all([
      prisma.taxDeclarationAuditLog.findMany({
        where: { userId: input.userId, action: input.action },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.taxClassificationAuditLog.findMany({
        where: { userId: input.userId, action: input.action },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.taxEventAuditLog.findMany({
        where: { userId: input.userId, action: input.action },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.movementAuditLog.findMany({
        where: { userId: input.userId, action: input.action },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

  const allLogs = [
    ...taxDeclarationLogs.map((log) => ({
      ...log,
      logType: "DECLARATION" as const,
    })),
    ...taxClassificationLogs.map((log) => ({
      ...log,
      logType: "CLASSIFICATION" as const,
    })),
    ...taxEventLogs.map((log) => ({
      ...log,
      logType: "TAX_EVENT" as const,
    })),
    ...movementLogs.map((log) => ({
      ...log,
      logType: "MOVEMENT" as const,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return allLogs.slice(0, limit);
}
