// src/app/api/profile/adaptive/admin/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { listAdaptiveProfiles } from "@/modules/adaptive-profile/application/buildAdaptiveProfile";

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit")) || 50;
    const profileType = searchParams.get("profileType") ?? undefined;

    const result = await listAdaptiveProfiles({
      limit,
      profileType: profileType as any,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message, data: null },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Perfiles adaptativos obtenidos.",
      data: {
        profiles: result.profiles,
        total: result.profiles.length,
      },
    });
  } catch (error) {
    console.error("[profile/adaptive/admin GET]", error);
    return NextResponse.json(
      { ok: false, message: "Error al listar perfiles adaptativos.", data: null },
      { status: 500 },
    );
  }
}
