import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";

export async function signXml(
  xml: string,
  options?: { userId?: string; taxDocumentId?: string },
): Promise<{
  signed: boolean;
  xml: string;
}> {
  // Placeholder: la firma electrónica real requiere certificado digital y PKCS#7.
  // Esta estructura permite avanzar en el flujo sin emitir documentos reales.
  const signedXml = `<!-- SIGNED_PLACEHOLDER -->\n${xml}`;

  console.info("[sii]", {
    event: "xml_signed_placeholder",
    xmlLength: signedXml.length,
  });

  await recordAuditEvent({
    userId: options?.userId ?? null,
    category: "SII",
    severity: "INFO",
    event: "xml_signed",
    description: "XML firmado (placeholder)",
    result: "SUCCESS",
    entityType: options?.taxDocumentId ? "TaxDocument" : null,
    entityId: options?.taxDocumentId ?? null,
    metadata: { xmlLength: signedXml.length },
  });

  return { signed: true, xml: signedXml };
}
