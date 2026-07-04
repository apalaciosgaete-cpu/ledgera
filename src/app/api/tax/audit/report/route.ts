import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { getTaxDeclarationByIdForUser } from "@/modules/tax-dj/infrastructure/declarationRepository";
import { listAuditLogs } from "@/modules/tax/infrastructure/auditLogRepository";
import { checkAuditIntegrity } from "@/modules/tax/application/integrityCheckService";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);

  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado.", data: null },
      { status: 401 },
    );
  }

  try {
    const searchParams = new URL(req.url).searchParams;
    const id = searchParams.get("id") ?? undefined;
    const limit = parseInt(searchParams.get("limit") ?? "100", 10);

    if (id) {
      const declaration = await getTaxDeclarationByIdForUser({
        id,
        userId: auth.user.id,
      });

      if (!declaration) {
        return NextResponse.json(
          { ok: false, message: "Declaración no encontrada.", data: null },
          { status: 404 },
        );
      }

      const auditLogs = await listAuditLogs({
        userId: auth.user.id,
        limit,
      });

      const declarationLogs = auditLogs.filter(
        (log) => "declarationId" in log && log.declarationId === id,
      );

      const integrityResult = await checkAuditIntegrity(auth.user.id);

      return NextResponse.json({
        ok: true,
        data: {
          declaration: {
            id: declaration.id,
            taxYear: declaration.taxYear,
            declarationType: declaration.declarationType,
            status: declaration.status,
            contentHash: declaration.contentHash,
            generatedAt: declaration.generatedAt,
            confirmedAt: declaration.confirmedAt,
          },
          auditTrail: declarationLogs,
          integrity: {
            status: integrityResult.status,
            issues: integrityResult.issues.filter(
              (issue) => issue.data.declarationId === id,
            ),
          },
        },
      });
    }

    const allAuditLogs = await listAuditLogs({
      userId: auth.user.id,
      limit,
    });

    const integrityResult = await checkAuditIntegrity(auth.user.id);

    const summary = {
      totalEvents: allAuditLogs.length,
      eventsByType: allAuditLogs.reduce(
        (acc, log) => {
          const type = "action" in log ? log.action.split("_")[0] : "UNKNOWN";
          acc[type] = (acc[type] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      integrityStatus: integrityResult.status,
      issueCount: integrityResult.issues.length,
    };

    return NextResponse.json({
      ok: true,
      data: {
        summary,
        auditTrail: allAuditLogs,
      },
    });
  } catch (error) {
    console.error("[api/tax/audit/report][GET]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible generar el reporte de auditoría.",
        data: null,
      },
      { status: 500 },
    );
  }
}
