export type DteDocumentType =
  | "BOLETA_ELECTRONICA"
  | "FACTURA_ELECTRONICA"
  | "NOTA_CREDITO"
  | "NOTA_DEBITO";

export type DteStatus =
  | "DRAFT"
  | "READY_TO_SEND"
  | "SENT_TO_SII"
  | "ACCEPTED"
  | "REJECTED"
  | "VOIDED";

export type DteReference = {
  documentId: string;
  documentType: DteDocumentType;
  folio?: string | null;
  reason: string;
};

export type DteAmounts = {
  netAmount: number;
  exemptAmount: number;
  ivaAmount: number;
  totalAmount: number;
  ivaRate: number;
};

export type DteIssuer = {
  rut: string;
  legalName: string;
  businessActivity: string;
  address: string;
  commune: string;
  city: string;
};

export type DteReceiver = {
  rut: string;
  legalName: string;
  businessActivity?: string | null;
  address: string;
  commune: string;
  city: string;
  dteEmail: string;
};

export type DteLineItem = {
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  netAmount: number;
  exemptAmount: number;
  ivaAmount: number;
  totalAmount: number;
};

export type TaxDocumentDraft = {
  userId: string;
  paymentId?: string | null;
  subscriptionId?: string | null;
  documentType: DteDocumentType;
  status: DteStatus;
  folio?: string | null;
  siiTrackId?: string | null;
  issuer: DteIssuer;
  receiver: DteReceiver;
  lineItems: DteLineItem[];
  amounts: DteAmounts;
  reference?: DteReference | null;
  xmlPayload?: string | null;
  pdfUrl?: string | null;
  siiResponse?: string | null;
  rejectionReason?: string | null;
};

export const IVA_RATE = 0.19;

export function resolveDteDocumentType(profileDocumentType: "BOLETA" | "FACTURA"): DteDocumentType {
  return profileDocumentType === "FACTURA" ? "FACTURA_ELECTRONICA" : "BOLETA_ELECTRONICA";
}

export function calculateDteAmounts(input: {
  grossAmount: number;
  discountAmount?: number;
  taxExempt?: boolean;
}): DteAmounts {
  const discountAmount = Math.max(0, Math.round(input.discountAmount ?? 0));
  const grossAfterDiscount = Math.max(0, Math.round(input.grossAmount) - discountAmount);

  if (input.taxExempt) {
    return {
      netAmount: 0,
      exemptAmount: grossAfterDiscount,
      ivaAmount: 0,
      totalAmount: grossAfterDiscount,
      ivaRate: IVA_RATE,
    };
  }

  const netAmount = Math.round(grossAfterDiscount / (1 + IVA_RATE));
  const ivaAmount = grossAfterDiscount - netAmount;

  return {
    netAmount,
    exemptAmount: 0,
    ivaAmount,
    totalAmount: grossAfterDiscount,
    ivaRate: IVA_RATE,
  };
}

export function buildDteLineItem(input: {
  name: string;
  description?: string | null;
  grossAmount: number;
  discountAmount?: number;
  taxExempt?: boolean;
}): DteLineItem {
  const amounts = calculateDteAmounts(input);

  return {
    name: input.name,
    description: input.description ?? null,
    quantity: 1,
    unitPrice: Math.round(input.grossAmount),
    discountAmount: Math.max(0, Math.round(input.discountAmount ?? 0)),
    netAmount: amounts.netAmount,
    exemptAmount: amounts.exemptAmount,
    ivaAmount: amounts.ivaAmount,
    totalAmount: amounts.totalAmount,
  };
}

export function buildDteXmlPlaceholder(document: TaxDocumentDraft): string {
  const lineItems = document.lineItems
    .map(
      (item, index) =>
        `<Detalle><NroLinDet>${index + 1}</NroLinDet><NmbItem>${escapeXml(item.name)}</NmbItem><QtyItem>${item.quantity}</QtyItem><PrcItem>${item.unitPrice}</PrcItem><MontoItem>${item.totalAmount}</MontoItem></Detalle>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="ISO-8859-1"?><DTE version="1.0"><Documento><Encabezado><IdDoc><TipoDTE>${document.documentType}</TipoDTE></IdDoc><Emisor><RUTEmisor>${escapeXml(document.issuer.rut)}</RUTEmisor><RznSoc>${escapeXml(document.issuer.legalName)}</RznSoc></Emisor><Receptor><RUTRecep>${escapeXml(document.receiver.rut)}</RUTRecep><RznSocRecep>${escapeXml(document.receiver.legalName)}</RznSocRecep></Receptor><Totales><MntNeto>${document.amounts.netAmount}</MntNeto><IVA>${document.amounts.ivaAmount}</IVA><MntTotal>${document.amounts.totalAmount}</MntTotal></Totales></Encabezado>${lineItems}</Documento></DTE>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
