import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export interface AuditTrailEntry {
  logType: string;
  action: string;
  createdAt: Date;
  actorEmail?: string | null;
  ipAddress?: string | null;
  beforeState?: string | null;
  afterState?: string | null;
  currentHash?: string | null;
  metadata?: string | null;
}

export interface DeclarationAuditReport {
  id: string;
  userId: string;
  taxYear: number;
  declarationType: string;
  status: string;
  contentHash: string;
  generatedAt: Date;
  confirmedAt?: Date | null;
  auditTrail: AuditTrailEntry[];
  integrityStatus: "OK" | "RISK" | "CRITICAL" | "LEGACY_UNVERIFIABLE";
  integrityIssues: number;
}

async function generateQRCode(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, { width: 200 });
}

export async function buildDeclarationAuditPdf(
  report: DeclarationAuditReport,
  verificationUrl: string,
): Promise<Buffer> {
  const doc = new PDFDocument();
  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => chunks.push(chunk));

  // Header
  doc.fontSize(20).text("DECLARACIÓN TRIBUTARIA - AUDITORÍA COMPLETA", 50, 40);
  doc.fontSize(10).text("Ledgera - Sistema de Auditoría Tributaria", 50, 65);

  // Folio
  const folio = `LEG-${report.taxYear}-${report.declarationType}-${report.id.slice(0, 8).toUpperCase()}`;
  doc.fontSize(12).text(`Folio: ${folio}`, 50, 85);
  doc.text(`Estado de integridad: ${report.integrityStatus}`, 50, 102);

  // Info general
  doc.moveDown(1).fontSize(14).text("INFORMACIÓN GENERAL", { underline: true });
  doc.fontSize(11);
  doc.text(`ID Declaración: ${report.id}`);
  doc.text(`Año Tributario: ${report.taxYear}`);
  doc.text(`Tipo: ${report.declarationType}`);
  doc.text(`Estado: ${report.status}`);
  doc.text(`Hash de Contenido: ${report.contentHash}`);
  doc.text(
    `Fecha de Generación: ${report.generatedAt.toISOString().split("T")[0]}`,
  );
  if (report.confirmedAt) {
    doc.text(
      `Fecha de Confirmación: ${report.confirmedAt.toISOString().split("T")[0]}`,
    );
  }

  // Integridad
  doc.moveDown(1).fontSize(14).text("VERIFICACIÓN DE INTEGRIDAD", { underline: true });
  doc.fontSize(10);
  if (report.integrityIssues === 0) {
    doc.text("✓ Auditoría completamente íntegra");
    doc.text("✓ Cadena de hashes verificada");
    doc.text("✓ Sin registros huérfanos detectados");
  } else {
    doc.text(`⚠ Se detectaron ${report.integrityIssues} problemas de integridad`);
  }

  // Cadena de auditoría
  if (report.auditTrail.length > 0) {
    doc.addPage().fontSize(14).text("CADENA DE AUDITORÍA", { underline: true });
    doc.fontSize(9);

    for (let i = 0; i < report.auditTrail.length; i++) {
      if (doc.y > 720) {
        doc.addPage();
      }

      const entry = report.auditTrail[i];
      const date = entry.createdAt instanceof Date
        ? entry.createdAt.toISOString().split("T")[0]
        : entry.createdAt;

      doc.text(`${i + 1}. [${date}] ${entry.action}`);
      if (entry.actorEmail) {
        doc.text(`   Actor: ${entry.actorEmail}`, 60);
      }
      if (entry.ipAddress) {
        doc.text(`   IP: ${entry.ipAddress}`, 60);
      }
      if (entry.currentHash) {
        doc.text(`   Hash: ${entry.currentHash.slice(0, 16)}...`, 60);
      }
      doc.text("");
    }

  }

  // QR y URL de verificación
  doc.addPage();
  doc.fontSize(14).text("VERIFICACIÓN PÚBLICA", { underline: true });
  doc.fontSize(10).moveDown(0.5);
  doc.text("Escanea el código QR o visita la URL para verificar esta declaración:");
  doc.moveDown(1);

  const qrBuffer = await generateQRCode(verificationUrl);
  doc.image(qrBuffer, 100, doc.y, { width: 150 });

  doc.y += 160;
  doc.fontSize(9).text(verificationUrl, { link: verificationUrl });

  // Footer
  doc.fontSize(8).text("", { align: "center" });
  doc.text(`Generado: ${new Date().toISOString()}`, { align: "center" });
  doc.text("Este documento es prueba de auditoría tributaria inmutable.", {
    align: "center",
  });

  doc.end();

  return Buffer.concat(chunks);
}
