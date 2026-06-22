import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, serverError } from "@/shared/apiResponse";
import {
  createBankReconciliationValidation,
  hashReportContent,
} from "@/modules/banking/application/createBankReconciliationValidation";

export const runtime     = "nodejs";
export const dynamic     = "force-dynamic";
export const maxDuration = 60;

function formatClp(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-CL");
}

function writeLine(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
  doc.font("Helvetica").text(value);
}

async function buildPdf(userId: string): Promise<Buffer> {
  // ── Fetch data ──────────────────────────────────────────────────────────────
  const [total, matched, pending, ignored, review, matchedMovements] = await Promise.all([
    prisma.bankMovement.count({ where: { userId } }),
    prisma.bankMovement.count({ where: { userId, status: "MATCHED" } }),
    prisma.bankMovement.count({ where: { userId, status: "IMPORTED" } }),
    prisma.bankMovement.count({ where: { userId, status: "IGNORED" } }),
    prisma.bankMovement.count({ where: { userId, status: "REVIEW" } }),
    prisma.bankMovement.findMany({
      where:   { userId, status: "MATCHED", matchedPortfolioMovementId: { not: null } },
      orderBy: { occurredAt: "desc" },
      take:    200,
    }),
  ]);

  const portfolioIds = matchedMovements
    .map((m) => m.matchedPortfolioMovementId)
    .filter((id): id is string => Boolean(id));

  const portfolioMovements = portfolioIds.length > 0
    ? await prisma.portfolioMovement.findMany({
        where: { userId, id: { in: portfolioIds }, deletedAt: null },
      })
    : [];

  const portfolioById = new Map(portfolioMovements.map((m) => [m.id, m]));

  // ── Build auditable payload ─────────────────────────────────────────────────
  const auditPayload = JSON.stringify({
    generatedAt: new Date().toISOString(),
    summary: { total, matched, pending, ignored, review },
    matchedMovements: matchedMovements.map((bank) => ({
      id:                         bank.id,
      occurredAt:                 bank.occurredAt.toISOString(),
      bankName:                   bank.bankName,
      description:                bank.description,
      amountClp:                  bank.amountClp,
      matchedPortfolioMovementId: bank.matchedPortfolioMovementId,
      matchedConfidence:          bank.matchedConfidence,
      matchedReason:              bank.matchedReason,
      matchedAt:                  bank.matchedAt?.toISOString() ?? null,
    })),
  });

  // ── Hash + persist validation ───────────────────────────────────────────────
  const contentHash = hashReportContent(auditPayload);

  const validation = await createBankReconciliationValidation({
    userId,
    contentHash,
    metadata: { total, matched, pending, ignored, review },
  });

  // ── Generate PDF ────────────────────────────────────────────────────────────
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(18).text("LEDGERA", { align: "left" });
    doc.moveDown(0.4);
    doc.fontSize(14).text("Reporte de conciliación financiera");
    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(9).fillColor("#444");
    doc.text(`Generado: ${new Date().toLocaleString("es-CL")}`);
    doc.moveDown();

    doc.fillColor("#000").font("Helvetica-Bold").fontSize(12).text("Resumen");
    doc.moveDown(0.4);
    doc.fontSize(10);
    writeLine(doc, "Movimientos bancarios", String(total));
    writeLine(doc, "Conciliados",           String(matched));
    writeLine(doc, "Pendientes",            String(pending));
    writeLine(doc, "Ignorados",             String(ignored));
    writeLine(doc, "Revisión",              String(review));

    doc.moveDown();
    doc.font("Helvetica-Bold").fontSize(12).text("Detalle de conciliaciones");
    doc.moveDown(0.5);

    if (matchedMovements.length === 0) {
      doc.font("Helvetica").fontSize(10).text("No existen conciliaciones confirmadas.");
    }

    for (const bank of matchedMovements) {
      const crypto = bank.matchedPortfolioMovementId
        ? portfolioById.get(bank.matchedPortfolioMovementId)
        : null;

      if (doc.y > 700) doc.addPage();

      doc.font("Helvetica-Bold").fontSize(10).fillColor("#000");
      doc.text(`${formatDate(bank.occurredAt)} · ${bank.bankName ?? "Banco"} · ${formatClp(bank.amountClp)}`);

      doc.font("Helvetica").fontSize(9).fillColor("#333");
      doc.text(bank.description);

      if (crypto) {
        doc.text(
          `Crypto: ${crypto.type} ${crypto.symbol} · ${crypto.quantity} · USD ${crypto.priceUsd.toFixed(2)} · ${crypto.source ?? "Sin origen"}`,
        );
      } else {
        doc.text("Crypto: movimiento asociado no encontrado.");
      }

      doc.text(`Confianza: ${bank.matchedConfidence !== null ? `${Math.round((bank.matchedConfidence ?? 0) * 100)}%` : "—"}`);
      doc.text(`Motivo: ${bank.matchedReason ?? "—"}`);
      doc.text(`Conciliado: ${formatDate(bank.matchedAt)}`);
      doc.moveDown(0.8);
    }

    // ── Footer de verificación ────────────────────────────────────────────────
    doc.moveDown();

    if (doc.y > 700) doc.addPage();

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#000").text("Verificación del documento");
    doc.font("Helvetica").fontSize(8).fillColor("#444");

    doc.text(`Código de verificación: ${validation.validationCode}`);
    doc.text(`Hash SHA-256: ${contentHash}`);
    doc.text(`URL de verificación: https://ledgera.cl/verify/bank-reconciliation/${validation.validationCode}`);

    doc.end();
  });
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const pdf = await buildPdf(auth.user.id);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": 'attachment; filename="ledgera-conciliacion-financiera.pdf"',
        "Cache-Control":       "no-store",
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
