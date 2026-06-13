import {
  buildDteLineItem,
  buildDteXmlPlaceholder,
  calculateDteAmounts,
  resolveDteDocumentType,
  type TaxDocumentDraft,
} from "@/modules/tax/domain/dte";
import { getTaxProfileByUserId } from "@/modules/tax/infrastructure/taxProfileRepository";
import { createTaxDocumentDraft as persistTaxDocumentDraft } from "@/modules/tax/infrastructure/taxDocumentRepository";

const DEFAULT_ISSUER = {
  rut: process.env.LEDGERA_ISSUER_RUT ?? "76999999-9",
  legalName: process.env.LEDGERA_ISSUER_LEGAL_NAME ?? "LEDGERA SpA",
  businessActivity:
    process.env.LEDGERA_ISSUER_BUSINESS_ACTIVITY ?? "Servicios informaticos y tributarios",
  address: process.env.LEDGERA_ISSUER_ADDRESS ?? "Direccion comercial pendiente",
  commune: process.env.LEDGERA_ISSUER_COMMUNE ?? "Santiago",
  city: process.env.LEDGERA_ISSUER_CITY ?? "Santiago",
};

export async function createTaxDocumentDraft(input: {
  userId: string;
  paymentId?: string | null;
  subscriptionId?: string | null;
  description: string;
  grossAmount: number;
  discountAmount?: number;
  taxExempt?: boolean;
}) {
  const profile = await getTaxProfileByUserId(input.userId);

  if (!profile?.isValidated) {
    return {
      ok: false as const,
      message: "No existe una identidad tributaria validada para emitir documento.",
      data: null,
    };
  }

  const lineItem = buildDteLineItem({
    name: input.description,
    grossAmount: input.grossAmount,
    discountAmount: input.discountAmount,
    taxExempt: input.taxExempt,
  });
  const amounts = calculateDteAmounts({
    grossAmount: input.grossAmount,
    discountAmount: input.discountAmount,
    taxExempt: input.taxExempt,
  });

  const draft: TaxDocumentDraft = {
    userId: input.userId,
    paymentId: input.paymentId ?? null,
    subscriptionId: input.subscriptionId ?? null,
    documentType: resolveDteDocumentType(profile.documentType),
    status: "DRAFT",
    issuer: DEFAULT_ISSUER,
    receiver: {
      rut: profile.rut,
      legalName: profile.legalName,
      businessActivity: profile.businessActivity,
      address: profile.address,
      commune: profile.commune,
      city: profile.city,
      dteEmail: profile.dteEmail,
    },
    lineItems: [lineItem],
    amounts,
  };

  draft.xmlPayload = buildDteXmlPlaceholder(draft);

  const saved = await persistTaxDocumentDraft(draft);

  console.info("[tax]", {
    event: "tax_document_draft_created",
    userId: input.userId,
    documentType: draft.documentType,
    totalAmount: draft.amounts.totalAmount,
    paymentId: input.paymentId ?? null,
    subscriptionId: input.subscriptionId ?? null,
  });

  return {
    ok: true as const,
    message: "Documento tributario en borrador creado.",
    data: saved,
  };
}
