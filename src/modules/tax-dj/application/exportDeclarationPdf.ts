import { PDFDocument, rgb } from "pdf-lib";

type DeclarationPayload = {
  summary?: {
    totalEvents?: number;
    totalSymbols?: number;
    totalProceedsUsd?: number;
    totalProceedsClp?: number;
    totalCostBasisUsd?: number;
    totalCostBasisClp?: number;
    totalFeesUsd?: number;
    totalFeesClp?: number;
    totalRealizedPnlUsd?: number;
    totalRealizedPnlClp?: number;
    pendingClassificationEvents?: number;
  };
  bySymbol?: Array<{
    symbol: string;
    events: number;
    quantity: number;
    proceedsUsd: number;
    proceedsClp: number;
    costBasisUsd: number;
    costBasisClp: number;
    feesUsd: number;
    feesClp: number;
    realizedPnlUsd: number;
    realizedPnlClp: number;
  }>;
  events?: Array<{
    taxEventId: string;
    movementId: string;
    eventType: string;
    symbol: string;
    executedAt: string;
    quantity: number;
    effectiveTaxCategory: string;
    proceedsNetUsd: number;
    proceedsNetClp: number;
    costBasisUsd: number;
    costBasisClp: number;
    feeUsd: number;
    feeClp: number;
    realizedPnlUsd: number;
    realizedPnlClp: number;
    usdClp: number;
  }>;
};

export type ExportDeclarationPdfInput = {
  id: string;
  taxYear: number;
  declarationType: string;
  status: string;
  contentHash: string;
  generatedAt: Date | string;
  confirmedAt: Date | string | null;
  payloadJson: string;
};

function parsePayload(value: string): DeclarationPayload {
  try {
    const parsed = JSON.parse(value) as DeclarationPayload;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function safeIsoDate(value: Date | string | null | undefined) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 2,
  }).format(value);
}

export async function buildDeclarationPdf(
  input: ExportDeclarationPdfInput,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const { height } = page.getSize();

  const payload = parsePayload(input.payloadJson);
  let y = height - 40;

  const fontSize = 12;
  const titleSize = 18;
  const sectionSize = 14;

  page.drawText("DECLARACIÓN DE INGRESOS - LEDGERA", {
    x: 40,
    y,
    size: titleSize,
    color: rgb(0, 0, 0),
  });

  y -= 30;

  const infoFields = [
    `ID: ${input.id}`,
    `Año Tributario: ${input.taxYear}`,
    `Tipo: ${input.declarationType}`,
    `Estado: ${input.status}`,
    `Hash: ${input.contentHash}`,
    `Generado: ${safeIsoDate(input.generatedAt)}`,
    `Confirmado: ${safeIsoDate(input.confirmedAt) || "No confirmado"}`,
  ];

  for (const field of infoFields) {
    page.drawText(field, {
      x: 40,
      y,
      size: fontSize,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 15;
  }

  y -= 15;

  page.drawText("RESUMEN", {
    x: 40,
    y,
    size: sectionSize,
    color: rgb(0, 0, 0),
  });

  y -= 20;

  const summary = payload.summary;
  const summaryData = [
    `Total eventos: ${summary?.totalEvents ?? 0}`,
    `Total activos: ${summary?.totalSymbols ?? 0}`,
    `Ingresos USD: ${(summary?.totalProceedsUsd ?? 0).toFixed(2)}`,
    `Ingresos CLP: ${(summary?.totalProceedsClp ?? 0).toFixed(2)}`,
    `Costo USD: ${(summary?.totalCostBasisUsd ?? 0).toFixed(2)}`,
    `Costo CLP: ${(summary?.totalCostBasisClp ?? 0).toFixed(2)}`,
    `Resultado USD: ${(summary?.totalRealizedPnlUsd ?? 0).toFixed(2)}`,
    `Resultado CLP: ${(summary?.totalRealizedPnlClp ?? 0).toFixed(2)}`,
  ];

  for (const data of summaryData) {
    page.drawText(data, {
      x: 60,
      y,
      size: fontSize - 1,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 12;

    if (y < 50) {
      const newPage = doc.addPage([595, 842]);
      page.drawPage(newPage);
      y = 842 - 40;
    }
  }

  const pdfBytes = await doc.save();
  return pdfBytes;
}

export function buildDeclarationPdfFilename(input: {
  taxYear: number;
  declarationType: string;
  id: string;
}) {
  return `ledgera-ddjj-${input.taxYear}-${input.declarationType.toLowerCase()}-${input.id.slice(
    0,
    8,
  )}.pdf`;
}
