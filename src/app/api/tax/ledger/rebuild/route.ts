import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { generateTaxLedger } from "@/modules/tax/application/generateTaxLedger";
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

    const { created } = await generateTaxLedger(auth.user.id, { taxYear });

    const { ipAddress, userAgent } = getAuditRequestContext(req);
    await createAdminAuditLog({
      action:          "TAX_LEDGER_REBUILT",
      actorId:         auth.user.id,
      actorEmail:      auth.user.email,
      targetUserId:    auth.user.id,
      targetUserEmail: auth.user.email,
      ipAddress,
      userAgent,
      metadata: {
        taxYear:  taxYear ?? "all",
        created,
        source:   "SYSTEM",
      },
    });

    const message = taxYear
      ? `Ledger tributario ${taxYear} reconstruido: ${created} asientos.`
      : `Ledger tributario completo reconstruido: ${created} asientos.`;

    return ok({ created, taxYear: taxYear ?? null }, message);
  } catch (error) {
    return serverError(error);
  }
}
