import { createHash } from "crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

import { prisma } from "@/lib/prisma";
import { buildUserScopeWhere, type AccessPolicyUser } from "@/modules/identity/domain/accessPolicy";

type F22Code = "1032" | "1865";

type F22CodeSummary = {
  code: F22Code;
  concept: string;
  eventCount: number;
  netResultClp: number;
  proposedAmountClp: number;
};

type ExtractEvent = {
  id: string;
  movementId: string;
  effectiveTaxCategory: string;
  realizedPnlClp: number;
};

export type F22CryptoExtractPayload = {
  generatedAt: string;
  userEmail: string;
  commercialYear: number;
  taxYear: number;
  code1032: F22CodeSummary;
  code1865: F22CodeSummary;
  pendingClassificationEvents: number;
  totalTaxEvents: number;
  verification: {
    folio: string;
    hash: string;
    url: string;
  };
};

export function parseF22CommercialYear(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 2009 || parsed > 2100) return null;
  return parsed;
}

function formatClp(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function getVerificationBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://ledgera.cl").replace(/\/$/, "");
}

function codeForCategory(category: string): F22Code | null {
  const normalized = String(category || "").trim().toUpperCase();
  if (normalized === "CAPITAL_GAIN") return "1032";
  if (normalized === "ORDINARY_INCOME" || normalized === "ORDINARY_INCOME_MINING") return "1865";
  return null;
}

function summarizeCode(events: ExtractEvent[], code: F22Code): F22CodeSummary {
  const selected = events.filter((event) => codeForCategory(event.effectiveTaxCategory) === code);
  const netResultClp = selected.reduce((sum, event) => sum + Number(event.realizedPnlClp || 0), 0);

  return {
    code,
    concept: code === "1032"
      ? "Otras rentas de fuente chilena afectas al IGC o IA"
      : "Otras rentas",
    eventCount: selected.length,
    netResultClp,
    proposedAmountClp: Math.max(0, netResultClp),
  };
}

function buildVerificationData(input: Omit<F22CryptoExtractPayload, "verification">, events: ExtractEvent[]) {
  const tracePayload = {
    userEmail: input.userEmail,
    commercialYear: input.commercialYear,
    taxYear: input.taxYear,
    code1032: input.code1032,
    code1865: input.code1865,
    pendingClassificationEvents: input.pendingClassificationEvents,
    totalTaxEvents: input.totalTaxEvents,
    events: events.map((event) => ({
      id: event.id,
      movementId: event.movementId,
      category: event.effectiveTaxCategory,
      realizedPnlClp: Number(event.realizedPnlClp || 0),
    })),
  };
  const hash = createHash("sha256").update(JSON.stringify(tracePayload)).digest("hex");
  const folio = `LED-F22-AT${input.taxYear}-${hash.slice(0, 10).toUpperCase()}`;
  const search = new URLSearchParams({
    folio,
    hash,
    year: `AT ${input.taxYear}`,
  });

  return {
    folio,
    hash,
    url: `${getVerificationBaseUrl()}/verify/report?${search.toString()}`,
  };
}

export async function buildF22CryptoExtractPayload(input: {
  user: AccessPolicyUser;
  commercialYear: number;
}): Promise<F22CryptoExtractPayload> {
  const start = new Date(`${input.commercialYear}-01-01T00:00:00.000Z`);
  const end = new Date(`${input.commercialYear + 1}-01-01T00:00:00.000Z`);

  const rawEvents = await prisma.taxEvent.findMany({
    where: {
      ...buildUserScopeWhere(input.user),
      executedAt: { gte: start, lt: end },
    },
    orderBy: [{ executedAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      movementId: true,
      effectiveTaxCategory: true,
      realizedPnlClp: true,
    },
  });

  const events: ExtractEvent[] = rawEvents.map((event) => ({
    id: event.id,
    movementId: event.movementId,
    effectiveTaxCategory: event.effectiveTaxCategory,
    realizedPnlClp: Number(event.realizedPnlClp || 0),
  }));
  const taxYear = input.commercialYear + 1;
  const code1032 = summarizeCode(events, "1032");
  const code1865 = summarizeCode(events, "1865");
  const pendingClassificationEvents = events.filter((event) => codeForCategory(event.effectiveTaxCategory) === null).length;

  const payloadWithoutVerification: Omit<F22CryptoExtractPayload, "verification"> = {
    generatedAt: new Date().toISOString(),
    userEmail: input.user.email,
    commercialYear: input.commercialYear,
    taxYear,
    code1032,
    code1865,
    pendingClassificationEvents,
    totalTaxEvents: events.length,
  };

  return {
    ...payloadWithoutVerification,
    verification: buildVerificationData(payloadWithoutVerification, events),
  };
}

function drawCodeRow(doc: PDFKit.PDFDocument, input: {
  y: number;
  summary: F22CodeSummary;
  note: string;
}) {
  const left = 48;
  const width = doc.page.width - 96;
  const codeWidth = 76;
  const amountWidth = 132;
  const conceptX = left + codeWidth;
  const amountX = left + width - amountWidth;
  const rowHeight = 78;

  doc.roundedRect(left, input.y, width, rowHeight, 10).fillAndStroke("#F8FAFC", "#CBD5E1");
  doc.roundedRect(left + 10, input.y + 12, codeWidth - 20, 32, 7).fill("#0F766E");
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#FFFFFF")
    .text(input.summary.code, left + 10, input.y + 21, { width: codeWidth - 20, align: "center" });

  doc.font("Helvetica-Bold").fontSize(9.4).fillColor("#0F2A3D")
    .text(input.summary.concept, conceptX + 10, input.y + 12, { width: amountX - conceptX - 20 });
  doc.font("Helvetica").fontSize(7.4).fillColor("#64748B")
    .text(input.note, conceptX + 10, input.y + 35, { width: amountX - conceptX - 20, lineGap: 1 });

  doc.font("Helvetica").fontSize(7.2).fillColor("#64748B")
    .text("MONTO REFERENCIAL", amountX, input.y + 13, { width: amountWidth - 12, align: "right" });
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#0F2A3D")
    .text(formatClp(input.summary.proposedAmountClp), amountX, input.y + 29, { width: amountWidth - 12, align: "right" });
  doc.font("Helvetica").fontSize(7.2).fillColor("#64748B")
    .text(`${input.summary.eventCount} evento(s)`, amountX, input.y + 51, { width: amountWidth - 12, align: "right" });
}

export async function renderF22CryptoExtractPdf(payload: F22CryptoExtractPayload): Promise<Buffer> {
  const qrDataUrl = await QRCode.toDataURL(payload.verification.url, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 160,
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1] ?? "", "base64");

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 96;

    doc.font("Helvetica-Bold").fontSize(22).fillColor("#071B28").text("LEDGERA", 48, 48);
    doc.font("Helvetica").fontSize(8).fillColor("#0F766E")
      .text("Sistema Operativo Financiero y Tributario", 48, 74);

    doc.font("Helvetica").fontSize(8).fillColor("#475569")
      .text(`Usuario: ${payload.userEmail}`, 300, 50, { width: 247, align: "right" })
      .text(`Generado: ${new Date(payload.generatedAt).toLocaleString("es-CL")}`, 300, 64, { width: 247, align: "right" });

    doc.font("Helvetica-Bold").fontSize(19).fillColor("#0F2A3D")
      .text("Extracto F22 para criptoactivos", 48, 112, { width: contentWidth });
    doc.font("Helvetica").fontSize(10).fillColor("#475569")
      .text("Montos referenciales para los códigos 1032 y 1865", 48, 140, { width: contentWidth });

    doc.roundedRect(48, 166, contentWidth, 38, 8).fill("#FFF7ED");
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#9A3412")
      .text("DOCUMENTO DE PREPARACIÓN · NO PRESENTADO NI ACEPTADO POR EL SII", 60, 180, { width: contentWidth - 24, align: "center" });

    doc.roundedRect(48, 220, contentWidth, 58, 10).fillAndStroke("#ECFDF5", "#A7F3D0");
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#065F46")
      .text(`Año Tributario ${payload.taxYear}`, 62, 234, { width: 210 });
    doc.font("Helvetica").fontSize(8.5).fillColor("#047857")
      .text(`Operaciones del año comercial ${payload.commercialYear}: 1 ene ${payload.commercialYear} – 31 dic ${payload.commercialYear}`, 62, 252, { width: contentWidth - 28 });

    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0F766E")
      .text("BASE IMPONIBLE REFERENCIAL PARA IGC O IA", 48, 302, { width: contentWidth });

    doc.roundedRect(48, 320, contentWidth, 44, 8).fillAndStroke("#F8FAFC", "#E2E8F0");
    doc.font("Helvetica-Bold").fontSize(7.8).fillColor("#0F2A3D")
      .text("IGC:", 60, 330, { continued: true })
      .font("Helvetica")
      .text(" aplica generalmente a personas naturales con domicilio o residencia en Chile.");
    doc.font("Helvetica-Bold").fontSize(7.8).fillColor("#0F2A3D")
      .text("IA:", 60, 346, { continued: true })
      .font("Helvetica")
      .text(" aplica a contribuyentes sin domicilio ni residencia en Chile.");

    drawCodeRow(doc, {
      y: 380,
      summary: payload.code1032,
      note: "Asignación preliminar para mayor valor clasificado como ganancia de capital. Requiere confirmar letra m) del art. 17 N° 8 LIR y contraparte no relacionada.",
    });
    drawCodeRow(doc, {
      y: 470,
      summary: payload.code1865,
      note: "Asignación preliminar para operaciones clasificadas como otras rentas cuando no corresponde el tratamiento referencial del código 1032.",
    });

    doc.roundedRect(48, 564, contentWidth, 66, 10).fillAndStroke("#F8FAFC", "#E2E8F0");
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#0F2A3D")
      .text("Control de integridad", 60, 576);
    doc.font("Helvetica").fontSize(8).fillColor("#475569")
      .text(`Eventos tributarios incluidos: ${payload.totalTaxEvents}`, 60, 594)
      .text(`Eventos pendientes de clasificación: ${payload.pendingClassificationEvents}`, 60, 608);
    doc.font("Helvetica").fontSize(7.6).fillColor("#64748B")
      .text("Los montos propuestos muestran el resultado neto positivo por código. Un resultado neto negativo se conserva en el respaldo y se presenta como $0 en esta hoja referencial.", 275, 584, { width: 258, lineGap: 2 });

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#0F2A3D")
      .text("Criterio de uso", 48, 654, { width: contentWidth });
    doc.font("Helvetica").fontSize(8).fillColor("#475569")
      .text("Esta hoja no reemplaza el Formulario 22. La asignación entre 1032 y 1865 debe revisarse con el perfil del contribuyente, la relación con la contraparte y los demás antecedentes del año tributario.", 48, 671, { width: contentWidth, lineGap: 2 });

    doc.moveTo(48, 715).lineTo(pageWidth - 48, 715).strokeColor("#E2E8F0").stroke();
    doc.image(qrBuffer, 48, 730, { width: 68, height: 68 });
    doc.link(48, 730, 68, 68, payload.verification.url);
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#0F766E")
      .text("Verificación de trazabilidad", 132, 732, { width: 200 });
    doc.font("Helvetica").fontSize(7.2).fillColor("#475569")
      .text(`Folio: ${payload.verification.folio}`, 132, 749, { width: 400 })
      .text(`Hash: ${payload.verification.hash}`, 132, 764, { width: 400 })
      .text("Escanee el QR y compare el folio y hash impresos.", 132, 782, { width: 400 });

    doc.end();
  });
}
