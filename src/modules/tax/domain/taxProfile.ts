export type TaxDocumentType = "BOLETA" | "FACTURA";

export interface TaxProfile {
  id: string;
  userId: string;
  documentType: TaxDocumentType;
  rut: string;
  legalName: string;
  businessActivity: string | null;
  address: string;
  commune: string;
  city: string;
  dteEmail: string;
  isValidated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaxProfileInput {
  userId: string;
  documentType: TaxDocumentType;
  rut: string;
  legalName: string;
  businessActivity?: string | null;
  address: string;
  commune: string;
  city: string;
  dteEmail: string;
}

export interface UpdateTaxProfileInput {
  userId: string;
  documentType: TaxDocumentType;
  rut: string;
  legalName: string;
  businessActivity?: string | null;
  address: string;
  commune: string;
  city: string;
  dteEmail: string;
}

export interface TaxProfileValidationResult {
  valid: boolean;
  normalized?: string;
  message?: string;
}
