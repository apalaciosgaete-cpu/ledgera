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
    igcMarginalRatePct: number;
    igcEffectiveRatePct: number;
    igcBracketFromClp: number;
    igcBracketToClp: number | null;
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

function formatPct(value: number): string {
  return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(value)}%`;
}

function formatBracket(from: number, to: number | null): string {
  if (to === null) return `Desde ${formatClp(from)} sin tope`;
  return `${formatClp(from)} a ${formatClp(to)}`;
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
  const igcEffectiveRatePct = taxableBaseClp > 0 ? (igc.taxClp / taxableBaseClp) * 100 : 0;

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
      igcMarginalRatePct: igc.marginalRatePct,
      igcEffectiveRatePct,
      igcBracketFromClp: igc.bracket.fromClpInclusive,
      igcBracketToClp: igc.bracket.toClpInclusive,
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

  doc.y = topY + 64;
  doc.font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#0F2A3D")
    .text("Respaldo de movimientos", margin, doc.y, { width: pageWidth - margin * 2 });
  doc.moveDown(1);
}

function checkPage(doc: PDFKit.PDFDocument, minY = 720) {
  if (doc.y > minY) doc.addPage();
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  checkPage(doc, 690);
  doc.moveDown(0.2);
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#0F766E").text(title);
  doc.moveDown(0.35);
}

function writeRows(doc: PDFKit.PDFDocument, rows: Array<[string, string]>) {
  const leftX = doc.page.margins.left;
  const valueX = leftX + 205;
  const valueWidth = doc.page.width - valueX - doc.page.margins.right;

  for (const [label, value] of rows) {
    checkPage(doc);
    const y = doc.y;
    doc.font("Helvetica-Bold").fontSize(8.8).fillColor("#0F2A3D").text(label, leftX, y, { width: 190 });
    doc.font("Helvetica").fontSize(8.8).fillColor("#334155").text(value, valueX, y, { width: valueWidth });
    const rowHeight = Math.max(
      doc.heightOfString(label, { width: 190 }),
      doc.heightOfString(value, { width: valueWidth }),
    );
    doc.y = y + rowHeight + 5;
  }
  doc.moveDown(0.5);
}

function writeAssetTraceTable(doc: PDFKit.PDFDocument, rows: AssetTrace[]) {
  const leftX = doc.page.margins.left;
  const columns = [
    { label: "Activo", x: leftX, width: 72 },
    { label: "Cantidad detectada", x: leftX + 88, width: 150 },
    { label: "Operaciones", x: leftX + 255, width: 82 },
    { label: "Última fecha", x: leftX + 356, width: 110 },
  ];

  const writeHeader = () => {
    checkPage(doc, 700);
    const y = doc.y;
    doc.font("Helvetica-Bold").fontSize(8.4).fillColor("#0F766E");
    for (const column of columns) {
      doc.text(column.label, column.x, y, { width: column.width });
    }
    doc.y = y + 16;
  };

  if (rows.length === 0) {
    doc.font("Helvetica").fontSize(9).fillColor("#64748B").text("Sin activos confirmados.");
    return;
  }

  writeHeader();
  for (const asset of rows) {
    if (doc.y > 720) {
      doc.addPage();
      writeHeader();
    }
    const y = doc.y;
    doc.font("Helvetica-Bold").fontSize(8.6).fillColor("#0F2A3D").text(asset.symbol, columns[0].x, y, { width: columns[0].width });
    doc.font("Helvetica").fontSize(8.6).fillColor("#334155").text(asset.quantity.toLocaleString("es-CL", { maximumFractionDigits: 8 }), columns[1].x, y, { width: columns[1].width });
    doc.text(String(asset.operations), columns[2].x, y, { width: columns[2].width });
    doc.text(formatDate(asset.lastDate), columns[3].x, y, { width: columns[3].width });
    doc.y = y + 15;
  }
  doc.moveDown(0.7);
}

export async function renderDeclarationSupportPdf(payload: DeclarationSupportPayload): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addPdfHeader(doc, payload);

    sectionTitle(doc, "Resumen");
    writeRows(doc, [
      ["Declaración / respaldo", payload.summary.declarationStatus],
      ["Pago IGC", payload.summary.paymentStatus],
      ["Operaciones confirmadas", String(payload.summary.confirmedOperations)],
      ["Activos con base de costo", String(payload.summary.assetsWithCostBasis)],
      ["Compras/base de costo", String(payload.summary.buyOperations)],
      ["Eventos imponibles detectados", String(payload.summary.taxableEvents)],
    ]);

    sectionTitle(doc, "IGC detectado");
    writeRows(doc, [
      ["Base imponible IGC detectada", formatClp(payload.summary.taxableBaseClp)],
      ["Tramo IGC aplicado", formatBracket(payload.summary.igcBracketFromClp, payload.summary.igcBracketToClp)],
      ["Tasa marginal del tramo", formatPct(payload.summary.igcMarginalRatePct)],
      ["Tasa efectiva detectada", formatPct(payload.summary.igcEffectiveRatePct)],
      ["IGC estimado", formatClp(payload.summary.igcEstimatedTaxClp)],
    ]);

    sectionTitle(doc, "Trazabilidad por activo");
    writeAssetTraceTable(doc, payload.assetTrace);

    sectionTitle(doc, "Detalle de operaciones confirmadas");
    writeRows(doc, payload.traceRows.slice(0, 160).map((row) => [
      `${row.date} · ${row.asset}`,
      `${row.provider} · ${row.amount} · ${row.title} · ${row.treatment} · Fuente: ${row.source} · Tipo: ${row.rawType}`,
    ]));

    if (payload.traceRows.length > 160) {
      doc.moveDown(0.4);
      doc.font("Helvetica").fontSize(8).fillColor("#64748B").text(`Se muestran 160 operaciones en PDF. El Excel contiene el detalle completo de ${payload.traceRows.length} operaciones.`);
    }

    sectionTitle(doc, "Alcance del documento");
    doc.font("Helvetica").fontSize(8.5).fillColor("#64748B").text("Documento generado automáticamente desde datos confirmados en LEDGERA. La conclusión se limita a la información importada y validada en la plataforma. Debe revisarse junto con los demás antecedentes tributarios del contribuyente antes de presentar una declaración final.", { lineGap: 2 });

    sectionTitle(doc, "Conclusión expresa LEDGERA");
    doc.font("Helvetica").fontSize(10).fillColor("#334155").text(payload.summary.conclusion, { lineGap: 2 });

    doc.end();
  });
}

function sheetFromAoA(rows: unknown[][]) {
  return XLSX.utils.aoa_to_sheet(rows);
}

export function renderDeclarationSupportXlsx(payload: DeclarationSupportPayload): Buffer {
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: "Respaldo de movimientos LEDGERA",
    Subject: "Trazabilidad de activos y conclusion tributaria",
    Author: "LEDGERA",
    CreatedDate: new Date(payload.generatedAt),
  };

  const summaryRows = [
    ["LEDGERA"],
    ["Sistema Operativo Financiero y Tributario"],
    [],
    ["Respaldo de movimientos"],
    ["Usuario", payload.userEmail],
    ["Año operaciones", payload.year ?? "Todos"],
    ["Año tabla IGC", `AT ${payload.igcTaxYear}`],
    ["Generado", new Date(payload.generatedAt).toLocaleString("es-CL")],
    [],
    ["Declaración / respaldo", payload.summary.declarationStatus],
    ["Pago IGC", payload.summary.paymentStatus],
    ["Operaciones confirmadas", payload.summary.confirmedOperations],
    ["Activos con base de costo", payload.summary.assetsWithCostBasis],
    ["Compras/base de costo", payload.summary.buyOperations],
    ["Eventos imponibles detectados", payload.summary.taxableEvents],
    ["Base imponible IGC detectada CLP", payload.summary.taxableBaseClp],
    ["Tramo IGC aplicado", formatBracket(payload.summary.igcBracketFromClp, payload.summary.igcBracketToClp)],
    ["Tasa marginal del tramo", formatPct(payload.summary.igcMarginalRatePct)],
    ["Tasa efectiva detectada", formatPct(payload.summary.igcEffectiveRatePct)],
    ["IGC estimado CLP", payload.summary.igcEstimatedTaxClp],
    [],
    ["Conclusión expresa LEDGERA", payload.summary.conclusion],
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
