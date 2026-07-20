import { NextRequest } from "next/server";
import speakeasy from "speakeasy";

import {
  issueAdminReauthenticationToken,
} from "@/modules/admin/application/adminReauthentication";
import {
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";
import {
  isPlatformAuth,
  requirePlatformRole,
} from "@/modules/identity/application/requirePlatformRole";
import { verifyPassword } from "@/modules/identity/application/passwordHash";
import { decryptTwoFactorSecret } from "@/modules/identity/application/twoFactorSecret";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";
import { fail, ok, serverError } from "@/shared/apiResponse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ReauthenticationBody = {
  password?: string;
  code?: string;
};

export async function POST(request: NextRequest) {
  const csrfResponse = enforceCsrfProtection(request);
  if (csrfResponse) return csrfResponse;

  const rateLimitResponse = enforceRequestRateLimit(request, {
    scope: "admin-reauthentication",
    maxAttempts: 5,
    windowMs: 5 * 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requirePlatformRole(request, ["admin"]);
  if (!isPlatformAuth(auth)) return auth;

  try {
    const body = (await request.json()) as ReauthenticationBody;
    const password = String(body.password ?? "");
    const code = String(body.code ?? "").replace(/\D/g, "").slice(0, 6);

    if (!password || code.length !== 6) {
      return fail("Contraseña y código 2FA de 6 dígitos son obligatorios.", 400, {
        code: "ADMIN_REAUTH_FIELDS_REQUIRED",
      });
    }

    const user = await getUserById(auth.user.id);

    if (!user || user.role !== "admin") {
      return fail("Administrador no encontrado.", 403);
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return fail("Debes habilitar 2FA antes de ejecutar acciones administrativas críticas.", 403, {
        code: "ADMIN_2FA_REQUIRED",
      });
    }

    const passwordIsValid = await verifyPassword(password, user.passwordHash);
    const twoFactorIsValid = speakeasy.totp.verify({
      secret: decryptTwoFactorSecret(user.twoFactorSecret),
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!passwordIsValid || !twoFactorIsValid) {
      return fail("Reautenticación inválida.", 401, {
        code: "ADMIN_REAUTH_INVALID",
      });
    }

    const reauthentication = issueAdminReauthenticationToken({
      userId: auth.user.id,
      sessionId: auth.session.id,
    });

    await createAdminAuditLog({
      action: "ADMIN_REAUTHENTICATED",
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      ...getAuditRequestContext(request),
      metadata: {
        source: "api/admin/reauth",
        sessionId: auth.session.id,
        expiresAt: reauthentication.expiresAt.toISOString(),
        twoFactor: true,
      },
    });

    return ok(
      {
        token: reauthentication.token,
        expiresAt: reauthentication.expiresAt.toISOString(),
      },
      "Reautenticación administrativa válida.",
    );
  } catch (error) {
    return serverError(error);
  }
}
