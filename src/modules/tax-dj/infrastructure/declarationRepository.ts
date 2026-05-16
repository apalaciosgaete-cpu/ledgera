import { prisma } from "@/lib/prisma";

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