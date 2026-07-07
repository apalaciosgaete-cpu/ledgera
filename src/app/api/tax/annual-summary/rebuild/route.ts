// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { generateAnnualTaxSummary } from "@/modules/tax/application/generateAnnualTaxSummary";
import {
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";

function resolveYear(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 2009 && parsed <= 2100 ? parsed : undefined;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body    = await req.json().catch(() => ({})) as Record<string, unknown>;
    const taxYear = resolveYear(body.year);

    const result = await generateAnnualTaxSummary(auth.user.id, { taxYear });

    const { ipAddress, userAgent } = getAuditRequestContext(req);
    await createAdminAuditLog({
      action:          "ANNUAL_SUMMARY_REBUILT",
      actorId:         auth.user.id,
      actorEmail:      auth.user.email,
      targetUserId:    auth.user.id,
      targetUserEmail: auth.user.email,
      ipAddress,
      userAgent,
      metadata: {
        taxYear:  taxYear ?? "all",
        upserted: result.upserted,
        years:    result.years,
      },
    });

    const message = taxYear
      ? `Resumen anual ${taxYear} reconstruido.`
      : `Resúmenes anuales reconstruidos: ${result.upserted} período(s).`;

    return ok(result, message);
  } catch (error) {
    return serverError(error);
  }
}
