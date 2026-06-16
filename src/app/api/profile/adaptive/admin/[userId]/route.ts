// src/app/api/profile/adaptive/admin/[userId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { getAdaptiveProfileByUserId } from "@/modules/adaptive-profile/application/buildAdaptiveProfile";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado.", data: null },
      { status: 401 },
    );
  }

  // Only admin role can access this endpoint
  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { ok: false, message: "Acceso denegado. Se requiere rol admin.", data: null },
      { status: 403 },
    );
  }

  try {
    const { userId } = params;
    const result = await getAdaptiveProfileByUserId(userId);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message, data: null },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Perfil adaptativo del usuario obtenido.",
      data: result.profile,
    });
  } catch (error) {
    console.error("[profile/adaptive/admin/[userId] GET]", error);
    return NextResponse.json(
      { ok: false, message: "Error al obtener perfil adaptativo del usuario.", data: null },
      { status: 500 },
    );
  }
}
