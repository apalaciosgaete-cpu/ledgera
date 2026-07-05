import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { fail, ok, serverError } from "@/shared/apiResponse";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export const runtime     = "nodejs";
export const maxDuration = 30;

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, context: Params) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const { id } = await context.params;

    const upload = await prisma.bankFileUpload.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!upload) return fail("Upload no encontrado.", 404);
    if (upload.userId !== auth.user.id) return fail("No autorizado.", 403);

    const [deleted] = await prisma.$transaction([
      prisma.bankMovement.deleteMany({ where: { uploadId: id } }),
      prisma.bankFileUpload.delete({ where: { id } }),
    ]);

    return ok({ deletedMovements: deleted.count }, "Upload eliminado correctamente.");
  } catch (error) {
    return serverError(error);
  }
}
