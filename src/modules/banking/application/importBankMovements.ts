import { prisma } from "@/lib/prisma";
import type { ParsedBankMovement, BankFileType } from "../domain/bankTypes";
import crypto from "crypto";

export interface ImportResult {
  uploadId:    string;
  totalRows:   number;
  importedRows: number;
  skippedRows:  number;
  errorRows:    number;
  needsReview:  boolean;
}

export async function importBankMovements(
  userId:      string,
  bankName:    string,
  fileName:    string,
  fileType:    BankFileType,
  fileBuffer:  Buffer,
  rows:        ParsedBankMovement[],
  parseErrors: string[],
  needsReview: boolean,
): Promise<ImportResult> {
  const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  // Deduplicar por hash de archivo completo
  const existing = await prisma.bankFileUpload.findFirst({
    where: { userId, fileHash },
  });
  if (existing) {
    return {
      uploadId:     existing.id,
      totalRows:    existing.totalRows,
      importedRows: existing.importedRows,
      skippedRows:  0,
      errorRows:    existing.errorRows,
      needsReview,
    };
  }

  const totalRows = rows.length + parseErrors.length;
  let importedRows = 0;
  let skippedRows  = 0;

  const upload = await prisma.bankFileUpload.create({
    data: {
      userId,
      bankName:    bankName || null,
      fileName,
      fileType,
      fileHash,
      status:      needsReview ? "REVIEW" : "IMPORTED",
      totalRows,
      importedRows: 0,
      errorRows:    parseErrors.length,
      rawJson:      parseErrors.length > 0 ? JSON.stringify(parseErrors.slice(0, 20)) : null,
    },
  });

  for (const row of rows) {
    const externalId = `${bankName}:${row.occurredAt.toISOString().slice(0, 10)}:${row.description.slice(0, 40).replace(/\s+/g, " ")}:${row.amountClp}`;

    const dup = await prisma.bankMovement.findFirst({
      where: { userId, externalId },
    });

    if (dup) { skippedRows++; continue; }

    await prisma.bankMovement.create({
      data: {
        userId,
        uploadId:    upload.id,
        bankName:    bankName || null,
        externalId,
        occurredAt:  row.occurredAt,
        description: row.description,
        amountClp:   row.amountClp,
        direction:   row.direction,
        balanceClp:  row.balanceClp ?? null,
        rawJson:     JSON.stringify(row.raw),
        status:      needsReview ? "IMPORTED" : "IMPORTED",
      },
    });

    importedRows++;
  }

  await prisma.bankFileUpload.update({
    where: { id: upload.id },
    data:  { importedRows, status: needsReview ? "REVIEW" : importedRows > 0 ? "IMPORTED" : "PARTIAL" },
  });

  return { uploadId: upload.id, totalRows, importedRows, skippedRows, errorRows: parseErrors.length, needsReview };
}
