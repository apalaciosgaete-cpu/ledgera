import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import {
  isPlatformAuth,
  requirePlatformRole,
  type PlatformAuth,
} from "@/modules/identity/application/requirePlatformRole";
import { fail } from "@/shared/apiResponse";

const TOKEN_VERSION = 1;
const ADMIN_REAUTH_HEADER = "x-ledgera-admin-reauth";
const ADMIN_REAUTH_TTL_SECONDS = 10 * 60;

type AdminReauthPayload = {
  version: number;
  userId: string;
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
  purpose: "ADMIN_CRITICAL_ACTION";
};

function resolveSecret() {
  const secret = process.env.ADMIN_REAUTH_SECRET ?? process.env.LEDGERA_ENCRYPTION_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_REAUTH_SECRET o LEDGERA_ENCRYPTION_KEY es obligatorio en producción.");
    }

    return "ledgera-local-admin-reauth-secret-change-me";
  }

  return secret;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(encodedPayload: string) {
  return createHmac("sha256", resolveSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function issueAdminReauthenticationToken(input: {
  userId: string;
  sessionId: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const issuedAt = Math.floor(now.getTime() / 1000);
  const expiresAt = issuedAt + ADMIN_REAUTH_TTL_SECONDS;
  const payload: AdminReauthPayload = {
    version: TOKEN_VERSION,
    userId: input.userId,
    sessionId: input.sessionId,
    issuedAt,
    expiresAt,
    purpose: "ADMIN_CRITICAL_ACTION",
  };

  const encodedPayload = encode(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt: new Date(expiresAt * 1000),
  };
}

function verifyAdminReauthenticationToken(input: {
  token: string;
  auth: PlatformAuth;
  now?: Date;
}) {
  const [encodedPayload, providedSignature, extra] = input.token.split(".");
  if (!encodedPayload || !providedSignature || extra) return false;

  const expectedSignature = sign(encodedPayload);
  const expected = Buffer.from(expectedSignature);
  const provided = Buffer.from(providedSignature);

  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return false;
  }

  let payload: AdminReauthPayload;
  try {
    payload = JSON.parse(decode(encodedPayload)) as AdminReauthPayload;
  } catch {
    return false;
  }

  const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1000);

  return (
    payload.version === TOKEN_VERSION &&
    payload.purpose === "ADMIN_CRITICAL_ACTION" &&
    payload.userId === input.auth.user.id &&
    payload.sessionId === input.auth.session.id &&
    payload.issuedAt <= nowSeconds + 30 &&
    payload.expiresAt > nowSeconds &&
    payload.expiresAt - payload.issuedAt <= ADMIN_REAUTH_TTL_SECONDS
  );
}

export async function requireAdminReauthentication(
  request: Request,
): Promise<PlatformAuth | NextResponse> {
  const auth = await requirePlatformRole(request, ["admin"]);
  if (!isPlatformAuth(auth)) return auth;

  if (!auth.user.twoFactorEnabled) {
    return fail("El administrador debe habilitar 2FA para ejecutar acciones críticas.", 403, {
      code: "ADMIN_2FA_REQUIRED",
    });
  }

  const token = request.headers.get(ADMIN_REAUTH_HEADER);

  if (!token || !verifyAdminReauthenticationToken({ token, auth })) {
    return fail("Reautenticación administrativa requerida.", 428, {
      code: "ADMIN_REAUTH_REQUIRED",
      header: ADMIN_REAUTH_HEADER,
    });
  }

  return auth;
}

export const adminReauthentication = {
  headerName: ADMIN_REAUTH_HEADER,
  ttlSeconds: ADMIN_REAUTH_TTL_SECONDS,
};
