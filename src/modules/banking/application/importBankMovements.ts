import { prisma } from "@/lib/prisma";
import type { ParsedBankMovement } from "../domain/bankTypes";

export interface ImportResult {
  uploadId:     string;
  duplicate:    boolean;
  totalRows:    number;
  importedRows: number;
  errorRows:    number;
}

export async function importBankMovements(
  userId:      string,
  bankName:    string,
  fileName:    string,
  fileHash:    string,
  rows:        ParsedBankMovement[],
  errorRows:   number,
): Promise<ImportResult> {
  // Deduplicar por hash de archivo completo
  const existing = await prisma.bankFileUpload.findFirst({
    where: { userId, fileHash },
  });
  if (existing) {
    return {
      uploadId:     existing.id,
      duplicate:    true,
      totalRows:    existing.totalRows,
      importedRows: existing.importedRows,
      errorRows:    existing.errorRows,
    };
  }

  const ext      = fileName.split(".").pop()?.toUpperCase() ?? "CSV";
  const fileType = ["CSV", "XLSX", "XLS", "PDF"].includes(ext)
    ? (ext === "XLS" ? "XLSX" : ext)
    : "CSV";

  const upload = await prisma.bankFileUpload.create({
    data: {
      userId,
      bankName:     bankName || null,
      fileName,
      fileType,
      fileHash,
      status:       "IMPORTED",
      totalRows:    rows.length + errorRows,
      importedRows: 0,
      errorRows,
    },
  });

  let importedRows = 0;

  for (const row of rows) {
    const externalId = [
      bankName,
      row.occurredAt.toISOString().slice(0, 10),
      row.description.slice(0, 40).replace(/\s+/g, " "),
      row.amountClp,
      row.direction,
    ].join(":");

    const dup = await prisma.bankMovement.findFirst({ where: { userId, externalId } });
    if (dup) continue;

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
    data:  { importedRows, status: importedRows > 0 ? "IMPORTED" : "PARTIAL" },
  });

  return {
    uploadId:     upload.id,
    duplicate:    false,
    totalRows:    rows.length + errorRows,
    importedRows,
    errorRows,
  };
}
