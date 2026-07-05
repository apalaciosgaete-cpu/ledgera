import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { buildTaxFileSummary } from "@/modules/tax-file/application/buildTaxFileSummary";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const result = await buildTaxFileSummary(auth.user.id);

    if (!result.ok) {
      return fail(result.message, 500);
    }

    await recordAuditEvent({
      userId: auth.user.id,
      actorId: auth.user.id,
      category: "TAX",
      severity: "INFO",
      event: "tax_file_viewed",
      description: "Expediente tributario propio consultado",
      result: "SUCCESS",
      entityType: "TaxFile",
      entityId: auth.user.id,
      metadata: {
        status: result.summary.status,
      },
    });

    return ok(serializeTaxFileSummary(result.summary), "Expediente obtenido.");
  } catch (error) {
    return serverError(error);
  }
}

function serializeTaxFileSummary(summary: {
  userId: string;
  userEmail: string;
  userName: string;
  status: string;
  taxProfile: {
    exists: boolean;
    documentType: string | null;
    rut: string | null;
    legalName: string | null;
    isValidated: boolean;
  };
  risk: { score: number | null; level: string | null };
  smartScore: { score: number | null; level: string | null };
  alerts: { open: number; critical: number };
  recommendations: { active: number; critical: number };
  tasks: { pending: number; overdue: number; critical: number };
  taxDocuments: { total: number; pending: number; rejected: number };
  sii: { configured: boolean; status: string; activeCafs: number };
  billing: { plan: string; subscriptionStatus: string | null };
  connections: { total: number; degraded: number };
  audit: { recentEvents: number; criticalEvents: number };
  generatedAt: Date;
}) {
  return {
    ...summary,
    generatedAt: summary.generatedAt.toISOString(),
  };
}
