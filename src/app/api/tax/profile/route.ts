import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail } from "@/shared/apiResponse";
import { prisma } from "@/lib/prisma";
import { validateRut } from "@/modules/tax/application/validateRut";
import type { TaxDocumentType } from "@/modules/tax/domain/taxProfile";
import {
  getTaxProfileByUserId,
  upsertTaxProfile,
} from "@/modules/tax/infrastructure/taxProfileRepository";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const profile = await getTaxProfileByUserId(auth.user.id);

    if (!profile) {
      return NextResponse.json({
        ok: true,
        message: "Perfil tributario no encontrado.",
        data: null,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Perfil tributario obtenido correctamente.",
      data: {
        id: profile.id,
        documentType: profile.documentType,
        rut: profile.rut,
        legalName: profile.legalName,
        businessActivity: profile.businessActivity,
        address: profile.address,
        commune: profile.commune,
        city: profile.city,
        dteEmail: profile.dteEmail,
        isValidated: profile.isValidated,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[tax/profile GET]", error);

    return NextResponse.json(
      { ok: false, message: "Error al obtener perfil tributario.", data: null },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = (await request.json()) as {
      documentType?: string;
      rut?: string;
      legalName?: string;
      businessActivity?: string | null;
      address?: string;
      commune?: string;
      city?: string;
      dteEmail?: string;
    };

    const documentType =
      body.documentType === "BOLETA" || body.documentType === "FACTURA"
        ? body.documentType
        : null;
    const rut = typeof body.rut === "string" ? body.rut.trim() : "";
    const legalName =
      typeof body.legalName === "string" ? body.legalName.trim() : "";
    const businessActivity =
      typeof body.businessActivity === "string"
        ? body.businessActivity.trim()
        : null;
    const address = typeof body.address === "string" ? body.address.trim() : "";
    const commune = typeof body.commune === "string" ? body.commune.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const dteEmail =
      typeof body.dteEmail === "string" ? body.dteEmail.trim() : "";

    if (!documentType || !rut || !legalName || !address || !commune || !city || !dteEmail) {
      return NextResponse.json(
        { ok: false, message: "Todos los campos obligatorios son requeridos.", data: null },
        { status: 400 },
      );
    }

    const rutValidation = validateRut(rut);
    if (!rutValidation.valid) {
      return NextResponse.json(
        { ok: false, message: rutValidation.message ?? "RUT inválido.", data: null },
        { status: 400 },
      );
    }

    const dbUser = await prisma.users.findUnique({
      where: { id: auth.user.id },
      select: { subscription_plan: true },
    });
    const plan = dbUser?.subscription_plan ?? "BASICO";
    const canUseInvoice = plan === "PROFESIONAL" || plan === "EMPRESA";

    if (documentType === "FACTURA" && !canUseInvoice) {
      return NextResponse.json(
        {
          ok: false,
          message: "El plan actual solo permite Boleta Electrónica.",
          data: null,
        },
        { status: 403 },
      );
    }

    const profile = await upsertTaxProfile({
      userId: auth.user.id,
      documentType: documentType as TaxDocumentType,
      rut: rutValidation.normalized ?? rut,
      legalName,
      businessActivity,
      address,
      commune,
      city,
      dteEmail,
    });

    console.info("[commercial]", {
      event: "tax_profile_saved",
      userId: auth.user.id,
      documentType: profile.documentType,
      isValidated: profile.isValidated,
    });

    return NextResponse.json({
      ok: true,
      message: "Perfil tributario guardado correctamente.",
      data: {
        id: profile.id,
        documentType: profile.documentType,
        rut: profile.rut,
        legalName: profile.legalName,
        businessActivity: profile.businessActivity,
        address: profile.address,
        commune: profile.commune,
        city: profile.city,
        dteEmail: profile.dteEmail,
        isValidated: profile.isValidated,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[tax/profile POST]", error);

    return NextResponse.json(
      { ok: false, message: "Error al guardar perfil tributario.", data: null },
      { status: 500 },
    );
  }
}
