import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { getTaxDeclarationByIdForUser } from "@/modules/tax-dj/infrastructure/declarationRepository";
import { buildDeclarationAuditPdf } from "@/modules/tax/application/buildAuditPdf";
import { listTaxDeclarationAuditLogs } from "@/modules/tax-dj/infrastructure/declarationRepository";
import { checkAuditIntegrity } from "@/modules/tax/application/integrityCheckService";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);

  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado.", data: null },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;

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

    const auditLogs = await listTaxDeclarationAuditLogs({
      userId: auth.user.id,
      declarationId: id,
      limit: 500,
    });

    const integrityResult = await checkAuditIntegrity(auth.user.id);
    const integrityIssues = integrityResult.issues.filter(
      (i) => i.data.declarationId === id,
    ).length;

    const verificationUrl = `${new URL(req.url).origin}/api/verify/declaration/${declaration.contentHash}`;

    const report = {
      id: declaration.id,
      userId: auth.user.id,
      taxYear: declaration.taxYear,
      declarationType: declaration.declarationType,
      status: declaration.status,
      contentHash: declaration.contentHash,
      generatedAt: declaration.generatedAt,
      confirmedAt: declaration.confirmedAt,
      auditTrail: auditLogs.map((log) => ({
        logType: "DECLARATION",
        action: log.action,
        createdAt: log.createdAt,
        actorEmail: log.actorEmail,
        ipAddress: log.ipAddress,
        beforeState: log.beforeState,
        afterState: log.afterState,
        currentHash: log.currentHash,
        metadata: log.metadata,
      })),
      integrityStatus: integrityResult.status,
      integrityIssues,
    };

    const pdf = await buildDeclarationAuditPdf(report, verificationUrl);
    const filename = `ledgera-audit-${declaration.taxYear}-${declaration.declarationType.toLowerCase()}-${declaration.id.slice(0, 8)}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("[api/tax/declarations/[id]/audit-pdf][GET]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible generar el PDF de auditoría.",
        data: null,
      },
      { status: 500 },
    );
  }
}
