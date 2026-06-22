import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { checkAuditIntegrity } from "@/modules/tax/application/integrityCheckService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function resolveIntegrityMessage(status: string): string {
  switch (status) {
    case "CRITICAL":
      return "Integridad de auditoria con inconsistencias criticas.";
    case "RISK":
      return "Integridad de auditoria con riesgos operacionales.";
    case "LEGACY_UNVERIFIABLE":
      return "Integridad nueva correcta; existen DDJJ legacy no verificables criptograficamente.";
    default:
      return "Integridad de auditoria verificada.";
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);

  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado.", data: null },
      { status: 401 },
    );
  }

  try {
    const result = await checkAuditIntegrity(auth.user.id);

    return NextResponse.json(
      {
        ok: true,
        message: resolveIntegrityMessage(result.status),
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[api/tax/audit/integrity][GET]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible verificar la integridad de auditoría.",
        data: null,
      },
      { status: 500 },
    );
  }
}
