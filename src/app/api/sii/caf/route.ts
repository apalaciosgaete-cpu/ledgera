import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import type { SiiDocumentTypeCode } from "@/modules/sii/domain/sii";
import { createCaf, listCafs } from "@/modules/sii/infrastructure/siiCafRepository";

export async function GET(req: NextRequest) {
  const auth = await getSessionFromRequest(req);

  if (!auth) {
    return NextResponse.json(
      { ok: false, message: "No autenticado", data: null },
      { status: 401 },
    );
  }

  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { ok: false, message: "Sin permisos", data: null },
      { status: 403 },
    );
  }

  try {
    const cafs = await listCafs();

    return NextResponse.json({
      ok: true,
      message: "CAF obtenidos correctamente.",
      data: cafs.map((caf) => ({
        id: caf.id,
        documentType: caf.documentType,
        folioStart: caf.folioStart,
        folioEnd: caf.folioEnd,
        currentFolio: caf.currentFolio,
        available: Math.max(0, caf.folioEnd - caf.currentFolio + 1),
        isActive: caf.isActive,
        uploadedAt: caf.uploadedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[sii/caf GET]", error);

    return NextResponse.json(
      { ok: false, message: "Error al obtener CAF.", data: null },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await getSessionFromRequest(req);

  if (!auth) {
    return NextResponse.json(
      { ok: false, message: "No autenticado", data: null },
      { status: 401 },
    );
  }

  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { ok: false, message: "Sin permisos", data: null },
      { status: 403 },
    );
  }

  try {
    const body = (await req.json()) as {
      documentType?: string;
      folioStart?: number;
      folioEnd?: number;
    };

    const documentType = body.documentType as SiiDocumentTypeCode | undefined;
    const folioStart = Number(body.folioStart);
    const folioEnd = Number(body.folioEnd);

    if (!documentType || !["33", "39", "61", "56"].includes(documentType)) {
      return NextResponse.json(
        { ok: false, message: "Tipo de documento inválido.", data: null },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(folioStart) ||
      !Number.isFinite(folioEnd) ||
      folioStart <= 0 ||
      folioEnd < folioStart
    ) {
      return NextResponse.json(
        { ok: false, message: "Rango de folios inválido.", data: null },
        { status: 400 },
      );
    }

    const caf = await createCaf({ documentType, folioStart, folioEnd });

    console.info("[sii]", {
      event: "caf_uploaded",
      userId: auth.user.id,
      documentType: caf.documentType,
      folioStart: caf.folioStart,
      folioEnd: caf.folioEnd,
    });

    return NextResponse.json({
      ok: true,
      message: "CAF cargado correctamente.",
      data: {
        id: caf.id,
        documentType: caf.documentType,
        folioStart: caf.folioStart,
        folioEnd: caf.folioEnd,
        currentFolio: caf.currentFolio,
        isActive: caf.isActive,
        uploadedAt: caf.uploadedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[sii/caf POST]", error);

    return NextResponse.json(
      { ok: false, message: "Error al cargar CAF.", data: null },
      { status: 500 },
    );
  }
}
