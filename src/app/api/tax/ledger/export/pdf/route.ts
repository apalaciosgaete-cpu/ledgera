import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import { prisma } from "@/lib/prisma";
import { requireFeature } from "@/modules/subscription/application/requireFeature";
import { Feature } from "@/modules/subscription/domain/planFeatures";
import PDFDocument from "pdfkit";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveYear(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 2009 && parsed <= 2100 ? parsed : undefined;
}

function clpFormat(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

function dateFormat(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function siiLabel(cls: string): string {
  if (cls === "MAYOR_VALOR") return "Mayor Valor";
  if (cls === "MENOR_VALOR") return "Menor Valor";
  return "Neutro";
}

function buildPdf(params: {
  email: string;
  taxYear: number | null;
  entries: Array<{
    taxYear: number;
    taxMonth: number;
    executedAt: string | null;
    assetSymbol: string;
    proceedsClp: number;
    costBasisClp: number;
    realizedGainClp: number;
    siiClassification: string;
    source: string;
  }>;
  totals: { proceedsClp: number; costBasisClp: number; realizedGainClp: number };
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50, autoFirstPage: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end",  ()         => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W    = 495; // content width (595 - 50*2)
    const LEFT = 50;
    const NAVY = "#0F2A3D";
    const GRAY = "#64748B";
    const LINE = "#E2E8F0";

    // ── Cover header ────────────────────────────────────────────────────────
    doc.rect(LEFT, 50, W, 80).fill(NAVY);
    doc.fillColor("#FFFFFF")
      .font("Helvetica-Bold").fontSize(16)
      .text("LIBRO TRIBUTARIO DE CRIPTOACTIVOS", LEFT, 68, { width: W, align: "center" });
    doc.font("Helvetica").fontSize(10)
      .text("República de Chile — Servicio de Impuestos Internos", LEFT, 92, { width: W, align: "center" });
    doc.fontSize(12).font("Helvetica-Bold")
      .text(
        params.taxYear ? `Período Tributario ${params.taxYear}` : "Todos los períodos",
        LEFT, 110, { width: W, align: "center" },
      );

    // ── Contributor info ────────────────────────────────────────────────────
    doc.moveDown(4);
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9).text("CONTRIBUYENTE");
    doc.fillColor(GRAY).font("Helvetica").fontSize(9).text(params.email);

    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9).text("GENERADO POR", { continued: false });
    doc.fillColor(GRAY).font("Helvetica").fontSize(9)
      .text(`LEDGERA — ${new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })}`);

    doc.moveDown(1);
    doc.moveTo(LEFT, doc.y).lineTo(LEFT + W, doc.y).strokeColor(LINE).lineWidth(1).stroke();

    // ── Summary ─────────────────────────────────────────────────────────────
    doc.moveDown(1);
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11).text("RESUMEN DEL PERÍODO");
    doc.moveDown(0.5);

    const summaryRows = [
      ["Total ingresos por enajenación:", clpFormat(params.totals.proceedsClp)],
      ["Costo tributario total (FIFO):",  clpFormat(params.totals.costBasisClp)],
      ["Mayor valor neto del período:",   clpFormat(params.totals.realizedGainClp)],
      ["Número de operaciones:",          params.entries.length.toString()],
    ];

    for (const [label, value] of summaryRows) {
      const y = doc.y;
      doc.fillColor(GRAY).font("Helvetica").fontSize(9).text(label, LEFT, y);
      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9).text(value, LEFT + 220, y);
      doc.moveDown(0.6);
    }

    doc.moveDown(0.5);
    doc.moveTo(LEFT, doc.y).lineTo(LEFT + W, doc.y).strokeColor(LINE).lineWidth(1).stroke();
    doc.moveDown(1);

    // ── Table ───────────────────────────────────────────────────────────────
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11).text("DETALLE DE ENAJENACIONES");
    doc.moveDown(0.5);

    // Column definitions [label, x, width, align]
    const COLS: Array<[string, number, number, "left" | "right"]> = [
      ["Fecha",           LEFT,       60,  "left"],
      ["Activo",          LEFT + 60,  40,  "left"],
      ["Ingresos CLP",    LEFT + 100, 105, "right"],
      ["Costo CLP",       LEFT + 205, 100, "right"],
      ["Mayor Valor CLP", LEFT + 305, 105, "right"],
      ["SII",             LEFT + 410, 85,  "left"],
    ];

    const drawTableHeader = () => {
      const y = doc.y;
      doc.rect(LEFT, y, W, 18).fill("#F1F5F9");
      for (const [label, x, w, align] of COLS) {
        doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(7.5)
          .text(label, x + 2, y + 5, { width: w - 4, align });
      }
      doc.y = y + 20;
    };

    const drawRow = (
      row: typeof params.entries[number],
      idx: number,
    ) => {
      const y = doc.y;
      const rowH = 16;

      if (y + rowH > 780) {
        doc.addPage();
        drawTableHeader();
        return;
      }

      if (idx % 2 === 0) {
        doc.rect(LEFT, y, W, rowH).fill("#F8FAFC");
      }

      const gainColor = row.realizedGainClp >= 0 ? "#15803D" : "#B91C1C";
      const values: Array<[number, number, string, "left" | "right"]> = [
        [COLS[0][1], COLS[0][2], dateFormat(row.executedAt),             "left"],
        [COLS[1][1], COLS[1][2], row.assetSymbol,                        "left"],
        [COLS[2][1], COLS[2][2], clpFormat(row.proceedsClp),             "right"],
        [COLS[3][1], COLS[3][2], clpFormat(row.costBasisClp),            "right"],
        [COLS[4][1], COLS[4][2], clpFormat(row.realizedGainClp),         "right"],
        [COLS[5][1], COLS[5][2], siiLabel(row.siiClassification),        "left"],
      ];

      for (const [x, w, text, align] of values) {
        const isGain = x === COLS[4][1];
        doc.fillColor(isGain ? gainColor : GRAY)
          .font(isGain ? "Helvetica-Bold" : "Helvetica")
          .fontSize(7.5)
          .text(text, x + 2, y + 4, { width: w - 4, align });
      }

      // Row divider
      doc.moveTo(LEFT, y + rowH).lineTo(LEFT + W, y + rowH)
        .strokeColor("#EFF3F8").lineWidth(0.5).stroke();
      doc.y = y + rowH;
    };

    drawTableHeader();

    params.entries.forEach((row, i) => drawRow(row, i));

    // ── Footer on current page ───────────────────────────────────────────────
    const addFooter = (pageNum: number) => {
      doc.fillColor(GRAY).font("Helvetica").fontSize(7.5)
        .text(
          `Generado por LEDGERA | Método FIFO | Tipo de cambio: mindicador.cl | Pág. ${pageNum}`,
          LEFT, 820, { width: W, align: "center" },
        );
    };

    addFooter(1);

    // ── Legal note ───────────────────────────────────────────────────────────
    doc.moveDown(2);
    doc.moveTo(LEFT, doc.y).lineTo(LEFT + W, doc.y).strokeColor(LINE).lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.fillColor(GRAY).font("Helvetica").fontSize(7)
      .text(
        "Los valores presentados son estimaciones calculadas automáticamente mediante el método FIFO. " +
        "Este documento no constituye asesoría tributaria profesional. " +
        "Consulte a un contador o asesor tributario habilitado ante el SII antes de presentar su declaración.",
        LEFT, doc.y, { width: W, align: "left" },
      );

    doc.end();
  });
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth || auth instanceof NextResponse) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const currentUser = await getUserById(auth.user.id);
  if (!currentUser) {
    return NextResponse.json({ ok: false, message: "Usuario no encontrado." }, { status: 404 });
  }

  const featureCheck = requireFeature(currentUser, Feature.PDF_EXPORT);
  if (!featureCheck.ok) {
    return featureCheck.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const taxYear = resolveYear(searchParams.get("year"));

    const rawEntries = await prisma.taxLedgerEntry.findMany({
      where: {
        userId: auth.user.id,
        ...(taxYear ? { taxYear } : {}),
      },
      include: { taxEvent: { select: { executedAt: true } } },
      orderBy: [{ taxYear: "asc" }, { taxMonth: "asc" }, { createdAt: "asc" }],
    });

    const entries = rawEntries.map((e) => ({
      taxYear:           e.taxYear,
      taxMonth:          e.taxMonth,
      executedAt:        e.taxEvent?.executedAt?.toISOString() ?? null,
      assetSymbol:       e.assetSymbol,
      proceedsClp:       e.proceedsClp,
      costBasisClp:      e.costBasisClp,
      realizedGainClp:   e.realizedGainClp,
      siiClassification: e.siiClassification,
      source:            e.source,
    }));

    const totals = entries.reduce(
      (acc, e) => ({
        proceedsClp:    acc.proceedsClp    + e.proceedsClp,
        costBasisClp:   acc.costBasisClp   + e.costBasisClp,
        realizedGainClp: acc.realizedGainClp + e.realizedGainClp,
      }),
      { proceedsClp: 0, costBasisClp: 0, realizedGainClp: 0 },
    );

    const pdfBuffer = await buildPdf({
      email:   auth.user.email,
      taxYear: taxYear ?? null,
      entries,
      totals,
    });

    const filename = taxYear
      ? `libro-tributario-${taxYear}.pdf`
      : "libro-tributario.pdf";

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control":       "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[ledger/export/pdf]", error);
    return new NextResponse("Error al generar PDF", { status: 500 });
  }
}
