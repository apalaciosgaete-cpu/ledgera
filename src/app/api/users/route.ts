// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import {
  getUsers,
  createUser,
  getUserByEmail,
} from "@/modules/identity/infrastructure/userRepository";
import { validatePasswordComplexity } from "@/modules/identity/application/password";
import { hashPassword } from "@/modules/identity/application/passwordHash";
import { sanitizeUser } from "@/modules/identity/application/sanitizeUser";
import { issueEmailVerification } from "@/modules/identity/application/emailVerification";
import { createPortfolio } from "@/modules/portfolio/infrastructure/portfolioRepository";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";

const validRoles = ["personal", "contador", "empresa"] as const;
type Role = (typeof validRoles)[number];

function isValidRole(value: unknown): value is Role {
  return validRoles.includes(value as Role);
}

export async function GET() {
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
    const role: Role = isValidRole(body.role) ? body.role : "personal";

    if (!email || !fullName || !password) {
      return fail("Faltan campos obligatorios: email, fullName, password.", 400);
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
