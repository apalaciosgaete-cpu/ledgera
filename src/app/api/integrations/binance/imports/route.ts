import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { listPendingImports } from "@/modules/integrations/binance/infrastructure/exchangeImportRepository";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const records = await listPendingImports(auth.user.id, ["BINANCE", "BINANCE_TAX"]);

    const shaped = records.map((r) => ({
      id:                  r.id,
      externalId:          r.externalId,
      externalType:        r.externalType,
      normalizedJson:      r.normalizedJson,
      normalizedEventType: r.normalizedEventType,
      taxTreatment:        r.taxTreatment,
      inventoryEffect:     r.inventoryEffect,
      economicEffect:      r.economicEffect,
      status:              r.status,
      occurredAt:          r.occurredAt.toISOString(),
    }));

    return ok(shaped, `${shaped.length} registros pendientes o en revisión.`);
  } catch (error) {
    return serverError(error);
  }
}
