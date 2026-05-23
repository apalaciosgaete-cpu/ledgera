import { prisma } from "@/lib/prisma";
import type { ParsedBankMovement } from "../domain/bankTypes";
import crypto from "crypto";

export interface ImportResult {
  uploadId:     string;
  totalRows:    number;
  importedRows: number;
  skippedRows:  number;
  needsReview:  boolean;
}

export async function importBankMovements(
  userId:      string,
  bankName:    string,
  fileName:    string,
  fileHash:    string,
  fileBuffer:  Buffer,
  rows:        ParsedBankMovement[],
  needsReview: boolean,
): Promise<ImportResult> {
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
      needsReview,
    };
  }

  const ext      = fileName.split(".").pop()?.toUpperCase() ?? "CSV";
  const fileType = ["CSV", "XLSX", "XLS", "PDF"].includes(ext) ? ext.replace("XLS", "XLSX") : "CSV";

  const upload = await prisma.bankFileUpload.create({
    data: {
      userId,
      bankName:     bankName || null,
      fileName,
      fileType,
      fileHash,
      status:       needsReview ? "REVIEW" : "IMPORTED",
      totalRows:    rows.length,
      importedRows: 0,
      errorRows:    0,
    },
  });

  let importedRows = 0;
  let skippedRows  = 0;

  for (const row of rows) {
    const externalId = [
      bankName,
      row.occurredAt.toISOString().slice(0, 10),
      row.description.slice(0, 40).replace(/\s+/g, " "),
      row.amountClp,
      row.direction,
    ].join(":");

    const dup = await prisma.bankMovement.findFirst({ where: { userId, externalId } });

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
        status:      "IMPORTED",
      },
    });

    importedRows++;
  }

  await prisma.bankFileUpload.update({
    where: { id: upload.id },
    data:  { importedRows, status: needsReview ? "REVIEW" : importedRows > 0 ? "IMPORTED" : "PARTIAL" },
  });

  return { uploadId: upload.id, totalRows: rows.length, importedRows, skippedRows, needsReview };
}
