import { prisma } from "@/lib/prisma";
import type { TaxDocumentDraft } from "@/modules/tax/domain/dte";

type TaxDocumentRow = {
  id: string;
  user_id: string;
  payment_id: string | null;
  subscription_id: string | null;
  document_type: string;
  status: string;
  folio: string | null;
  external_track_id: string | null;
  receiver_rut: string;
  receiver_legal_name: string;
  net_amount: number;
  exempt_amount: number;
  iva_amount: number;
  total_amount: number;
  xml_payload: string | null;
  pdf_url: string | null;
  created_at: Date;
  updated_at: Date;
};

export async function createTaxDocumentDraft(input: TaxDocumentDraft) {
  const id = crypto.randomUUID();
  const now = new Date();

  await prisma.$executeRaw`
    INSERT INTO tax_documents (
      id,
      user_id,
      payment_id,
      subscription_id,
      document_type,
      status,
      folio,
      external_track_id,
      issuer_rut,
      issuer_legal_name,
      issuer_business_activity,
      issuer_address,
      issuer_commune,
      issuer_city,
      receiver_rut,
      receiver_legal_name,
      receiver_business_activity,
      receiver_address,
      receiver_commune,
      receiver_city,
      receiver_dte_email,
      net_amount,
      exempt_amount,
      iva_amount,
      total_amount,
      iva_rate,
      line_items_json,
      reference_json,
      xml_payload,
      pdf_url,
      external_response,
      rejection_reason,
      created_at,
      updated_at
    ) VALUES (
      ${id},
      ${input.userId},
      ${input.paymentId ?? null},
      ${input.subscriptionId ?? null},
      ${input.documentType},
      ${input.status},
      ${input.folio ?? null},
      ${input.siiTrackId ?? null},
      ${input.issuer.rut},
      ${input.issuer.legalName},
      ${input.issuer.businessActivity},
      ${input.issuer.address},
      ${input.issuer.commune},
      ${input.issuer.city},
      ${input.receiver.rut},
      ${input.receiver.legalName},
      ${input.receiver.businessActivity ?? null},
      ${input.receiver.address},
      ${input.receiver.commune},
      ${input.receiver.city},
      ${input.receiver.dteEmail},
      ${input.amounts.netAmount},
      ${input.amounts.exemptAmount},
      ${input.amounts.ivaAmount},
      ${input.amounts.totalAmount},
      ${input.amounts.ivaRate},
      ${JSON.stringify(input.lineItems)},
      ${input.reference ? JSON.stringify(input.reference) : null},
      ${input.xmlPayload ?? null},
      ${input.pdfUrl ?? null},
      ${input.siiResponse ?? null},
      ${input.rejectionReason ?? null},
      ${now},
      ${now}
    )
  `;

  return { id, ...input, createdAt: now, updatedAt: now };
}

export async function listTaxDocumentsByUserId(userId: string) {
  const rows = await prisma.$queryRaw<TaxDocumentRow[]>`
    SELECT
      id,
      user_id,
      payment_id,
      subscription_id,
      document_type,
      status,
      folio,
      external_track_id,
      receiver_rut,
      receiver_legal_name,
      net_amount,
      exempt_amount,
      iva_amount,
      total_amount,
      xml_payload,
      pdf_url,
      created_at,
      updated_at
    FROM tax_documents
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    paymentId: row.payment_id,
    subscriptionId: row.subscription_id,
    documentType: row.document_type,
    status: row.status,
    folio: row.folio,
    trackId: row.external_track_id,
    receiverRut: row.receiver_rut,
    receiverLegalName: row.receiver_legal_name,
    netAmount: row.net_amount,
    exemptAmount: row.exempt_amount,
    ivaAmount: row.iva_amount,
    totalAmount: row.total_amount,
    hasXml: Boolean(row.xml_payload),
    pdfUrl: row.pdf_url,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }));
}
