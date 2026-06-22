import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function generateValidationCode(): string {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

export function hashReportContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export async function createBankReconciliationValidation(input: {
  userId:    string;
  contentHash: string;
  metadata?: Record<string, unknown>;
}) {
  const validationCode = generateValidationCode();

  return prisma.bankReconciliationReportValidation.create({
    data: {
      userId:        input.userId,
      validationCode,
      contentHash:   input.contentHash,
      metadata:      input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}
