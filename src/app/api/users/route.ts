// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import {
  getUsers,
  createUser,
  getUserByEmail,
} from "@/modules/identity/infrastructure/userRepository";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { validatePasswordComplexity } from "@/modules/identity/application/password";
import { hashPassword } from "@/modules/identity/application/passwordHash";
import { sanitizeUser } from "@/modules/identity/application/sanitizeUser";
import { issueEmailVerification } from "@/modules/identity/application/emailVerification";
import { createPortfolio } from "@/modules/portfolio/infrastructure/portfolioRepository";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";
import {
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";

const DEFAULT_TERMS_VERSION = "terms-2026-07";
const DEFAULT_PRIVACY_VERSION = "privacy-2026-07";
const PUBLIC_REGISTRATION_ROLE = "personal" as const;

function resolveLegalVersion(value: unknown, fallback: string) {
  const candidate = String(value ?? "").trim();
  return candidate || fallback;
}

export async function GET(request: NextRequest) {
  const auth = await getSessionFromRequest(request);

  if (!auth) {
    return fail("No autenticado.", 401);
  }

  if (auth.user.role !== "admin") {
    return fail("Sin permisos para consultar el directorio de usuarios.", 403);
  }

  try {
    const users = await getUsers();

    return ok(
      {
        count: users.length,
        users: users.map(sanitizeUser),
      },
      "Usuarios obtenidos correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = enforceRequestRateLimit(request, {
    scope: "register",
    maxAttempts: 5,
    windowMs: 60_000,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const fullName = String(body.fullName ?? "").trim();
    const password = String(body.password ?? "");
    const requestedRole = String(body.role ?? "").trim().toLowerCase() || null;
    const role = PUBLIC_REGISTRATION_ROLE;
    const termsAccepted = body.termsAccepted === true;
    const privacyAccepted = body.privacyAccepted === true;
    const legalConsent = body.legalConsent && typeof body.legalConsent === "object" ? body.legalConsent : {};
    const termsVersion = resolveLegalVersion(
      (legalConsent as { termsVersion?: unknown }).termsVersion,
      DEFAULT_TERMS_VERSION,
    );
    const privacyVersion = resolveLegalVersion(
      (legalConsent as { privacyVersion?: unknown }).privacyVersion,
      DEFAULT_PRIVACY_VERSION,
    );

    if (!email || !fullName || !password) {
      return fail("Faltan campos obligatorios: email, fullName, password.", 400);
    }

    if (!termsAccepted) {
      return fail("Debes aceptar los Términos y Condiciones para crear tu cuenta.", 400);
    }

    if (!privacyAccepted) {
      return fail("Debes leer la Política de Privacidad y autorizar el tratamiento de datos personales.", 400);
    }

    const passwordValidation = validatePasswordComplexity(password);

    if (!passwordValidation.valid) {
      return fail(passwordValidation.message ?? "Contraseña inválida.", 400);
    }

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return fail("El email ya está registrado.", 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await createUser({
      email,
      fullName,
      passwordHash,
      role,
    });

    const consentedAt = new Date().toISOString();
    const { ipAddress, userAgent } = getAuditRequestContext(request);

    await createAdminAuditLog({
      action: "USER_LEGAL_CONSENT_RECORDED",
      actorId: user.id,
      actorEmail: user.email,
      targetUserId: user.id,
      targetUserEmail: user.email,
      ipAddress,
      userAgent,
      metadata: {
        source: "registration",
        assignedRole: role,
        requestedRole,
        consentedAt,
        termsAccepted,
        privacyAccepted,
        termsVersion,
        privacyVersion,
        treatmentBasis: "consent",
        purposes: [
          "account_creation",
          "account_administration",
          "access_security",
          "financial_and_tax_service_delivery",
          "tax_file_processing",
        ],
        notice: "El usuario autorizó el tratamiento de datos personales para crear y administrar su cuenta, proteger el acceso y prestar servicios financieros y tributarios asociados a LEDGERA.",
      },
    });

    await createPortfolio(user.id);

    let verificationEmailSent = false;
    try {
      await issueEmailVerification({
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
      });
      verificationEmailSent = true;
    } catch (emailError) {
      console.warn("[users/POST] Email de verificación falló:", emailError);
    }

    return NextResponse.json(
      {
        ok: true,
        message: verificationEmailSent
          ? "Usuario creado. Revisa tu correo para verificar la cuenta y configura 2FA."
          : "Usuario creado. Configura 2FA y solicita nuevamente el correo de verificación desde Seguridad.",
        data: {
          user: sanitizeUser(user),
          verificationEmailSent,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return serverError(error);
  }
}
