import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export const runtime     = "nodejs";
export const maxDuration = 30;

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Params) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const { id } = await context.params;

    const upload = await prisma.bankFileUpload.findUnique({
      where: { id },
      select: {
        id:           true,
        fileName:     true,
        bankName:     true,
        fileType:     true,
        createdAt:    true,
        totalRows:    true,
        importedRows: true,
        errorRows:    true,
        userId:       true,
      },
    });

    if (!upload)                    return fail("Upload no encontrado.", 404);
    if (upload.userId !== auth.user.id) return fail("No autorizado.", 403);

    const movements = await prisma.bankMovement.findMany({
      where:   { uploadId: id, userId: auth.user.id },
      orderBy: { occurredAt: "asc" },
      take:    20,
      select: {
        occurredAt:    true,
        description:   true,
        amountClp:     true,
        direction:     true,
        bankCategory:  true,
      },
    });

    const rejected = upload.totalRows - upload.importedRows - upload.errorRows;

    return ok({
      upload: {
        id:           upload.id,
        fileName:     upload.fileName,
        bankName:     upload.bankName,
        fileType:     upload.fileType,
        createdAt:    upload.createdAt.toISOString(),
        totalRows:    upload.totalRows,
        importedRows: upload.importedRows,
        errorRows:    upload.errorRows,
        rejected:     Math.max(0, rejected),
      },
      movements: movements.map((m) => ({
        occurredAt:   m.occurredAt.toISOString(),
        description:  m.description,
        amountClp:    m.amountClp,
        direction:    m.direction,
        bankCategory: m.bankCategory ?? "UNKNOWN",
      })),
    }, "Upload cargado.");
  } catch (error) {
    return serverError(error);
  }
}
