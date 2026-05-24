import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH_BYTES = 32;

function getEncryptionKey(): Buffer {
  const key = process.env.LEDGERA_ENCRYPTION_KEY;

  if (!key) {
    throw new Error("LEDGERA_ENCRYPTION_KEY no está configurada.");
  }

  const keyBuffer = Buffer.from(key, "hex");

  if (keyBuffer.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      "LEDGERA_ENCRYPTION_KEY debe tener 32 bytes en formato hexadecimal.",
    );
  }

  return keyBuffer;
}

export function encryptSecret(plainText: string): string {
  if (!plainText) {
    throw new Error("No se puede cifrar un secreto vacío.");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decryptSecret(cipherText: string): string {
  if (!cipherText) {
    throw new Error("No se puede descifrar un secreto vacío.");
  }

  const [ivHex, authTagHex, encryptedHex] = cipherText.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Formato de secreto cifrado inválido.");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  if (iv.length !== IV_LENGTH) {
    throw new Error("IV inválido en secreto cifrado.");
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Auth tag inválido en secreto cifrado.");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
