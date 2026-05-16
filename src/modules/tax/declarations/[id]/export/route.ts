import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import {
  buildDeclarationCsv,
  buildDeclarationCsvFilename,
  type ExportDeclarationCsvInput,
} from "@/modules/tax-dj/application/exportDeclarationCsv";
import { getTaxDeclarationByIdForUser } from "@/modules/tax-dj/infrastructure/declarationRepository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TaxDeclarationExportRecord = {
  id: string;
  taxYear: number;
  declarationType: string;
  status: string;
  contentHash: string;
  generatedAt: Date | string;
  confirmedAt: Date | string | null;
  payloadJson: string;
};

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

    const declaration = (await getTaxDeclarationByIdForUser({
      id,
      userId: auth.user.id,
    })) as TaxDeclarationExportRecord | null;

    if (!declaration) {
      return NextResponse.json(
        { ok: false, message: "Declaración no encontrada.", data: null },
        { status: 404 },
      );
    }

    if (declaration.status === "VOIDED") {
      return NextResponse.json(
        {
          ok: false,
          message: "No se puede exportar una declaración anulada.",
          data: null,
        },
        { status: 409 },
      );
    }

    const csv = buildDeclarationCsv(declaration as ExportDeclarationCsvInput);

    const filename = buildDeclarationCsvFilename({
      id: declaration.id,
      taxYear: declaration.taxYear,
      declarationType: declaration.declarationType,
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("[api/tax/declarations/[id]/export][GET]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible exportar la declaración.",
        data: null,
      },
      { status: 500 },
    );
  }
}