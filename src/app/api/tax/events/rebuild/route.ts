// src/app/api/tax/events/rebuild/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { rebuildTaxEvents } from "@/modules/tax/application/rebuildTaxEvents";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado", 401);

  try {
    const result = await rebuildTaxEvents(auth.user.id);

    if (!result.ok) {
      return fail(result.message, 500);
    }

    return ok(result.data, result.message);
  } catch (error) {
    return serverError(error);
  }
}