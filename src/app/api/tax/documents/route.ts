import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail } from "@/shared/apiResponse";
import { createTaxDocumentDraft } from "@/modules/tax/application/createTaxDocumentDraft";
import { listTaxDocumentsByUserId } from "@/modules/tax/infrastructure/taxDocumentRepository";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const documents = await listTaxDocumentsByUserId(auth.user.id);

    return NextResponse.json({
      ok: true,
      message: "Documentos tributarios obtenidos.",
      data: { documents },
    });
  } catch (error) {
    console.error("[tax/documents GET]", error);

    return NextResponse.json(
      { ok: false, message: "Error al obtener documentos tributarios.", data: null },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = (await request.json()) as {
      paymentId?: string | null;
      subscriptionId?: string | null;
      description?: string;
      grossAmount?: number;
      discountAmount?: number;
      taxExempt?: boolean;
    };

    const description = typeof body.description === "string" ? body.description.trim() : "Suscripción LEDGERA";
    const grossAmount = Number(body.grossAmount ?? 0);
    const discountAmount = Number(body.discountAmount ?? 0);

    if (!description || !Number.isFinite(grossAmount) || grossAmount <= 0) {
      return NextResponse.json(
        { ok: false, message: "Descripción y monto bruto son obligatorios.", data: null },
        { status: 400 },
      );
    }

    const result = await createTaxDocumentDraft({
      userId: auth.user.id,
      paymentId: body.paymentId ?? null,
      subscriptionId: body.subscriptionId ?? null,
      description,
      grossAmount,
      discountAmount,
      taxExempt: Boolean(body.taxExempt),
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message, data: null },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("[tax/documents POST]", error);

    return NextResponse.json(
      { ok: false, message: "Error al crear documento tributario.", data: null },
      { status: 500 },
    );
  }
}
