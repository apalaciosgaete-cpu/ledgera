// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';

// src/app/api/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import {
  generateCsrfToken,
  getCsrfCookieName,
  setCsrfCookie,
} from "@/modules/security/application/csrfProtection";

function ok(data: unknown, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message, data: null }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getSessionFromRequest(req);
    if (!auth) {
      return fail("No autorizado.", 401);
    }

    // Exponer campos que el middleware y el cliente necesitan para routing.
    const response = ok({
      user: {
        id:                    auth.user.id,
        email:                 auth.user.email,
        role:                  auth.user.role,
        status:                auth.user.status,
        subscriptionPlan:      auth.user.subscriptionPlan,
        subscriptionExpiresAt: auth.user.subscriptionExpiresAt,
        twoFactorEnabled:      auth.user.twoFactorEnabled,
        needsOnboarding:       auth.user.needsOnboarding,
      },
      session: auth.session,
    });

    if (!req.cookies.get(getCsrfCookieName())?.value) {
      setCsrfCookie(response, generateCsrfToken());
    }

    return response;
  } catch (error) {
    console.error("api/me error:", error);
    return fail("No fue posible obtener la sesión.", 500);
  }
}
