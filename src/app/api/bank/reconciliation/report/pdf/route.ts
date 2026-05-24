import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, serverError } from "@/shared/apiResponse";
import PDFDocument from "pdfkit";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";
export const maxDuration = 60;

// ── Layout constants ──────────────────────────────────────────────────────────
const PAGE_TOP_Y      = 96;
const CONTENT_BOTTOM  = 720;

// ── Formatters ────────────────────────────────────────────────────────────────
function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }).format(new Date(d));
}

function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

function fmtClp(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n: number | null): string {
  return n !== null ? `${Math.round(n * 100)}%` : "—";
}

function truncate(s: string, max = 38): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

// ── PDF helpers ───────────────────────────────────────────────────────────────
function drawHeader(doc: PDFKit.PDFDocument) {
  doc.rect(0, 0, doc.page.width, 72).fill("#0F2A3D");
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(18).text("LEDGERA", 40, 18);
  doc.font("Helvetica").fontSize(9).text("Reporte de conciliación financiera  ·  Banco ↔ Binance", 40, 44);
  doc.font("Helvetica").fontSize(7.5).fillColor("#94A3B8")
    .text(`Generado: ${fmtDateTime(new Date())}`, 40, doc.page.width - 200, {
      width: doc.page.width - 80, align: "right", lineBreak: false,
    });
  doc.fillColor("#111827");
}

function drawFooter(doc: PDFKit.PDFDocument, page: number, total: number) {
  const y = doc.page.height - 36;
  doc.moveTo(40, y).lineTo(doc.page.width - 40, y).strokeColor("#E5E7EB").stroke();
  doc.font("Helvetica").fontSize(6.5).fillColor("#9CA3AF")
    .text("LEDGERA · Reporte de conciliación financiera · Solo para uso interno y contable.", 40, y + 8, {
      width: doc.page.width - 200, lineBreak: false,
    })
    .text(`Página ${page} de ${total}`, doc.page.width - 200, y + 8, {
      width: 160, align: "right", lineBreak: false,
    });
  doc.fillColor("#111827");
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0F2A3D").text(title, 40, y);
  doc.moveTo(40, y + 16).lineTo(doc.page.width - 40, y + 16).strokeColor("#E2E8F0").stroke();
  return y + 28;
}

function drawSummaryCard(
  doc: PDFKit.PDFDocument,
  label: string, value: string,
  x: number, y: number, w: number,
) {
  doc.roundedRect(x, y, w, 48, 5).fillAndStroke("#F8FAFC", "#E2E8F0");
  doc.font("Helvetica").fontSize(7).fillColor("#64748B").text(label, x + 10, y + 10, { width: w - 20 });
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#0F2A3D").text(value, x + 10, y + 24, { width: w - 20 });
}

// ── Matched table ─────────────────────────────────────────────────────────────
type MatchedRow = {
  bankName:    string | null;
  occurredAt:  Date;
  description: string;
  amountClp:   number;
  direction:   string;
  cryptoDate:  Date | null;
  cryptoType:  string | null;
  symbol:      string | null;
  quantity:    number | null;
  priceUsd:    number | null;
  confidence:  number | null;
  reason:      string | null;
  matchedAt:   Date | null;
};

function drawMatchedHeader(doc: PDFKit.PDFDocument, y: number): number {
  doc.rect(40, y, doc.page.width - 80, 20).fill("#F1F5F9");
  const cols = [
    { label: "Fecha banco",  x: 46,  w: 58  },
    { label: "Banco",        x: 108, w: 50  },
    { label: "Descripción",  x: 162, w: 120 },
    { label: "Monto CLP",    x: 286, w: 70  },
    { label: "Crypto",       x: 360, w: 60  },
    { label: "Confianza",    x: 424, w: 50  },
    { label: "Conciliado",   x: 478, w: 64  },
  ];
  cols.forEach(c => {
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#475569")
      .text(c.label, c.x, y + 6, { width: c.w, lineBreak: false });
  });
  return y + 20;
}

function drawMatchedRow(doc: PDFKit.PDFDocument, r: MatchedRow, y: number, idx: number): number {
  const h = 22;
  doc.rect(40, y, doc.page.width - 80, h).fill(idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC");
  const cols = [
    { text: fmtDate(r.occurredAt),                     x: 46,  w: 58,  color: "#374151" },
    { text: r.bankName ?? "—",                         x: 108, w: 50,  color: "#374151" },
    { text: truncate(r.description, 28),               x: 162, w: 120, color: "#111827" },
    { text: fmtClp(r.amountClp),                       x: 286, w: 70,  color: "#DC2626" },
    { text: r.symbol ? `${r.symbol} · ${r.cryptoType ?? ""}` : "—", x: 360, w: 60, color: "#1D4ED8" },
    { text: fmtPct(r.confidence),                      x: 424, w: 50,  color: "#16A34A" },
    { text: fmtDate(r.matchedAt),                      x: 478, w: 64,  color: "#374151" },
  ];
  cols.forEach(c => {
    doc.font("Helvetica").fontSize(7).fillColor(c.color)
      .text(c.text, c.x, y + 7, { width: c.w, lineBreak: false });
  });
  doc.moveTo(40, y + h).lineTo(doc.page.width - 40, y + h).strokeColor("#F1F5F9").stroke();
  doc.fillColor("#111827");
  return y + h;
}

// ── Audit table ───────────────────────────────────────────────────────────────
type AuditRow = {
  createdAt: Date;
  action:    string;
  bankDesc:  string | null;
  reason:    string | null;
  confidence: number | null;
};

function drawAuditHeader(doc: PDFKit.PDFDocument, y: number): number {
  doc.rect(40, y, doc.page.width - 80, 20).fill("#F1F5F9");
  const cols = [
    { label: "Fecha evento",  x: 46,  w: 80  },
    { label: "Acción",        x: 130, w: 100 },
    { label: "Movimiento",    x: 234, w: 170 },
    { label: "Confianza",     x: 408, w: 52  },
    { label: "Motivo",        x: 464, w: 80  },
  ];
  cols.forEach(c => {
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#475569")
      .text(c.label, c.x, y + 6, { width: c.w, lineBreak: false });
  });
  return y + 20;
}

function drawAuditRow(doc: PDFKit.PDFDocument, r: AuditRow, y: number, idx: number): number {
  const h = 22;
  doc.rect(40, y, doc.page.width - 80, h).fill(idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC");

  const actionColor =
    r.action === "MATCH_CONFIRMED" ? "#166534"
    : r.action === "MATCH_REJECTED" ? "#991B1B"
    : "#92400E";

  const cols = [
    { text: fmtDateTime(r.createdAt),    x: 46,  w: 80,  color: "#374151"     },
    { text: r.action,                    x: 130, w: 100, color: actionColor    },
    { text: truncate(r.bankDesc ?? "—"), x: 234, w: 170, color: "#111827"     },
    { text: fmtPct(r.confidence),        x: 408, w: 52,  color: "#374151"     },
    { text: truncate(r.reason ?? "—", 22), x: 464, w: 80, color: "#64748B"   },
  ];
  cols.forEach(c => {
    doc.font("Helvetica").fontSize(7).fillColor(c.color)
      .text(c.text, c.x, y + 7, { width: c.w, lineBreak: false });
  });
  doc.moveTo(40, y + h).lineTo(doc.page.width - 40, y + h).strokeColor("#F1F5F9").stroke();
  doc.fillColor("#111827");
  return y + h;
}

// ── Route ─────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const userId = auth.user.id;

    // ── Fetch data in parallel ──
    const [
      totalBankMovements, pending, matched, ignored, review,
      matchedMovements, auditLogs,
    ] = await Promise.all([
      prisma.bankMovement.count({ where: { userId } }),
      prisma.bankMovement.count({ where: { userId, status: "IMPORTED" } }),
      prisma.bankMovement.count({ where: { userId, status: "MATCHED" } }),
      prisma.bankMovement.count({ where: { userId, status: "IGNORED" } }),
      prisma.bankMovement.count({ where: { userId, status: "REVIEW" } }),
      prisma.bankMovement.findMany({
        where:   { userId, status: "MATCHED" },
        orderBy: { occurredAt: "desc" },
        take:    500,
      }),
      prisma.bankReconciliationAuditLog.findMany({
        where:   { userId },
        orderBy: { createdAt: "desc" },
        take:    500,
      }),
    ]);

    // Join portfolio movements for matched
    const portfolioIds = matchedMovements
      .map(m => m.matchedPortfolioMovementId)
      .filter((id): id is string => id !== null);

    const portfolioMovements = portfolioIds.length > 0
      ? await prisma.portfolioMovement.findMany({ where: { id: { in: portfolioIds } } })
      : [];

    const portfolioById = new Map(portfolioMovements.map(p => [p.id, p]));

    // Enrich audit logs with bank movement descriptions
    const auditBankIds = [...new Set(auditLogs.map(l => l.bankMovementId))];
    const auditBankMovements = await prisma.bankMovement.findMany({
      where: { id: { in: auditBankIds } },
      select: { id: true, description: true },
    });
    const auditBankById = new Map(auditBankMovements.map(m => [m.id, m]));

    // ── Build PDF ──────────────────────────────────────────────────────────────
    const doc = new PDFDocument({
      size: "A4", margin: 40, bufferPages: true,
      info: { Title: "LEDGERA - Reporte de conciliación", Author: "LEDGERA" },
    });

    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      let pageNumber = 1;

      const newPage = () => {
        doc.addPage();
        pageNumber++;
        drawHeader(doc);
        return PAGE_TOP_Y;
      };

      const checkPage = (y: number, needed = 30): number => {
        if (y + needed > CONTENT_BOTTOM) return newPage();
        return y;
      };

      drawHeader(doc);
      let y = PAGE_TOP_Y;

      // ── Resumen ──────────────────────────────────────────────────────────────
      y = drawSectionTitle(doc, "Resumen de conciliación", y);

      const cardW = 96;
      const gap   = 8;
      const cards: [string, string][] = [
        ["Total banco",  String(totalBankMovements)],
        ["Pendientes",   String(pending)],
        ["Conciliados",  String(matched)],
        ["Ignorados",    String(ignored)],
        ["En revisión",  String(review)],
      ];
      cards.forEach(([label, value], i) => {
        drawSummaryCard(doc, label, value, 40 + i * (cardW + gap), y, cardW);
      });

      y += 62;

      // ── Detalle conciliados ───────────────────────────────────────────────────
      y = checkPage(y, 50);
      y = drawSectionTitle(doc, `Conciliados (${matchedMovements.length})`, y);

      if (matchedMovements.length === 0) {
        doc.font("Helvetica").fontSize(8).fillColor("#94A3B8").text("Sin conciliaciones confirmadas.", 40, y);
        y += 20;
      } else {
        y = drawMatchedHeader(doc, y);
        matchedMovements.forEach((m, idx) => {
          y = checkPage(y, 22);
          const p = m.matchedPortfolioMovementId
            ? (portfolioById.get(m.matchedPortfolioMovementId) ?? null)
            : null;
          y = drawMatchedRow(doc, {
            bankName:   m.bankName,
            occurredAt: m.occurredAt,
            description: m.description,
            amountClp:   m.amountClp,
            direction:   m.direction,
            cryptoDate:  p?.executedAt ?? null,
            cryptoType:  p?.type ?? null,
            symbol:      p?.symbol ?? null,
            quantity:    p?.quantity ?? null,
            priceUsd:    p?.priceUsd ?? null,
            confidence:  m.matchedConfidence,
            reason:      m.matchedReason,
            matchedAt:   m.matchedAt,
          }, y, idx);
        });
        y += 8;
      }

      // ── Auditoría ─────────────────────────────────────────────────────────────
      y = checkPage(y, 50);
      y = drawSectionTitle(doc, `Auditoría de decisiones (${auditLogs.length})`, y);

      if (auditLogs.length === 0) {
        doc.font("Helvetica").fontSize(8).fillColor("#94A3B8").text("Sin eventos de auditoría.", 40, y);
        y += 20;
      } else {
        y = drawAuditHeader(doc, y);
        auditLogs.forEach((l, idx) => {
          y = checkPage(y, 22);
          y = drawAuditRow(doc, {
            createdAt:  l.createdAt,
            action:     l.action,
            bankDesc:   auditBankById.get(l.bankMovementId)?.description ?? null,
            reason:     l.reason,
            confidence: l.confidence,
          }, y, idx);
        });
      }

      // ── Finalizar páginas ─────────────────────────────────────────────────────
      const range = doc.bufferedPageRange();
      const total = range.count;
      for (let i = 0; i < total; i++) {
        doc.switchToPage(range.start + i);
        drawFooter(doc, i + 1, total);
      }

      doc.end();
    });

    const today = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="ledgera-conciliacion-${today}.pdf"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
