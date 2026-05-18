import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { listTaxPeriodAuditLogsByYear } from "@/modules/tax/infrastructure/taxPeriodAuditLogRepository";
import { listTaxPeriodSnapshotsByYear } from "@/modules/tax/infrastructure/taxPeriodSnapshotRepository";
import { createReportValidation } from "@/modules/reporting/application/createReportValidation";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_TOP_Y      = 100;
const CONTENT_BOTTOM  = 700;
const FOOTER_TOP      = 738;

function getAppUrl(req: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? req.nextUrl.origin;
}

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function actionLabel(action: string) {
  switch (action) {
    case "CLOSE":  return "Cierre de periodo";
    case "REOPEN": return "Reapertura de periodo";
    default:       return action;
  }
}

function periodStatusLabel(status: string) {
  switch (status) {
    case "OPEN":     return "Abierto";
    case "CLOSED":   return "Cerrado";
    case "REOPENED": return "Reabierto";
    default:         return status;
  }
}

function drawHeader(doc: PDFKit.PDFDocument, year: number) {
  doc.rect(0, 0, doc.page.width, 72).fill("#111827");
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(18).text("LEDGERA", 40, 18);
  doc.font("Helvetica").fontSize(8.5).text("Trazabilidad de auditoría tributaria", 40, 42);
  doc.font("Helvetica").fontSize(8)
    .text(`Periodo: ${year}`, doc.page.width - 220, 28, { width: 180, align: "right", lineBreak: false })
    .text(`Generado: ${formatDateTime(new Date())}`, doc.page.width - 220, 44, { width: 180, align: "right", lineBreak: false });
  doc.fillColor("#111827");
}

function drawFooter(
  doc: PDFKit.PDFDocument,
  page: number,
  total: number,
  qrDataUrl: string,
  verificationUrl: string,
) {
  const qrSize = 70;
  const qrX    = doc.page.width - 110;
  const qrY    = FOOTER_TOP + 2;

  doc.moveTo(40, FOOTER_TOP).lineTo(doc.page.width - 40, FOOTER_TOP).strokeColor("#E5E7EB").stroke();

  // QR
  doc.image(qrDataUrl, qrX, qrY, { width: qrSize, height: qrSize });
  doc.link(qrX, qrY, qrSize, qrSize, verificationUrl);

  // Texto izquierdo: etiqueta + URL + instrucción + página
  doc.font("Helvetica-Bold").fontSize(7).fillColor("#111827")
    .text("Verificación pública:", 40, FOOTER_TOP + 6, { lineBreak: false });

  doc.font("Helvetica").fontSize(6.5).fillColor("#15803D")
    .text(verificationUrl, 40, FOOTER_TOP + 18, { width: qrX - 55, lineBreak: false });

  doc.font("Helvetica").fontSize(6).fillColor("#94A3B8")
    .text("Escanear el QR o visitar la URL para verificar autenticidad del documento.", 40, FOOTER_TOP + 32, { width: qrX - 55, lineBreak: false });

  doc.font("Helvetica").fontSize(6.5).fillColor("#94A3B8")
    .text(`Página ${page} de ${total}`, 40, FOOTER_TOP + 56, { lineBreak: false });

  doc.fillColor("#111827");
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(title, 40, y);
  doc.moveTo(40, y + 16).lineTo(doc.page.width - 40, y + 16).strokeColor("#E5E7EB").stroke();
  return y + 28;
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  cols: { label: string; x: number; width: number; align?: "left" | "right" }[],
  y: number,
): number {
  doc.rect(40, y, doc.page.width - 80, 22).fill("#F3F4F6");
  cols.forEach((c) => {
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#374151")
      .text(c.label, c.x, y + 7, { width: c.width, align: c.align ?? "left" });
  });
  return y + 22;
}

function drawRow(
  doc: PDFKit.PDFDocument,
  cells: { text: string; x: number; width: number; align?: "left" | "right"; color?: string }[],
  y: number,
  rowHeight: number,
  index: number,
): number {
  doc.rect(40, y, doc.page.width - 80, rowHeight).fill(index % 2 === 0 ? "#FFFFFF" : "#FAFAFA");
  cells.forEach((c) => {
    doc.font("Helvetica").fontSize(7.5).fillColor(c.color ?? "#111827")
      .text(c.text, c.x, y + 6, { width: c.width, align: c.align ?? "left", lineBreak: false });
  });
  doc.moveTo(40, y + rowHeight).lineTo(doc.page.width - 40, y + rowHeight).strokeColor("#F1F5F9").stroke();
  doc.fillColor("#111827");
  return y + rowHeight;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getSessionFromRequest(req);
    if (!auth) return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });

    const yearParam = req.nextUrl.searchParams.get("year");
    const year      = yearParam ? Number(yearParam) : new Date().getFullYear();
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ ok: false, message: "Año inválido." }, { status: 400 });
    }

    const [closure, logs, snapshots] = await Promise.all([
      prisma.taxPeriodClose.findUnique({
        where: { userId_periodYear: { userId: auth.user.id, periodYear: year } },
      }),
      listTaxPeriodAuditLogsByYear(year),
      listTaxPeriodSnapshotsByYear(year),
    ]);

    const status = !closure ? "OPEN" : closure.reopenedAt ? "REOPENED" : "CLOSED";

    const payload = {
      year, status,
      closedAt:    closure?.closedAt?.toISOString()   ?? null,
      reopenedAt:  closure?.reopenedAt?.toISOString() ?? null,
      logsCount:   logs.length,
      snapsCount:  snapshots.length,
    };

    const validation = await createReportValidation({
      reportType: "AUDIT_TRAIL_PDF",
      periodYear: year,
      payload,
    });

    const appUrl         = getAppUrl(req);
    const verificationUrl = `${appUrl}/verify/report/${validation.hash}`;

    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 220,
    });

    const doc = new PDFDocument({
      size: "A4", margin: 40, bufferPages: true,
      info: { Title: `LEDGERA - Trazabilidad ${year}`, Author: "LEDGERA", Subject: String(year) },
    });

    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      let pageNum = 1;
      const newPage = () => { doc.addPage(); pageNum++; drawHeader(doc, year); return PAGE_TOP_Y; };

      drawHeader(doc, year);
      let y = PAGE_TOP_Y;

      // ── Información del periodo ──
      y = drawSectionTitle(doc, "Información del periodo", y);

      const infoItems = [
        { label: "Año tributario",   value: String(year) },
        { label: "Estado",           value: periodStatusLabel(status) },
        { label: "Fecha de cierre",  value: closure?.closedAt  ? formatDateTime(closure.closedAt)  : "Sin cerrar" },
        { label: "Fecha reapertura", value: closure?.reopenedAt ? formatDateTime(closure.reopenedAt) : "—" },
        { label: "Motivo cierre",    value: closure?.closedReason ?? "—" },
      ];

      infoItems.forEach((item) => {
        if (y + 18 > CONTENT_BOTTOM) y = newPage();
        doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#6B7280").text(item.label + ":", 40, y, { lineBreak: false });
        doc.font("Helvetica").fontSize(7.5).fillColor("#111827").text(item.value, 160, y, { lineBreak: false });
        y += 16;
      });

      y += 16;

      // ── Historial de acciones ──
      if (y + 60 > CONTENT_BOTTOM) y = newPage();
      y = drawSectionTitle(doc, `Historial de acciones del periodo (${logs.length})`, y);

      if (logs.length === 0) {
        doc.font("Helvetica").fontSize(8).fillColor("#94A3B8").text("Sin acciones registradas para este periodo.", 40, y);
        y += 24;
      } else {
        const logCols = [
          { label: "Fecha",   x: 46,  width: 90 },
          { label: "Acción",  x: 140, width: 100 },
          { label: "Actor",   x: 244, width: 130 },
          { label: "Motivo",  x: 378, width: 172 },
        ];
        y = drawTableHeader(doc, logCols, y);
        logs.forEach((log, i) => {
          if (y + 24 > CONTENT_BOTTOM) { y = newPage(); y = drawTableHeader(doc, logCols, y); }
          y = drawRow(doc, [
            { text: formatDateTime(log.createdAt), x: 46,  width: 90  },
            { text: actionLabel(log.action),        x: 140, width: 100 },
            { text: log.actorEmail ?? "—",          x: 244, width: 130 },
            { text: log.reason     ?? "—",          x: 378, width: 172 },
          ], y, 24, i);
        });
      }

      y += 16;

      // ── Registros de cierre ──
      if (y + 60 > CONTENT_BOTTOM) y = newPage();
      y = drawSectionTitle(doc, `Registros de cierre — snapshots (${snapshots.length})`, y);

      if (snapshots.length === 0) {
        doc.font("Helvetica").fontSize(8).fillColor("#94A3B8").text("Sin registros de cierre para este periodo.", 40, y);
        y += 24;
      } else {
        const snapCols = [
          { label: "#",                  x: 46,  width: 24 },
          { label: "Fecha",              x: 74,  width: 90 },
          { label: "Hash de integridad", x: 168, width: 382 },
        ];
        y = drawTableHeader(doc, snapCols, y);
        snapshots.forEach((snap, i) => {
          if (y + 24 > CONTENT_BOTTOM) { y = newPage(); y = drawTableHeader(doc, snapCols, y); }
          y = drawRow(doc, [
            { text: String(snapshots.length - i), x: 46,  width: 24  },
            { text: formatDateTime(snap.createdAt), x: 74,  width: 90 },
            { text: snap.contentHash,              x: 168, width: 382, color: "#475569" },
          ], y, 24, i);
        });
      }

      // ── Footer en todas las páginas ──
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        drawFooter(doc, i + 1, totalPages, qrDataUrl, verificationUrl);
      }

      doc.end();
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="ledgera-trazabilidad-auditoria-${year}.pdf"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (error) {
    console.error("audit export pdf error:", error);
    return NextResponse.json({ ok: false, message: "Error al generar el PDF de trazabilidad." }, { status: 500 });
  }
}
