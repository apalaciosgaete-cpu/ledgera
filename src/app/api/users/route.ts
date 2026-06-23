import { NextRequest, NextResponse } from "next/server";

import {
  getUsers,
  createUser,
  getUserByEmail,
} from "@/modules/identity/infrastructure/userRepository";
import { rotateSessionForUser } from "@/modules/identity/infrastructure/sessionRepository";
import {
  buildSessionExpirationDate,
  generateSessionToken,
} from "@/modules/identity/application/sessionToken";
import { validatePasswordComplexity } from "@/modules/identity/application/password";
import { hashPassword } from "@/modules/identity/application/passwordHash";
import { sanitizeUser } from "@/modules/identity/application/sanitizeUser";
import { createPortfolio } from "@/modules/portfolio/infrastructure/portfolioRepository";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { sendWelcomeEmail } from "@/lib/emails/welcome";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";
import {
  apiAuthErrorResponse,
  isApiAuthError,
  requireAdmin,
} from "@/modules/security/application/requireApiUser";

const validRoles = ["personal", "contador", "empresa"] as const;
type Role = (typeof validRoles)[number];

function isValidRole(value: unknown): value is Role {
  return validRoles.includes(value as Role);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const users = await getUsers();

    return ok(
      {
        count: users.length,
        users: users.map(sanitizeUser),
      },
      "Usuarios obtenidos correctamente.",
    );
  } catch (error) {
    if (isApiAuthError(error)) return apiAuthErrorResponse(error);
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

    const sessionToken = generateSessionToken();
    const expiresAt = buildSessionExpirationDate();

    const session = await rotateSessionForUser({
      userId: user.id,
      token: sessionToken,
      expiresAt,
    });

    try {
      await sendWelcomeEmail({
        to: email,
        fullName,
        role,
      });
    } catch (emailError) {
      console.warn("[users/POST] Email bienvenida falló:", emailError);
    }

    const response = NextResponse.json(
      {
        ok: true,
        message: "Usuario creado correctamente.",
        data: {
          user: sanitizeUser(user),
          session: {
            id: session.id,
            token: session.token,
            expiresAt: session.expiresAt,
          },
        },
      },
      { status: 201 },
    );

    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    return serverError(error);
  }
}
