import type { SiiCredential } from "@/modules/sii/domain/sii";

export async function validateCertificate(
  credential: SiiCredential,
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

  return { valid, expiresAt };
}
