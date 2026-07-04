import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import {
  buildDeclarationPdf,
  buildDeclarationPdfFilename,
  type ExportDeclarationPdfInput,
} from "@/modules/tax-dj/application/exportDeclarationPdf";
import {
  createTaxDeclarationAuditLog,
  getTaxDeclarationByIdForUser,
  updateTaxDeclarationStatus,
} from "@/modules/tax-dj/infrastructure/declarationRepository";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

type TaxDeclarationPdfRecord = {
  id: string;
  taxYear: number;
  declarationType: string;
  status: string;
  contentHash: string;
  generatedAt: Date | string;
  confirmedAt: Date | string | null;
  payloadJson: string;
};

function resolveRequestMetadata(req: NextRequest) {
  return {
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null,
    userAgent: req.headers.get("user-agent") ?? null,
  };
}

export async function GET(
  req: NextRequest,
  { params }: RouteContext,
) {
  const auth = await requireAuth(req);

  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado.", data: null },
      { status: 401 },
    );
  }

  try {
    const { id } = params;

    const declaration = (await getTaxDeclarationByIdForUser({
      id,
      userId: auth.user.id,
    })) as TaxDeclarationPdfRecord | null;

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

    const pdf = buildDeclarationPdf(
      declaration as ExportDeclarationPdfInput,
    );

    const filename = buildDeclarationPdfFilename({
      id: declaration.id,
      taxYear: declaration.taxYear,
      declarationType: declaration.declarationType,
    });

    const requestMetadata = resolveRequestMetadata(req);
    const previousStatus = declaration.status;
    const nextStatus = "EXPORTED";

    if (declaration.status !== "EXPORTED") {
      const result = await updateTaxDeclarationStatus({
        id: declaration.id,
        userId: auth.user.id,
        status: nextStatus,
      });

      if (result.count === 0) {
        return NextResponse.json(
          {
            ok: false,
            message: "No fue posible marcar la declaración como exportada.",
            data: null,
          },
          { status: 500 },
        );
      }
    }

    await createTaxDeclarationAuditLog({
      userId: auth.user.id,
      declarationId: declaration.id,
      action: "DECLARATION_EXPORTED",
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      taxYear: declaration.taxYear,
      declarationType: declaration.declarationType,
      statusFrom: previousStatus,
      statusTo: nextStatus,
      contentHash: declaration.contentHash,
      ipAddress: requestMetadata.ipAddress,
      userAgent: requestMetadata.userAgent,
      metadata: {
        exportFormat: "PDF_AUDITOR",
        filename,
        verificationCode: declaration.contentHash,
        verificationPath: `/verify/report/${declaration.contentHash}`,
      },
    });

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
    console.error("[api/tax/declarations/[id]/export-pdf][GET]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible exportar la declaración en PDF.",
        data: null,
      },
      { status: 500 },
    );
  }
}
