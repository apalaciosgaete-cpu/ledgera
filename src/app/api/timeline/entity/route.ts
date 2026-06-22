import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { buildEntityTimeline } from "@/modules/timeline/application/buildEntityTimeline";
import type { TimelineEvent } from "@/modules/timeline/domain/TimelineEvent";

export type { TimelineEvent };

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const { searchParams } = new URL(request.url);
    const id   = searchParams.get("id")?.trim();
    const type = searchParams.get("type")?.toUpperCase() as "STAGING" | "BANK" | "PORTFOLIO" | "DOCUMENT" | undefined;

    if (!id)   return fail("id es obligatorio.", 400);
    if (!type) return fail("type es obligatorio.", 400);
    if (!["STAGING", "BANK", "PORTFOLIO", "DOCUMENT"].includes(type)) {
      return fail(`type '${type}' no válido. Usa: STAGING, BANK, PORTFOLIO, DOCUMENT`, 400);
    }

    const result = await buildEntityTimeline(id, type, auth.user.id);
    if (result.events.length === 0) return fail("Entidad no encontrada o sin eventos.", 404);

    return ok(result, "Timeline generado.");
  } catch (error) {
    return serverError(error);
  }
}
