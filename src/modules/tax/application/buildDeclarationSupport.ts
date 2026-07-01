import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getStagingItems, type StagingItem } from "@/modules/staging/application/getStagingItems";
import { buildUserScopeWhere, type AccessPolicyUser } from "@/modules/identity/domain/accessPolicy";
import {
  calculateGlobalComplementaryTax,
  DEFAULT_GLOBAL_COMPLEMENTARY_TAX_YEAR,
} from "@/modules/tax/domain/globalComplementaryTax";

type TaxEventRow = {
  id: string;
  movementId: string;
  eventType: string;
  symbol: string;
  executedAt: Date;
  quantity: number;
  effectiveTaxCategory: string;
  proceedsGrossClp: number;
  costBasisClp: number;
  feeClp: number;
  realizedPnlClp: number;
};

type AssetTrace = {
  symbol: string;
  quantity: number;
  operations: number;
  lastDate: string;
};

type TraceRow = {
  date: string;
  source: string;
  provider: string;
  title: string;
  asset: string;
  amount: string;
  status: string;
  treatment: string;
  rawType: string;
  sourceIds: string;
  linkedMovementId: string;
};

type DeclarationSupportPayload = {
  generatedAt: string;
  userEmail: string;
  year: number | null;
  igcTaxYear: number;
  summary: {
    confirmedOperations: number;
    assetsWithCostBasis: number;
    buyOperations: number;
    taxableEvents: number;
    taxableBaseClp: number;
    igcEstimatedTaxClp: number;
    declarationStatus: string;
    paymentStatus: string;
    conclusion: string;
  };
  assetTrace: AssetTrace[];
  traceRows: TraceRow[];
  taxEvents: TaxEventRow[];
};

export function parseDeclarationYear(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 2009 || parsed > 2100) return null;
  return parsed;
}

function yearRange(year: number | null) {
  if (!year) return null;
  return {
    gte: new Date(`${year}-01-01T00:00:00.000Z`),
    lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
  };
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-CL");
}

function formatClp(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function extractAsset(item: StagingItem): string {
  const fromAmount = item.amountLabel.match(/\b[A-Z0-9]{2,12}\b$/)?.[0];
  if (fromAmount) return fromAmount;
  const fromSubtitle = item.subtitle.match(/·\s*([A-Z0-9]{2,12})\b/)?.[1];
  return fromSubtitle ?? "ACTIVO";
}

function extractQuantity(item: StagingItem): number {
  const parsed = Number.parseFloat(item.amountLabel.replace(/,/g, ".").match(/-?\d+(?:\.\d+)?/)?.[0] ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

function isBuy(item: StagingItem): boolean {
  return /compra|buy|spot_buy/i.test(`${item.title} ${item.subtitle} ${item.rawType}`);
}

function treatmentFor(item: StagingItem): string {
  const text = `${item.title} ${item.subtitle} ${item.rawType}`;
  if (/venta|sell|swap|permuta/i.test(text)) return "Evento tributario a revisar";
  if (/staking|reward|airdrop|earn|rendimiento/i.test(text)) return "Ingreso/rendimiento a clasificar";
  if (isBuy(item)) return "Compra / base de costo / respaldo";
  return "Respaldo tributario / trazabilidad";
}

function buildAssetTrace(items: StagingItem[]): AssetTrace[] {
  const map = new Map<string, AssetTrace>();
  for (const item of items) {
    const symbol = extractAsset(item);
    const current = map.get(symbol) ?? {
      symbol,
      quantity: 0,
      operations: 0,
      lastDate: item.occurredAt,
    };
    current.quantity += extractQuantity(item);
    current.operations += 1;
    if (new Date(item.occurredAt).getTime() > new Date(current.lastDate).getTime()) {
      current.lastDate = item.occurredAt;
    }
    map.set(symbol, current);
  }
  return Array.from(map.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
}

function buildTraceRows(items: StagingItem[]): TraceRow[] {
  return items.map((item) => ({
    date: formatDate(item.occurredAt),
    source: item.source,
    provider: item.provider || item.sources.join(" + ") || "—",
    title: item.title,
    asset: extractAsset(item),
    amount: item.amountLabel,
    status: item.status,
    treatment: treatmentFor(item),
    rawType: item.rawType || "—",
    sourceIds: item.allIds.join(", "),
    linkedMovementId: item.linkedMovementId ?? "—",
  }));
}

async function getTaxEvents(user: AccessPolicyUser, year: number | null): Promise<TaxEventRow[]> {
  const range = yearRange(year);
  return prisma.taxEvent.findMany({
    where: {
      ...buildUserScopeWhere(user),
      ...(range ? { executedAt: range } : {}),
    },
    orderBy: [
      { executedAt: "asc" },
      { id: "asc" },
    ],
    select: {
      id: true,
      movementId: true,
      eventType: true,
      symbol: true,
      executedAt: true,
      quantity: true,
      effectiveTaxCategory: true,
      proceedsGrossClp: true,
      costBasisClp: true,
      feeClp: true,
      realizedPnlClp: true,
    },
  });
}

export async function buildDeclarationSupportPayload(input: {
  user: AccessPolicyUser;
  year: number | null;
}): Promise<DeclarationSupportPayload> {
  const [staging, taxEvents] = await Promise.all([
    getStagingItems(input.user.id),
    getTaxEvents(input.user, input.year),
  ]);

  const confirmed = staging.items.filter((item) => {
    if (item.status !== "CONFIRMED") return false;
    if (!input.year) return true;
    return new Date(item.occurredAt).getUTCFullYear() === input.year;
  });

  const assetTrace = buildAssetTrace(confirmed);
  const traceRows = buildTraceRows(confirmed);
  const buyOperations = confirmed.filter(isBuy).length;
  const taxableBaseClp = Math.max(0, taxEvents.reduce((sum, event) => sum + Number(event.realizedPnlClp || 0), 0));
  const igcTaxYear = input.year === 2025 || input.year === null ? DEFAULT_GLOBAL_COMPLEMENTARY_TAX_YEAR : DEFAULT_GLOBAL_COMPLEMENTARY_TAX_YEAR;
  const igc = calculateGlobalComplementaryTax({ taxableIncomeClp: taxableBaseClp, taxYear: igcTaxYear });

  const mustSupport = confirmed.length > 0;
  const mustPay = igc.taxClp > 0;
  const hasTaxableEvents = taxEvents.length > 0;

  let conclusion = "Sin operaciones confirmadas para declarar o respaldar.";
  if (mustPay) {
    conclusion = `Debe declarar y existe impuesto estimado a pagar por Impuesto Global Complementario: ${formatClp(igc.taxClp)} según la base imponible detectada por LEDGERA.`;
  } else if (hasTaxableEvents) {
    conclusion = "Debe declarar y respaldar las operaciones. Con la base imponible detectada por LEDGERA, no se estima pago de Impuesto Global Complementario.";
  } else if (mustSupport) {
    conclusion = "Debe declarar o conservar respaldo tributario de las operaciones. No se detecta impuesto inmediato a pagar por Impuesto Global Complementario.";
  }

  return {
    generatedAt: new Date().toISOString(),
    userEmail: input.user.email,
    year: input.year,
    igcTaxYear,
    summary: {
      confirmedOperations: confirmed.length,
      assetsWithCostBasis: assetTrace.length,
      buyOperations,
      taxableEvents: taxEvents.length,
      taxableBaseClp,
      igcEstimatedTaxClp: igc.taxClp,
      declarationStatus: mustSupport ? "DECLARAR_RESPALDAR" : "SIN_DATOS",
      paymentStatus: mustPay ? "PAGA_IGC_ESTIMADO" : "SIN_PAGO_IGC_DETECTADO",
      conclusion,
    },
    assetTrace,
    traceRows,
    taxEvents,
  };
}

function addPdfHeader(doc: PDFKit.PDFDocument, payload: DeclarationSupportPayload) {
  const margin = 48;
  const topY = doc.y;
  const pageWidth = doc.page.width;
  const metadataWidth = 265;
  const metadataX = pageWidth - margin - metadataWidth;
  const brandWidth = metadataX - margin - 24;

  doc.font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#071B28")
    .text("LEDGERA", margin, topY, { width: brandWidth, align: "left" });
  doc.font("Helvetica")
    .fontSize(8)
    .fillColor("#0F766E")
    .text("Sistema Operativo Financiero y Tributario", margin, topY + 25, { width: brandWidth, align: "left" });

  doc.font("Helvetica")
    .fontSize(8.5)
    .fillColor("#475569")
    .text(`Contribuyente/usuario: ${payload.userEmail}`, metadataX, topY + 1, { width: metadataWidth, align: "right" });
  doc.text(`Año operaciones: ${payload.year ?? "Todos"} · Año tabla IGC: AT ${payload.igcTaxYear}`, metadataX, topY + 14, { width: metadataWidth, align: "right" });
  doc.text(`Generado: ${new Date(payload.generatedAt).toLocaleString("es-CL")}`, metadataX, topY + 27, { width: metadataWidth, align: "right" });

  doc.moveTo(margin, topY + 50)
    .lineTo(pageWidth - margin, topY + 50)
    .strokeColor("#D9F5E8")
    .lineWidth(1)
    .stroke();

  doc.y = topY + 66;
  doc.font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#0F2A3D")
    .text("Declaración tributaria y respaldo de criptoactivos", margin, doc.y, { width: pageWidth - margin * 2 });
  doc.moveDown();
}

function checkPage(doc: PDFKit.PDFDocument, minY = 720) {
  if (doc.y > minY) doc.addPage();
}

function writeKeyValue(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc.font("Helvetica-Bold").fillColor("#0F2A3D").text(`${label}: `, { continued: true });
  doc.font("Helvetica").fillColor("#334155").text(value);
}

export async function renderDeclarationSupportPdf(payload: DeclarationSupportPayload): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addPdfHeader(doc, payload);

    doc.font("Helvetica-Bold").fontSize(12).fillColor("#0F766E").text("Conclusión expresa LEDGERA");
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(10).fillColor("#334155").text(payload.summary.conclusion, { lineGap: 2 });
    doc.moveDown();

    doc.font("Helvetica-Bold").fontSize(12).fillColor("#0F2A3D").text("Resumen declaración vs pago");
    doc.moveDown(0.3);
    doc.fontSize(9);
    writeKeyValue(doc, "Declaración / respaldo", payload.summary.declarationStatus);
    writeKeyValue(doc, "Pago IGC", payload.summary.paymentStatus);
    writeKeyValue(doc, "Operaciones confirmadas", String(payload.summary.confirmedOperations));
    writeKeyValue(doc, "Activos con base de costo", String(payload.summary.assetsWithCostBasis));
    writeKeyValue(doc, "Compras/base de costo", String(payload.summary.buyOperations));
    writeKeyValue(doc, "Eventos imponibles detectados", String(payload.summary.taxableEvents));
    writeKeyValue(doc, "Base imponible IGC detectada", formatClp(payload.summary.taxableBaseClp));
    writeKeyValue(doc, "IGC estimado", formatClp(payload.summary.igcEstimatedTaxClp));
    doc.moveDown();

    checkPage(doc);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#0F2A3D").text("Trazabilidad por activo");
    doc.moveDown(0.4);
    if (payload.assetTrace.length === 0) {
      doc.font("Helvetica").fontSize(9).fillColor("#64748B").text("Sin activos confirmados.");
    }
    for (const asset of payload.assetTrace) {
      checkPage(doc);
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#0F2A3D").text(`${asset.symbol}`);
      doc.font("Helvetica").fontSize(8).fillColor("#475569").text(`Cantidad detectada: ${asset.quantity.toLocaleString("es-CL", { maximumFractionDigits: 8 })} · Operaciones: ${asset.operations} · Última fecha: ${formatDate(asset.lastDate)}`);
      doc.moveDown(0.25);
    }

    doc.moveDown();
    checkPage(doc);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#0F2A3D").text("Detalle de operaciones confirmadas");
    doc.moveDown(0.4);

    for (const row of payload.traceRows.slice(0, 160)) {
      checkPage(doc);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#0F2A3D").text(`${row.date} · ${row.provider} · ${row.asset} · ${row.amount}`);
      doc.font("Helvetica").fontSize(7.8).fillColor("#475569").text(`${row.title} · ${row.treatment}`);
      doc.font("Helvetica").fontSize(7).fillColor("#64748B").text(`Fuente: ${row.source} · Tipo: ${row.rawType} · IDs: ${row.sourceIds}`);
      doc.moveDown(0.35);
    }

    if (payload.traceRows.length > 160) {
      doc.moveDown(0.4);
      doc.font("Helvetica").fontSize(8).fillColor("#64748B").text(`Se muestran 160 operaciones en PDF. El Excel contiene el detalle completo de ${payload.traceRows.length} operaciones.`);
    }

    checkPage(doc);
    doc.moveDown();
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#0F2A3D").text("Alcance del documento");
    doc.font("Helvetica").fontSize(8).fillColor("#64748B").text("Documento generado automáticamente desde datos confirmados en LEDGERA. La conclusión se limita a la información importada y validada en la plataforma. Debe revisarse junto con los demás antecedentes tributarios del contribuyente antes de presentar una declaración final.", { lineGap: 2 });

    doc.end();
  });
}

function sheetFromAoA(rows: unknown[][]) {
  return XLSX.utils.aoa_to_sheet(rows);
}

export function renderDeclarationSupportXlsx(payload: DeclarationSupportPayload): Buffer {
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: "Declaración tributaria y respaldo de criptoactivos LEDGERA",
    Subject: "Trazabilidad de activos y conclusión tributaria",
    Author: "LEDGERA",
    CreatedDate: new Date(payload.generatedAt),
  };

  const summaryRows = [
    ["LEDGERA"],
    ["Sistema Operativo Financiero y Tributario"],
    [],
    ["Declaración tributaria y respaldo de criptoactivos"],
    ["Usuario", payload.userEmail],
    ["Año operaciones", payload.year ?? "Todos"],
    ["Año tabla IGC", `AT ${payload.igcTaxYear}`],
    ["Generado", new Date(payload.generatedAt).toLocaleString("es-CL")],
    [],
    ["Conclusión expresa LEDGERA", payload.summary.conclusion],
    [],
    ["Declaración / respaldo", payload.summary.declarationStatus],
    ["Pago IGC", payload.summary.paymentStatus],
    ["Operaciones confirmadas", payload.summary.confirmedOperations],
    ["Activos con base de costo", payload.summary.assetsWithCostBasis],
    ["Compras/base de costo", payload.summary.buyOperations],
    ["Eventos imponibles detectados", payload.summary.taxableEvents],
    ["Base imponible IGC detectada CLP", payload.summary.taxableBaseClp],
    ["IGC estimado CLP", payload.summary.igcEstimatedTaxClp],
  ];
  const summarySheet = sheetFromAoA(summaryRows);
  summarySheet["!cols"] = [{ wch: 34 }, { wch: 120 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Resumen");

  const assetRows = [
    ["Logo", "LEDGERA"],
    ["Activo", "Cantidad detectada", "Operaciones", "Última fecha"],
    ...payload.assetTrace.map((asset) => [
      asset.symbol,
      asset.quantity,
      asset.operations,
      formatDate(asset.lastDate),
    ]),
  ];
  const assetSheet = sheetFromAoA(assetRows);
  assetSheet["!cols"] = [{ wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, assetSheet, "Trazabilidad activos");

  const operationRows = [
    ["Logo", "LEDGERA"],
    ["Fecha", "Fuente", "Proveedor", "Operación", "Activo", "Monto", "Estado", "Tratamiento", "Tipo origen", "IDs origen", "Movimiento vinculado"],
    ...payload.traceRows.map((row) => [
      row.date,
      row.source,
      row.provider,
      row.title,
      row.asset,
      row.amount,
      row.status,
      row.treatment,
      row.rawType,
      row.sourceIds,
      row.linkedMovementId,
    ]),
  ];
  const operationsSheet = sheetFromAoA(operationRows);
  operationsSheet["!cols"] = [
    { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 28 }, { wch: 12 }, { wch: 18 },
    { wch: 14 }, { wch: 34 }, { wch: 18 }, { wch: 42 }, { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, operationsSheet, "Operaciones");

  const taxRows = [
    ["Logo", "LEDGERA"],
    ["Fecha", "Tipo evento", "Activo", "Cantidad", "Categoría", "Ingreso bruto CLP", "Base costo CLP", "Fee CLP", "Resultado CLP", "ID evento", "Movimiento"],
    ...payload.taxEvents.map((event) => [
      formatDate(event.executedAt),
      event.eventType,
      event.symbol,
      event.quantity,
      event.effectiveTaxCategory,
      event.proceedsGrossClp,
      event.costBasisClp,
      event.feeClp,
      event.realizedPnlClp,
      event.id,
      event.movementId,
    ]),
  ];
  const taxSheet = sheetFromAoA(taxRows);
  taxSheet["!cols"] = [
    { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 22 },
    { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 36 }, { wch: 36 },
  ];
  XLSX.utils.book_append_sheet(wb, taxSheet, "Eventos tributarios");

  return XLSX.write(wb, { bookType: "xlsx", type: "buffer" }) as Buffer;
}
