import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";

/**
 * Firma electrónica de XML para envío al SII.
 *
 * Estado actual: PLACEHOLDER — genera un XML marcado como no firmado.
 * La implementación real requiere:
 * - Certificado digital PKCS#12 (.p12/.pfx) del contribuyente
 * - Librería de firma XML (xml-crypto o similar)
 * - Integración con el endpoint de envío del SII
 *
 * TODO: Implementar firma real con certificado digital cuando se integre
 * el envío directo al SII (requiere credenciales y certificado del usuario).
 */
export async function signXml(
  xml: string,
  options?: { userId?: string; taxDocumentId?: string },
): Promise<{
  signed: boolean;
  xml: string;
}> {
  if (!xml || xml.trim().length === 0) {
    throw new Error("[sii] signXml: XML vacío, no se puede firmar.");
  }

  if (!xml.includes("<DTE") && !xml.includes("<Documento")) {
    throw new Error("[sii] signXml: El XML no contiene una estructura DTE válida.");
  }

  // PLACEHOLDER: marca el XML como pendiente de firma real.
  const signedXml = `<!-- PENDING_SIGNATURE -->\n${xml}`;

  console.info("[sii]", {
    event: "xml_sign_placeholder",
    xmlLength: signedXml.length,
    taxDocumentId: options?.taxDocumentId ?? null,
  });

  await recordAuditEvent({
    userId: options?.userId ?? null,
    category: "SII",
    severity: "WARNING",
    event: "xml_sign_placeholder",
    description: "XML marcado para firma — firma electrónica real no implementada",
    result: "PARTIAL",
    entityType: options?.taxDocumentId ? "TaxDocument" : null,
    entityId: options?.taxDocumentId ?? null,
    metadata: {
      xmlLength: signedXml.length,
      status: "PENDING_SIGNATURE",
      note: "Requiere certificado digital PKCS#12 para firma real",
    },
  });

  return { signed: false, xml: signedXml };
}
