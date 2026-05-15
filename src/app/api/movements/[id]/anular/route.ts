import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rebuildTaxEvents } from "@/modules/tax/application/rebuildTaxEvents";
import { assertPeriodOpen } from "@/modules/tax/domain/periodGuard";
import { requireAuth } from "@/shared";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfResponse = enforceCsrfProtection(request);

  if (csrfResponse) {
    return csrfResponse;
  }

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || String(reason).trim().length === 0) {
      return NextResponse.json(
        { ok: false, message: "El motivo de anulación es requerido" },
        { status: 400 },
      );
    }

    const movement = await prisma.portfolioMovement.findUnique({
      where: { id },
    });

    if (!movement) {
      return NextResponse.json(
        { ok: false, message: "Movimiento no encontrado" },
        { status: 404 },
      );
    }

    if (movement.userId !== auth.user.id) {
      return NextResponse.json(
        { ok: false, message: "Sin permisos sobre este movimiento" },
        { status: 403 },
      );
    }

    if (movement.deletedAt) {
      return NextResponse.json(
        { ok: false, message: "El movimiento ya está anulado" },
        { status: 409 },
      );
    }

    await assertPeriodOpen(new Date(movement.executedAt), auth.user.id);

    await prisma.portfolioMovement.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedReason: String(reason).trim(),
      },
    });

    const motorResult = await rebuildTaxEvents(auth.user.id);

    if (!motorResult.ok) {
      await prisma.portfolioMovement.update({
        where: { id },
        data: { deletedAt: null, deletedReason: null },
      });

      return NextResponse.json(
        {
          ok: false,
          message: "Error en el motor tributario. La anulación fue revertida.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Movimiento anulado correctamente",
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("período tributario")) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 409 },
      );
    }

    console.error("[portfolio/movements/[id]/PATCH]", error);

    return NextResponse.json(
      { ok: false, message: "Error interno al anular el movimiento" },
      { status: 500 },
    );
  }
}