import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { getStagingDetail } from "@/modules/staging/application/getStagingDetail";
import { StagingError } from "@/modules/staging/domain/StagingError";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) return fail("id es obligatorio.", 400);

    const result = await getStagingDetail(id, auth.user.id);

    return ok(result, `Detalle de ${result.source === "EXCHANGE" ? "evento exchange" : "movimiento bancario"}.`);
  } catch (error) {
    if (error instanceof StagingError) {
      if (error.code === "NOT_FOUND") return fail("Item no encontrado.", 404);
    }
    return serverError(error);
  }
}
