import PDFDocument from "pdfkit";

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

export function buildDeclarationPdf(
  input: ExportDeclarationPdfInput,
): Buffer {
  const doc = new PDFDocument();
  const payload = parsePayload(input.payloadJson);
  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => chunks.push(chunk));

  doc.fontSize(18).text("DECLARACIÓN DE INGRESOS - LEDGERA", 50, 40);

  doc.fontSize(12).moveDown(1);
  doc.text(`ID: ${input.id}`);
  doc.text(`Año Tributario: ${input.taxYear}`);
  doc.text(`Tipo: ${input.declarationType}`);
  doc.text(`Estado: ${input.status}`);
  doc.text(`Hash: ${input.contentHash}`);
  doc.text(`Generado: ${safeIsoDate(input.generatedAt)}`);
  doc.text(`Confirmado: ${safeIsoDate(input.confirmedAt) || "No confirmado"}`);

  doc.moveDown(1).fontSize(14).text("RESUMEN", { underline: true });

  const summary = payload.summary;
  doc.fontSize(11).moveDown(0.5);
  doc.text(`Total eventos: ${summary?.totalEvents ?? 0}`);
  doc.text(`Total activos: ${summary?.totalSymbols ?? 0}`);
  doc.text(`Ingresos USD: ${(summary?.totalProceedsUsd ?? 0).toFixed(2)}`);
  doc.text(`Ingresos CLP: ${(summary?.totalProceedsClp ?? 0).toFixed(2)}`);
  doc.text(`Costo USD: ${(summary?.totalCostBasisUsd ?? 0).toFixed(2)}`);
  doc.text(`Costo CLP: ${(summary?.totalCostBasisClp ?? 0).toFixed(2)}`);
  doc.text(`Resultado USD: ${(summary?.totalRealizedPnlUsd ?? 0).toFixed(2)}`);
  doc.text(`Resultado CLP: ${(summary?.totalRealizedPnlClp ?? 0).toFixed(2)}`);

  if (payload.bySymbol && payload.bySymbol.length > 0) {
    doc.moveDown(1).fontSize(14).text("POR ACTIVO", { underline: true });
    doc.fontSize(10).moveDown(0.3);

    for (const item of payload.bySymbol) {
      doc.text(
        `${item.symbol}: ${item.events} eventos, ${item.quantity} cantidad, USD: ${item.proceedsUsd.toFixed(2)}, CLP: ${item.proceedsClp.toFixed(2)}`,
      );
    }
  }

  doc.end();

  return Buffer.concat(chunks);
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
