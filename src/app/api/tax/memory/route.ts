// src/app/api/tax/memory/route.ts

import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { buildTaxMemory } from "@/modules/tax-memory/application/buildTaxMemory";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
function ok(data: unknown) {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
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

    const result = await buildTaxMemory(auth.user.id);
    if (!result.ok) {
      return fail(result.message, 500);
    }

    return ok(result.memory);
  } catch (error) {
    console.error("[tax/memory GET]", error);
    return fail("Error al obtener memoria tributaria.", 500);
  }
}
