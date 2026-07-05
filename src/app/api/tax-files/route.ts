import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { listTaxFiles } from "@/modules/tax-file/application/listTaxFiles";
import { isValidTaxFileStatus } from "@/modules/tax-file/domain/taxFile";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  if (auth.user.role !== "admin") {
    return fail("Sin permisos.", 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "";
    const riskLevel = searchParams.get("riskLevel") ?? "";
    const plan = searchParams.get("plan") ?? "";
    const limit = Number(searchParams.get("limit") ?? "100");

    const result = await listTaxFiles({
      status: isValidTaxFileStatus(status) ? status : undefined,
      riskLevel: riskLevel || undefined,
      plan: plan || undefined,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 100,
    });

    if (!result.ok) {
      return fail(result.message, 500);
    }

    await recordAuditEvent({
      userId: auth.user.id,
      actorId: auth.user.id,
      category: "TAX",
      severity: "INFO",
      event: "tax_file_summary_generated",
      description: "Listado de expedientes tributarios generado",
      result: "SUCCESS",
      entityType: "TaxFile",
      entityId: "list",
      metadata: {
        count: result.files.length,
        filters: { status, riskLevel, plan },
      },
    });

    return ok(
      result.files.map((f) => ({
        ...f,
        generatedAt: f.generatedAt.toISOString(),
      })),
      "Expedientes obtenidos.",
    );
  } catch (error) {
    return serverError(error);
  }
}
