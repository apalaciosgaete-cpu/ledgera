export async function signXml(xml: string): Promise<{
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

  return { signed: true, xml: signedXml };
}
