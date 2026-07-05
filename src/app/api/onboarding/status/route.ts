// src/app/api/onboarding/status/route.ts

import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getOnboardingStatus } from "@/modules/onboarding/application/getOnboardingStatus";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
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

    const status = await getOnboardingStatus(auth.user.id);

    return ok(status);
  } catch (error) {
    console.error("api/onboarding/status error:", error);
    return fail("No fue posible obtener el estado de onboarding.", 500);
  }
}
