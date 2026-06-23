import { decryptSecret, encryptSecret } from "@/modules/security/application/encryption";

export function sealTotpSeed(seed: string): string {
  return encryptSecret(seed);
}

export function openTotpSeed(stored: string): string {
  const looksSealed = stored.split(":").length === 3;

  if (!looksSealed) {
    return stored;
  }

  return decryptSecret(stored);
}
