import crypto from "crypto";
import { prisma } from "@/lib/prisma";

type Input = {
  userId:   string;
  payload:  unknown;
  metadata?: Record<string, unknown>;
};

export type BankReportValidation = {
  validationCode: string;
  contentHash:    string;
  createdAt:      Date;
};

export async function createBankReportValidation(input: Input): Promise<BankReportValidation> {
  const issuedAt = new Date();

  const contentHash = crypto
    .createHash("sha256")
    .update(JSON.stringify({
      type:     "BANK_RECONCILIATION",
      issuedAt: issuedAt.toISOString(),
      payload:  input.payload,
    }))
    .digest("hex");

  const validationCode = crypto.randomBytes(4).toString("hex").toUpperCase();

  const record = await prisma.bankReconciliationReportValidation.create({
    data: {
      userId:        input.userId,
      validationCode,
      contentHash,
      reportType:    "BANK_RECONCILIATION",
      metadata:      input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt:     issuedAt,
    },
  });

  return {
    validationCode: record.validationCode,
    contentHash:    record.contentHash,
    createdAt:      record.createdAt,
  };
}
