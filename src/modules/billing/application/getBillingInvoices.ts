import { prisma } from "@/lib/prisma";

type BillingInvoiceRow = {
  id: string;
  invoice_number: string;
  status: string;
  currency: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  provider: string | null;
  provider_invoice_id: string | null;
  pdf_url: string | null;
  xml_url: string | null;
  issued_at: Date | null;
  paid_at: Date | null;
  voided_at: Date | null;
  created_at: Date;
};

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function getBillingInvoices(userId: string) {
  const rows = await prisma.$queryRaw<BillingInvoiceRow[]>`
    SELECT
      id,
      invoice_number,
      status,
      currency,
      subtotal_amount,
      tax_amount,
      total_amount,
      provider,
      provider_invoice_id,
      pdf_url,
      xml_url,
      issued_at,
      paid_at,
      voided_at,
      created_at
    FROM billing_invoices
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  console.info("[commercial]", {
    event: "billing_invoices_viewed",
    userId,
    invoiceCount: rows.length,
    occurredAt: new Date().toISOString(),
  });

  return rows.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    status: invoice.status,
    currency: invoice.currency,
    subtotalAmount: invoice.subtotal_amount,
    taxAmount: invoice.tax_amount,
    totalAmount: invoice.total_amount,
    provider: invoice.provider,
    providerInvoiceId: invoice.provider_invoice_id,
    pdfUrl: invoice.pdf_url,
    xmlUrl: invoice.xml_url,
    issuedAt: toIso(invoice.issued_at),
    paidAt: toIso(invoice.paid_at),
    voidedAt: toIso(invoice.voided_at),
    createdAt: invoice.created_at.toISOString(),
  }));
}
