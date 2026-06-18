// src/app/api/onboarding/save/route.ts

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
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

/**
 * UX 3.0.03 — Onboarding Conversacional
 *
 * Guarda los datos recopilados durante la conversación de onboarding
 * y marca el flujo como completado.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getSessionFromRequest(req);
    if (!auth) {
      return fail("No autorizado.", 401);
    }

    const body = await req.json();
    const { onboardingData } = body;

    if (!onboardingData || typeof onboardingData !== "object") {
      return fail("Datos de onboarding inválidos.");
    }

    await prisma.users.update({
      where: { id: auth.user.id },
      data: {
        onboardingCompleted: true,
        onboardingData,
      },
    });

    return ok({ completed: true });
  } catch (error) {
    console.error("api/onboarding/save error:", error);
    return fail("No fue posible guardar los datos de onboarding.", 500);
  }
}
