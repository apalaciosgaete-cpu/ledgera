import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail } from "@/shared/apiResponse";
import { buildAssistantAccountContext } from "@/modules/assistant/application/buildAssistantAccountContext";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const data = await buildAssistantAccountContext(auth.user.id);
    return NextResponse.json(
      { ok: true, data },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { ok: false, message: "No fue posible obtener el contexto del asistente.", debug: { message } },
      { status: 500, headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  }
}
