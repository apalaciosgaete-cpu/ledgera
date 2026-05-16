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