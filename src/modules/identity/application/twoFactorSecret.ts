// src/modules/identity/application/twoFactorSecret.ts
// Cifrado en reposo de la semilla TOTP (2FA) — Ley 21.719, deber de seguridad.
//
// Reutiliza el cipher canónico AES-256-GCM (LEDGERA_ENCRYPTION_KEY).
// Diseño retrocompatible: los secretos legados almacenados en texto plano
// (base32: solo A-Z y 2-7, sin ":") siguen validando, y se re-cifran cuando el
// usuario regenera su 2FA. Si la clave de cifrado no está configurada, degrada
// a texto plano (comportamiento previo) en lugar de romper la autenticación.

import {
  encryptSecret,
  decryptSecret,
} from "@/modules/security/application/encryption";

// Formato del cipher: "<iv hex 24>:<authTag hex 32>:<data hex>".
// Un base32 TOTP nunca contiene ":", así que esto discrimina sin ambigüedad.
const ENCRYPTED_FORMAT = /^[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/i;
const LEGACY_BASE32_FORMAT = /^[A-Z2-7]+=*$/i;

export function isEncryptedSecret(value: string): boolean {
  return ENCRYPTED_FORMAT.test(value);
}

/** Cifra la semilla TOTP antes de persistirla. No rompe si falta la clave. */
export function encryptTwoFactorSecret(plain: string): string {
  if (!plain) return plain;
  try {
    return encryptSecret(plain);
  } catch (error) {
    console.warn(
      "[2fa] No se pudo cifrar la semilla TOTP (¿LEDGERA_ENCRYPTION_KEY ausente?); se almacena sin cifrar.",
      error instanceof Error ? error.message : error,
    );
    return plain;
  }
}

/** Devuelve la semilla TOTP en claro. Acepta valores legados en texto plano. */
export function decryptTwoFactorSecret(stored: string): string {
  if (!stored) return stored;
  if (!isEncryptedSecret(stored)) {
    if (LEGACY_BASE32_FORMAT.test(stored.trim())) return stored.trim();
    throw new Error("Formato de semilla TOTP almacenada inválido.");
  }
  try {
    return decryptSecret(stored);
  } catch (error) {
    console.error(
      "[2fa] No se pudo descifrar la semilla TOTP almacenada.",
      error instanceof Error ? error.message : error,
    );
    throw new Error("No se pudo descifrar la semilla TOTP almacenada.");
  }
}
