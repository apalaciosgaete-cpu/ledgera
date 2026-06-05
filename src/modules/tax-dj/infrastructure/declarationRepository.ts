import { prisma } from "@/lib/prisma";
import type {
  TaxDeclarationDraft,
  TaxDeclarationStatus,
  TaxDeclarationType,
} from "@/modules/tax-dj/domain/declaration";
import { buildChainedAuditEvent } from "@/modules/tax/application/auditChainService";

export async function createTaxDeclarationDraft(draft: TaxDeclarationDraft) {
  return prisma.taxDeclaration.create({
    data: {
      userId: draft.userId,
      taxYear: draft.taxYear,
      declarationType: draft.declarationType,
      status: draft.status,
      source: draft.source,
      payloadJson: JSON.stringify(draft.payloadJson),
      contentHash: draft.contentHash,
      generatedAt: new Date(draft.generatedAt),
      confirmedAt: draft.confirmedAt ? new Date(draft.confirmedAt) : null,
    },
  });
}

export async function findActiveDeclarationByHash(input: {
  userId: string;
  taxYear: number;
  declarationType: TaxDeclarationType;
  contentHash: string;
}) {
  return prisma.taxDeclaration.findFirst({
    where: {
      userId: input.userId,
      taxYear: input.taxYear,
      declarationType: input.declarationType,
      contentHash: input.contentHash,
      status: {
        not: "VOIDED",
      },
    },
    orderBy: {
      generatedAt: "desc",
    },
  });
}

export async function listTaxDeclarationsByUser(input: {
  userId: string;
  taxYear?: number;
}) {
  return prisma.taxDeclaration.findMany({
    where: {
      userId: input.userId,
      ...(input.taxYear ? { taxYear: input.taxYear } : {}),
    },
    orderBy: {
      generatedAt: "desc",
    },
  });
}

export async function getTaxDeclarationByIdForUser(input: {
  id: string;
  userId: string;
}) {
  return prisma.taxDeclaration.findFirst({
    where: {
      id: input.id,
      userId: input.userId,
    },
  });
}

export async function updateTaxDeclarationStatus(input: {
  id: string;
  userId: string;
  status: TaxDeclarationStatus;
}) {
  return prisma.taxDeclaration.updateMany({
    where: {
      id: input.id,
      userId: input.userId,
    },
    data: {
      status: input.status,
      confirmedAt: input.status === "CONFIRMED" ? new Date() : undefined,
      voidedAt: input.status === "VOIDED" ? new Date() : undefined,
    },
  });
}

export type TaxDeclarationAuditAction =
  | "DECLARATION_CREATED"
  | "DECLARATION_REVIEWED"
  | "DECLARATION_CONFIRMED"
  | "DECLARATION_VOIDED"
  | "DECLARATION_EXPORTED"
  | "DECLARATION_INTEGRITY_VERIFIED";

export type CreateTaxDeclarationAuditLogInput = {
  userId: string;
  declarationId: string;
  action: TaxDeclarationAuditAction;
  actorId?: string | null;
  actorEmail?: string | null;
  taxYear: number;
  declarationType: string;
  statusFrom?: string | null;
  statusTo?: string | null;
  contentHash?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function createTaxDeclarationAuditLog(
  input: CreateTaxDeclarationAuditLogInput,
) {
  try {
    const previousLog = await prisma.taxDeclarationAuditLog.findFirst({
      where: {
        userId: input.userId,
        declarationId: input.declarationId,
      },
      orderBy: { createdAt: "desc" },
      select: { currentHash: true },
    });
    const metadata = {
      ...(input.metadata ?? {}),
      contentHash: input.contentHash ?? null,
    };
    const beforeState = input.statusFrom
      ? { status: input.statusFrom }
      : null;
    const afterState = input.statusTo
      ? { status: input.statusTo }
      : null;
    const chainedEvent = buildChainedAuditEvent(
      {
        userId: input.userId,
        action: input.action,
        beforeState,
        afterState,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata,
      },
      previousLog?.currentHash ?? null,
    );

    return await prisma.taxDeclarationAuditLog.create({
      data: {
        userId: input.userId,
        declarationId: input.declarationId,
        action: input.action,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        taxYear: input.taxYear,
        declarationType: input.declarationType,
        statusFrom: input.statusFrom ?? null,
        statusTo: input.statusTo ?? null,
        contentHash: input.contentHash ?? null,
        beforeState: beforeState ? JSON.stringify(beforeState) : null,
        afterState: afterState ? JSON.stringify(afterState) : null,
        previousHash: chainedEvent.previousHash,
        currentHash: chainedEvent.currentHash,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: JSON.stringify(metadata),
      },
    });
  } catch (error) {
    console.error("[tax-dj/audit] No fue posible registrar auditoría.", error);
    return null;
  }
}

export async function listTaxDeclarationAuditLogs(input: {
  userId: string;
  taxYear?: number;
  declarationId?: string;
  action?: TaxDeclarationAuditAction;
  limit?: number;
}) {
  return prisma.taxDeclarationAuditLog.findMany({
    where: {
      userId: input.userId,
      ...(input.taxYear ? { taxYear: input.taxYear } : {}),
      ...(input.declarationId ? { declarationId: input.declarationId } : {}),
      ...(input.action ? { action: input.action } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: input.limit ?? 100,
  });
}
