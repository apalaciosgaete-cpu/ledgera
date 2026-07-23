import * as OTPAuth from "otpauth";

const TOTP_ALGORITHM = "SHA1";
const TOTP_DIGITS = 6;
const TOTP_PERIOD_SECONDS = 30;

// Five adjacent 30-second intervals. Rate limiting remains mandatory on every
// verification endpoint; this window only absorbs modest device clock drift.
export const TOTP_VALIDATION_WINDOW = 2;

function normalizeSecret(secret: string) {
  return String(secret ?? "")
    .trim()
    .replace(/[\s-]/g, "")
    .toUpperCase();
}

function buildTotp(secret: string, email = "cuenta") {
  return new OTPAuth.TOTP({
    issuer: "LEDGERA",
    label: email.trim().toLowerCase() || "cuenta",
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD_SECONDS,
    secret: OTPAuth.Secret.fromBase32(normalizeSecret(secret)),
  });
}

export function createTwoFactorSetup(email: string) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: "LEDGERA",
    label: email.trim().toLowerCase() || "cuenta",
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD_SECONDS,
    secret,
  });

  return {
    secret: secret.base32,
    otpauthUrl: totp.toString(),
  };
}

export function createTwoFactorOtpAuthUrl(secret: string, email: string) {
  return buildTotp(secret, email).toString();
}

export function validateTwoFactorCode(input: {
  secret: string;
  code: string;
  timestamp?: number;
  window?: number;
}) {
  const code = String(input.code ?? "").replace(/\D/g, "");
  if (code.length !== TOTP_DIGITS) return null;
  const window = Math.max(
    0,
    Math.min(10, Math.trunc(input.window ?? TOTP_VALIDATION_WINDOW)),
  );

  return buildTotp(input.secret).validate({
    token: code,
    timestamp: input.timestamp,
    window,
  });
}
