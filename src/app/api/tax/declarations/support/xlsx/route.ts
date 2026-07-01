import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, serverError } from "@/shared/apiResponse";
import {
  buildDeclarationSupportPayload,
  parseDeclarationYear,
  renderDeclarationSupportXlsx,
} from "@/modules/tax/application/buildDeclarationSupport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const year = parseDeclarationYear(request.nextUrl.searchParams.get("year"));
    const payload = await buildDeclarationSupportPayload({ user: auth.user, year });
    const workbook = renderDeclarationSupportXlsx(payload);
    const suffix = year ? `-${year}` : "";

    return new NextResponse(new Uint8Array(workbook), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="ledgera-declaracion-respaldo${suffix}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
