// src/app/api/profile/adaptive/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { buildAdaptiveProfile, getAdaptiveProfile } from "@/modules/adaptive-profile/application/buildAdaptiveProfile";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado.", data: null },
      { status: 401 },
    );
  }

  try {
    const result = await getAdaptiveProfile(auth.user.id);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message, data: null },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Perfil adaptativo obtenido.",
      data: result.profile,
    });
  } catch (error) {
    console.error("[profile/adaptive GET]", error);
    return NextResponse.json(
      { ok: false, message: "Error al obtener perfil adaptativo.", data: null },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado.", data: null },
      { status: 401 },
    );
  }

  try {
    const result = await buildAdaptiveProfile(auth.user.id);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message, data: null },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Perfil adaptativo reconstruido.",
      data: result.profile,
    });
  } catch (error) {
    console.error("[profile/adaptive POST]", error);
    return NextResponse.json(
      { ok: false, message: "Error al reconstruir perfil adaptativo.", data: null },
      { status: 500 },
    );
  }
}
