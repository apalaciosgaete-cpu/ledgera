import { createHash } from "node:crypto";
import * as XLSX from "xlsx";

import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/modules/security/application/encryption";
import { parseBinanceFile } from "@/modules/integrations/binance/application/parseBinanceFile";
import { normalizeBinanceFileRow } from "@/modules/integrations/binance/application/normalizeBinanceFileRow";
import { upsertImportRecord } from "@/modules/integrations/binance/infrastructure/exchangeImportRepository";
import { findConnectionByUser } from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";

type KindHint = "DEPOSIT" | "WITHDRAWAL";

type UploadedBlob = Blob & {
  name?: string;
};

export type DocumentIntakeInput = {
  userId:        string;
  file:          UploadedBlob;
  sourceHint?:   string;
  providerHint?: string;
  documentKind?: string;
  kindHint?:     KindHint;
};

export type DocumentIntakeResult = {
  documentId:       string;
  fileName:         string;
  checksum:         string;
  providerDetected: string | null;
  documentKind:     string;
  status:           "UPLOADED" | "STAGED" | "DUPLICATE";
  stagingTarget:    "EXCHANGE" | "BANK" | "DOCUMENT";
  imported:         number;
  skipped:          number;
  pendingReview:    number;
  format:           string;
  errors:           string[];
  redirectTo:       string | null;
};

const SPREADSHEET_MIME_HINTS = ["spreadsheet", "excel"];

function safeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 140) || "document";
}

function getFileName(file: UploadedBlob): string {
  return typeof file.name === "string" && file.name.trim() ? file.name.trim() : "document";
}

function getMimeType(file: UploadedBlob): string {
  return typeof file.type === "string" && file.type.trim() ? file.type.trim() : "application/octet-stream";
}

function isSpreadsheet(fileName: string, mimeType: string): boolean {
  const name = fileName.toLowerCase();
  const type = mimeType.toLowerCase();

  return (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    SPREADSHEET_MIME_HINTS.some((hint) => type.includes(hint))
  );
}

function isTextCsv(fileName: string, mimeType: string): boolean {
  const name = fileName.toLowerCase();
  const type = mimeType.toLowerCase();

  return name.endsWith(".csv") || type.includes("csv") || type === "text/plain";
}

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function firstSheetAsCsv(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("El archivo Excel no contiene hojas.");
  }

  const sheet = workbook.Sheets[firstSheetName];

  if (!sheet) {
    throw new Error("No fue posible leer la primera hoja del archivo Excel.");
  }

  return XLSX.utils.sheet_to_csv(sheet, { FS: ",", RS: "\n" });
}

function inferDocumentKind(input: {
  documentKind?: string;
  providerDetected: string | null;
  fileName: string;
  mimeType: string;
}): string {
  if (input.providerDetected === "BINANCE") return "EXCHANGE_HISTORY";
  if (input.documentKind?.trim()) return input.documentKind.trim().toUpperCase();
  if (isSpreadsheet(input.fileName, input.mimeType)) return "SPREADSHEET";
  if (input.mimeType.toLowerCase().includes("pdf") || input.fileName.toLowerCase().endsWith(".pdf")) return "PDF";
  return "DOCUMENT";
}

async function getOrCreateBinanceConnection(userId: string): Promise<string> {
  const existing = await findConnectionByUser(userId, "BINANCE");
  if (existing) return existing.id;

  const placeholder = await prisma.exchangeConnection.create({
    data: {
      userId,
      exchange:           "BINANCE",
      apiKeyEncrypted:    encryptSecret("DOCUMENT_INTAKE"),
      apiSecretEncrypted: encryptSecret("DOCUMENT_INTAKE"),
      status:             "FILE_ONLY",
      permissions:        "[]",
    },
  });

  return placeholder.id;
}

async function persistDocument(input: {
  userId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  sourceHint: string;
  providerDetected: string | null;
  documentKind: string;
  storageKey: string;
  status: string;
}) {
  const existing = input.checksum
    ? await prisma.document.findFirst({
        where: { userId: input.userId, checksum: input.checksum },
      })
    : null;

  if (existing) return { document: existing, duplicate: true };

  const document = await prisma.document.create({
    data: {
      userId:      input.userId,
      category:    input.sourceHint,
      type:        input.documentKind,
      status:      input.status,
      name:        input.fileName,
      fileName:    input.fileName,
      mimeType:    input.mimeType,
      fileSize:    input.fileSize,
      storageKey:  input.storageKey,
      checksum:    input.checksum,
      uploadedBy:  input.userId,
      tags: {
        sourceHint:       input.sourceHint,
        providerDetected: input.providerDetected,
        documentKind:     input.documentKind,
      },
    },
  });

  return { document, duplicate: false };
}

export async function processDocumentIntake(input: DocumentIntakeInput): Promise<DocumentIntakeResult> {
  const fileName = getFileName(input.file);
  const mimeType = getMimeType(input.file);
  const sourceHint = input.sourceHint?.trim().toUpperCase() || "DOCUMENTACION";
  const providerHint = input.providerHint?.trim().toUpperCase() || null;
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const checksum = sha256(buffer);
  const storageKey = `intake://${checksum}/${safeFileName(fileName)}`;

  let csvText: string | null = null;
  let format = "DOCUMENT";
  const errors: string[] = [];
  let providerDetected: string | null = providerHint;
  let imported = 0;
  let skipped = 0;

  try {
    if (isSpreadsheet(fileName, mimeType)) {
      csvText = firstSheetAsCsv(buffer);
    } else if (isTextCsv(fileName, mimeType)) {
      csvText = buffer.toString("utf8");
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "No fue posible leer el archivo.");
  }

  if (csvText?.trim()) {
    const parsed = parseBinanceFile(csvText, { kindHint: input.kindHint });
    format = parsed.format;

    const shouldTreatAsBinance =
      providerHint === "BINANCE" ||
      parsed.rows.length > 0 ||
      parsed.format !== "UNKNOWN";

    if (shouldTreatAsBinance) {
      providerDetected = "BINANCE";
      errors.push(...parsed.errors);

      if (parsed.rows.length > 0) {
        const connectionId = await getOrCreateBinanceConnection(input.userId);

        for (const row of parsed.rows) {
          try {
            const normalized = await normalizeBinanceFileRow(row);
            const { isNew } = await upsertImportRecord(
              input.userId,
              connectionId,
              "BINANCE",
              normalized,
              JSON.stringify(row),
            );

            if (isNew) imported += 1;
            else skipped += 1;
          } catch (error) {
            errors.push(error instanceof Error ? error.message : String(error));
          }
        }
      }
    }
  }

  const documentKind = inferDocumentKind({ documentKind: input.documentKind, providerDetected, fileName, mimeType });
  const hasExchangeStaging = providerDetected === "BINANCE" && (imported > 0 || skipped > 0);
  const documentStatus = hasExchangeStaging ? "STAGED" : errors.length > 0 ? "REVIEW" : "UPLOADED";

  const { document, duplicate } = await persistDocument({
    userId: input.userId,
    fileName,
    mimeType,
    fileSize: input.file.size,
    checksum,
    sourceHint,
    providerDetected,
    documentKind,
    storageKey,
    status: documentStatus,
  });

  return {
    documentId:       document.id,
    fileName,
    checksum,
    providerDetected,
    documentKind,
    status:           duplicate ? "DUPLICATE" : hasExchangeStaging ? "STAGED" : "UPLOADED",
    stagingTarget:    hasExchangeStaging ? "EXCHANGE" : "DOCUMENT",
    imported,
    skipped,
    pendingReview:    imported + skipped,
    format,
    errors,
    redirectTo:       hasExchangeStaging ? "/importaciones?source=EXCHANGE" : null,
  };
}
