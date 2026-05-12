// src/app/api/me/route.ts

import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";

function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify({ ok: true, data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function fail(message: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, message, data: null }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getSessionFromRequest(req);
    if (!auth) {
      return fail("No autorizado.", 401);
    }

    // Exponer campos que el middleware necesita para verificar suscripción
    return ok({
      user: {
        id:                    auth.user.id,
        email:                 auth.user.email,
        role:                  auth.user.role,
        status:                auth.user.status,
        subscriptionPlan:      auth.user.subscriptionPlan,
        subscriptionExpiresAt: auth.user.subscriptionExpiresAt,
      },
      session: auth.session,
    });
  } catch (error) {
    console.error("api/me error:", error);
    return fail("No fue posible obtener la sesión.", 500);
  }
}