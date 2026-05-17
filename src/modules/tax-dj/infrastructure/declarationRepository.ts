import { prisma } from "@/lib/prisma";
import type {
  TaxDeclarationDraft,
  TaxDeclarationStatus,
  TaxDeclarationType,
} from "@/modules/tax-dj/domain/declaration";

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
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (error) {
    console.error("[tax-dj/audit] No fue posible registrar auditoría.", error);
    return null;
  }
}