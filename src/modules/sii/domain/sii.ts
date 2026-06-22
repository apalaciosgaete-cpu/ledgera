export type SiiEnvironment = "CERTIFICACION" | "PRODUCCION";

export type SiiConnectionStatus =
  | "CONNECTED"
  | "DISCONNECTED"
  | "CERTIFICATE_EXPIRED"
  | "NOT_CONFIGURED";

export type SiiSubmissionStatus =
  | "XML_GENERATED"
  | "XML_SIGNED"
  | "READY_TO_SEND"
  | "SENT"
  | "PROCESSING"
  | "ACCEPTED"
  | "REJECTED";

export type SiiDocumentTypeCode = "33" | "39" | "61" | "56";

export interface SiiCredential {
  id: string;
  environment: SiiEnvironment;
  issuerRut: string;
  certificateName: string;
  certificatePath: string | null;
  certificateExpires: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SiiCaf {
  id: string;
  documentType: SiiDocumentTypeCode;
  folioStart: number;
  folioEnd: number;
  currentFolio: number;
  isActive: boolean;
  uploadedAt: Date;
}

export function toSiiDocumentTypeCode(
  documentType: string,
): SiiDocumentTypeCode | null {
  switch (documentType) {
    case "FACTURA_ELECTRONICA":
      return "33";
    case "BOLETA_ELECTRONICA":
      return "39";
    case "NOTA_CREDITO":
      return "61";
    case "NOTA_DEBITO":
      return "56";
    default:
      return null;
  }
}

export function fromSiiDocumentTypeCode(
  code: SiiDocumentTypeCode,
): string {
  switch (code) {
    case "33":
      return "FACTURA_ELECTRONICA";
    case "39":
      return "BOLETA_ELECTRONICA";
    case "61":
      return "NOTA_CREDITO";
    case "56":
      return "NOTA_DEBITO";
  }
}
