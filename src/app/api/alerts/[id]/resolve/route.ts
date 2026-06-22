import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { resolveAlert } from "@/modules/alerts/application/resolveAlert";
import { getAlertById } from "@/modules/alerts/infrastructure/alertRepository";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado.", data: null },
      { status: 401 },
    );
  }

  try {
    const alert = await getAlertById(params.id);

    if (!alert) {
      return NextResponse.json(
        { ok: false, message: "Alerta no encontrada.", data: null },
        { status: 404 },
      );
    }

    if (auth.user.role !== "admin" && alert.userId !== auth.user.id) {
      return NextResponse.json(
        { ok: false, message: "Sin permisos.", data: null },
        { status: 403 },
      );
    }

    const result = await resolveAlert(params.id);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message, data: null },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Alerta resuelta correctamente.",
      data: result.alert,
    });
  } catch (error) {
    console.error("[alerts resolve PATCH]", error);

    return NextResponse.json(
      { ok: false, message: "Error al resolver alerta.", data: null },
      { status: 500 },
    );
  }
}
