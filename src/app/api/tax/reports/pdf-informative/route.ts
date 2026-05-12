import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { createReportValidation } from "@/modules/reporting/application/createReportValidation";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TaxEventRow = {
  id: string;
  movementId: string;
  eventType: string;
  symbol: string;
  executedAt: Date;
  quantity: number;
  proceedsNetUsd: number;
  proceedsNetClp: number;
  costBasisClp: number;
  feeUsd: number;
  realizedPnlUsd: number;
  realizedPnlClp: number;
  effectiveTaxCategory: string;
};

const PAGE_TOP_Y = 106;
const CONTENT_BOTTOM_Y = 715;
const FOOTER_TOP_Y = 756;

function getAppUrl(request: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    request.nextUrl.origin
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatClp(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number, decimals = 8) {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

function getTaxCategoryLabel(category: string): string {
  switch (category.trim().toUpperCase()) {
    case "NON_TAXABLE":      return "No afecto";
    case "CAPITAL_GAIN":     return "Mayor valor";
    case "ORDINARY_INCOME":  return "Renta ordinaria";
    default:                 return "Pendiente revision";
  }
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  year: number,
  symbol: string | null
) {
  doc.rect(0, 0, doc.page.width, 80).fill("#111827");

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("LEDGERA", 40, 22);

  doc
    .font("Helvetica")
    .fontSize(9)
    .text("Borrador informativo tributario", 40, 48);

  doc
    .font("Helvetica")
    .fontSize(8)
    .text(`Periodo: ${year}`, 370, 26, {
      width: 180,
      align: "right",
      lineBreak: false,
    })
    .text(`Activo: ${symbol ?? "Todos"}`, 370, 44, {
      width: 180,
      align: "right",
      lineBreak: false,
    });

  doc.fillColor("#111827");
}

function drawFooter(
  doc: PDFKit.PDFDocument,
  pageNumber: number,
  totalPages: number,
  qrDataUrl: string,
  verificationUrl: string
) {
  const qrSize = 54;
  const qrX = doc.page.width - 94;
  const qrY = FOOTER_TOP_Y + 6;

  doc
    .moveTo(40, FOOTER_TOP_Y)
    .lineTo(doc.page.width - 40, FOOTER_TOP_Y)
    .strokeColor("#E5E7EB")
    .stroke();

  // QR
  doc.image(qrDataUrl, qrX, qrY, { width: qrSize, height: qrSize });
  doc.link(qrX, qrY, qrSize, qrSize, verificationUrl);

  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor("#111827")
    .text("Verificacion publica", 40, FOOTER_TOP_Y + 10, {
      width: 200,
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor("#6B7280")
    .text(
      "Escanear QR o visitar la URL para verificar autenticidad.",
      40,
      FOOTER_TOP_Y + 22,
      { width: 270, lineBreak: false }
    );

  doc
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor("#6B7280")
    .text(
      "Advertencia: borrador informativo. No reemplaza revision profesional de contador.",
      40,
      FOOTER_TOP_Y + 34,
      { width: 270, lineBreak: false }
    );

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor("#6B7280")
    .text(
      `Pagina ${pageNumber} de ${totalPages}`,
      doc.page.width - 200,
      FOOTER_TOP_Y + 10,
      { width: 100, align: "right", lineBreak: false }
    );

  doc.fillColor("#111827");
}

function drawSectionTitle(
  doc: PDFKit.PDFDocument,
  title: string,
  y: number
): number {
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#111827").text(title, 40, y);

  doc
    .moveTo(40, y + 18)
    .lineTo(doc.page.width - 40, y + 18)
    .strokeColor("#E5E7EB")
    .stroke();

  return y + 30;
}

function drawSummaryCard(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
) {
  doc.roundedRect(x, y, width, 52, 6).fillAndStroke("#F9FAFB", "#E5E7EB");

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor("#6B7280")
    .text(label, x + 10, y + 10, { width: width - 20 });

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#111827")
    .text(value, x + 10, y + 26, { width: width - 20 });
}

function drawTableHeader(doc: PDFKit.PDFDocument, y: number): number {
  doc.rect(40, y, doc.page.width - 80, 24).fill("#F3F4F6");

  const headers = [
    { label: "Fecha",         x: 46,  width: 58,  align: "left"  as const },
    { label: "Activo",        x: 108, width: 40,  align: "left"  as const },
    { label: "Categoria",     x: 152, width: 90,  align: "left"  as const },
    { label: "Cantidad",      x: 246, width: 66,  align: "right" as const },
    { label: "Ingreso USD",   x: 316, width: 70,  align: "right" as const },
    { label: "Resultado USD", x: 390, width: 74,  align: "right" as const },
    { label: "Resultado CLP", x: 468, width: 78,  align: "right" as const },
  ];

  headers.forEach((h) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor("#374151")
      .text(h.label, h.x, y + 8, { width: h.width, align: h.align });
  });

  return y + 24;
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  event: TaxEventRow,
  y: number,
  index: number
): number {
  const rowHeight = 26;

  doc
    .rect(40, y, doc.page.width - 80, rowHeight)
    .fill(index % 2 === 0 ? "#FFFFFF" : "#FAFAFA");

  const pnlColor =
    event.realizedPnlUsd > 0 ? "#16A34A"
    : event.realizedPnlUsd < 0 ? "#DC2626"
    : "#111827";

  const cols = [
    { text: formatDate(event.executedAt),                    x: 46,  width: 58,  align: "left"  as const, color: "#111827" },
    { text: event.symbol,                                    x: 108, width: 40,  align: "left"  as const, color: "#111827" },
    { text: getTaxCategoryLabel(event.effectiveTaxCategory), x: 152, width: 90,  align: "left"  as const, color: "#374151" },
    { text: formatNumber(event.quantity, 8),                 x: 246, width: 66,  align: "right" as const, color: "#111827" },
    { text: formatUsd(event.proceedsNetUsd),                 x: 316, width: 70,  align: "right" as const, color: "#111827" },
    { text: formatUsd(event.realizedPnlUsd),                 x: 390, width: 74,  align: "right" as const, color: pnlColor  },
    { text: formatClp(event.realizedPnlClp),                 x: 468, width: 78,  align: "right" as const, color: pnlColor  },
  ];

  cols.forEach((col) => {
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(col.color)
      .text(col.text, col.x, y + 8, {
        width: col.width,
        align: col.align,
        lineBreak: false,
      });
  });

  doc
    .moveTo(40, y + rowHeight)
    .lineTo(doc.page.width - 40, y + rowHeight)
    .strokeColor("#F1F5F9")
    .stroke();

  doc.fillColor("#111827");
  return y + rowHeight;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getSessionFromRequest(req);

    if (!auth) {
      return NextResponse.json(
        { ok: false, message: "No autorizado" },
        { status: 401 }
      );
    }

    const yearParam = req.nextUrl.searchParams.get("year");
    const year = yearParam ? Number(yearParam) : new Date().getFullYear();
    const symbolParam = req.nextUrl.searchParams.get("symbol");
    const symbol = symbolParam ? symbolParam.trim().toUpperCase() : null;

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { ok: false, message: "El parámetro year es inválido." },
        { status: 400 }
      );
    }

    const events = (await prisma.taxEvent.findMany({
      where: {
        executedAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lt:  new Date(`${year + 1}-01-01T00:00:00.000Z`),
        },
        ...(symbol ? { symbol } : {}),
      },
      orderBy: [{ executedAt: "asc" }, { id: "asc" }],
    })) as TaxEventRow[];

    if (events.length === 0) {
      return NextResponse.json(
        { ok: false, message: `No hay eventos tributarios para el período ${year}.` },
        { status: 404 }
      );
    }

    const totalProceedsClp  = events.reduce((acc, e) => acc + e.proceedsNetClp,  0);
    const totalCostBasisClp = events.reduce((acc, e) => acc + e.costBasisClp,    0);
    const totalPnlUsd       = events.reduce((acc, e) => acc + e.realizedPnlUsd,  0);
    const totalPnlClp       = events.reduce((acc, e) => acc + e.realizedPnlClp,  0);

    // ── Generar validationCode (igual que pdf-strict) ──
    const payload = { year, symbol, totals: { totalPnlUsd, totalPnlClp, totalProceedsClp, totalCostBasisClp, totalEvents: events.length }, events };

    const validation = await createReportValidation({
      reportType: "INFORMATIVE_TAX_REPORT",
      periodYear: year,
      symbol,
      payload,
    });

    const appUrl = getAppUrl(req);
    const verificationUrl = `${appUrl}/verify/report/${validation.hash}`;

    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 220,
    });

    // ── Generar PDF ──
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      bufferPages: true,
      info: {
        Title: `LEDGERA - Borrador informativo ${year}`,
        Author: "LEDGERA",
        Subject: String(year),
      },
    });

    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      let pageNumber = 1;

      const newPage = () => {
        doc.addPage();
        pageNumber += 1;
        drawHeader(doc, year, symbol);
        return PAGE_TOP_Y;
      };

      drawHeader(doc, year, symbol);
      let y = PAGE_TOP_Y;

      // ── Resumen general ──
      y = drawSectionTitle(doc, "Resumen general", y);

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#64748B")
        .text("Fecha de generacion:", 40, y)
        .font("Helvetica-Bold")
        .fillColor("#111827")
        .text(formatDateTime(new Date()), 40, y + 12);

      y += 34;

      const cardW   = 118;
      const cardGap = 12;

      drawSummaryCard(doc, "Eventos tributarios", String(events.length),     40,                            y, cardW);
      drawSummaryCard(doc, "Resultado USD",        formatUsd(totalPnlUsd),    40 + cardW + cardGap,           y, cardW);
      drawSummaryCard(doc, "Resultado CLP",        formatClp(totalPnlClp),    40 + (cardW + cardGap) * 2,    y, cardW);
      drawSummaryCard(doc, "Ingresos CLP",         formatClp(totalProceedsClp), 40 + (cardW + cardGap) * 3,  y, cardW);

      y += 70;

      drawSummaryCard(doc, "Base de costo CLP", formatClp(totalCostBasisClp), 40, y, 150);

      y += 70;

      // ── URL de verificación visible ──
      if (y + 40 > CONTENT_BOTTOM_Y) {
        y = newPage();
      }

      doc
        .roundedRect(40, y, doc.page.width - 80, 38, 6)
        .fillAndStroke("#F0FDF4", "#BBF7D0");

      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor("#15803D")
        .text("Verificacion publica:", 52, y + 10, { lineBreak: false });

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("#15803D")
        .text(verificationUrl, 52, y + 22, {
          width: doc.page.width - 104,
          lineBreak: false,
        });

      y += 50;

      // ── Detalle eventos ──
      if (y + 60 > CONTENT_BOTTOM_Y) {
        y = newPage();
      }

      y = drawSectionTitle(doc, "Detalle de eventos tributarios", y);
      y = drawTableHeader(doc, y);

      events.forEach((event, index) => {
        if (y + 26 > CONTENT_BOTTOM_Y) {
          y = newPage();
          y = drawTableHeader(doc, y);
        }
        y = drawTableRow(doc, event, y, index);
      });

      y += 20;

      if (y + 60 > CONTENT_BOTTOM_Y) {
        y = newPage();
      }

      // ── Nota final ──
      y = drawSectionTitle(doc, "Nota", y);

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#374151")
        .text(
          "Este borrador fue generado desde eventos tributarios derivados del calculo FIFO sobre movimientos registrados en LEDGERA. Los resultados son referenciales y deben ser revisados por un profesional tributario antes de cualquier declaracion formal.",
          40, y,
          { width: doc.page.width - 80, lineGap: 3 }
        );

      // ── Footer en todas las páginas ──
      const totalPagesCount = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPagesCount; i++) {
        doc.switchToPage(i);
        drawFooter(doc, i + 1, totalPagesCount, qrDataUrl, verificationUrl);
      }

      doc.end();
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ledgera-borrador-informativo-${year}${symbol ? `-${symbol}` : ""}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("pdf-informative error:", error);
    return NextResponse.json(
      { ok: false, message: "Error generando PDF informativo." },
      { status: 500 }
    );
  }
}