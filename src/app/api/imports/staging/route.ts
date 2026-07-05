import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { getStagingItems } from "@/modules/staging/application/getStagingItems";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const result = await getStagingItems(auth.user.id);

    return ok(
      result,
      `${result.items.length} eventos en staging.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
