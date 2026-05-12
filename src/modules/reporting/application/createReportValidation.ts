// src/modules/reporting/application/createReportValidation.ts
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

type CreateReportValidationInput = {
  reportType:
    | "STRICT_TAX_REPORT"
    | "INFORMATIVE_TAX_REPORT"
    | "STRICT_TAX_CSV"
    | "INFORMATIVE_TAX_CSV";
  periodYear?: number | null;
  symbol?:     string | null;
  payload:     unknown;
};

export async function createReportValidation(input: CreateReportValidationInput) {
  const issuedAt = new Date();

  const hash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        type:      input.reportType,
        year:      input.periodYear ?? null,
        symbol:    input.symbol ?? null,
        issuedAt:  issuedAt.toISOString(),
        payload:   input.payload,
      })
    )
    .digest("hex");

  const reportValidation = await prisma.reportValidation.create({
    data: {
      type:     input.reportType,
      hash,
      year:     input.periodYear ?? 0,
      symbol:   input.symbol?.trim().toUpperCase() || null,
      issuedAt,
    },
  });

  return reportValidation;
}