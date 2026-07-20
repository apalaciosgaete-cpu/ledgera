import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, serverError } from "@/shared/apiResponse";
import { requireFeatureAccess } from "@/modules/subscription/application/requireFeatureAccess";
import { Feature } from "@/modules/subscription/domain/planFeatures";
import {
  buildF22CryptoExtractPayload,
  parseF22CommercialYear,
  renderF22CryptoExtractPdf,
} from "@/modules/tax/application/buildF22CryptoExtract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  const access = requireFeatureAccess(auth.user, Feature.DECLARATIONS);
  if (!access.ok) return access.response;

  try {
    const commercialYear = parseF22CommercialYear(request.nextUrl.searchParams.get("year"));
    if (!commercialYear) return fail("Año comercial inválido.", 400);

    const payload = await buildF22CryptoExtractPayload({
      user: auth.user,
      commercialYear,
    });
    const pdf = await renderF22CryptoExtractPdf(payload);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ledgera-extracto-f22-cripto-at-${payload.taxYear}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
