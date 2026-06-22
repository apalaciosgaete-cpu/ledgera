import type { SiiCredential } from "@/modules/sii/domain/sii";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";

export async function validateCertificate(
  credential: SiiCredential,
  options?: { userId?: string },
): Promise<{ valid: boolean; expiresAt: Date | null }> {
  const now = new Date();
  const expiresAt = credential.certificateExpires;

  if (!credential.isActive) {
    return { valid: false, expiresAt };
  }

  if (!expiresAt) {
    return { valid: false, expiresAt: null };
  }

  const valid = expiresAt.getTime() > now.getTime();

  await recordAuditEvent({
    userId: options?.userId ?? null,
    category: "SII",
    severity: valid ? "INFO" : "WARNING",
    event: "certificate_validated",
    description: valid
      ? `Certificado ${credential.certificateName} válido hasta ${expiresAt.toISOString()}`
      : `Certificado ${credential.certificateName} vencido`,
    result: valid ? "SUCCESS" : "FAILED",
    entityType: "SiiCredential",
    entityId: credential.id,
    metadata: { valid, expiresAt },
  });

  return { valid, expiresAt };
}
