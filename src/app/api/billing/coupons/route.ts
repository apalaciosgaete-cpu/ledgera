import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import type { CouponType } from "@/modules/billing/domain/coupons";
import { listCoupons, createCoupon } from "@/modules/billing/infrastructure/couponRepository";

function isAdmin(role: string): boolean {
  return role === "admin" || role === "super_admin";
}

export async function GET(request: NextRequest) {
  const auth = await getSessionFromRequest(request);

  if (!auth) {
    return NextResponse.json(
      { ok: false, message: "No autenticado.", data: null },
      { status: 401 },
    );
  }

  if (!isAdmin(auth.user.role)) {
    return NextResponse.json(
      { ok: false, message: "Sin permisos.", data: null },
      { status: 403 },
    );
  }

  try {
    const coupons = await listCoupons();

    return NextResponse.json({
      ok: true,
      message: "Cupones obtenidos correctamente.",
      data: coupons.map((coupon) => ({
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        maxRedemptions: coupon.maxRedemptions,
        currentRedemptions: coupon.currentRedemptions,
        validFrom: coupon.validFrom.toISOString(),
        validUntil: coupon.validUntil?.toISOString() ?? null,
        applicablePlans: coupon.applicablePlans,
        status: coupon.status,
        createdAt: coupon.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[billing/coupons GET]", error);

    return NextResponse.json(
      { ok: false, message: "Error al obtener cupones.", data: null },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await getSessionFromRequest(request);

  if (!auth) {
    return NextResponse.json(
      { ok: false, message: "No autenticado.", data: null },
      { status: 401 },
    );
  }

  if (!isAdmin(auth.user.role)) {
    return NextResponse.json(
      { ok: false, message: "Sin permisos.", data: null },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      code?: string;
      name?: string;
      description?: string | null;
      type?: string;
      value?: number;
      maxRedemptions?: number | null;
      validFrom?: string;
      validUntil?: string | null;
      applicablePlans?: string[];
      status?: string;
    };

    const code = typeof body.code === "string" ? body.code.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const type = body.type === "PERCENTAGE" || body.type === "FIXED_AMOUNT"
      ? body.type
      : null;
    const value = typeof body.value === "number" ? body.value : 0;
    const maxRedemptions =
      typeof body.maxRedemptions === "number" ? body.maxRedemptions : null;
    const validFrom =
      typeof body.validFrom === "string" ? new Date(body.validFrom) : null;
    const validUntil =
      typeof body.validUntil === "string" ? new Date(body.validUntil) : null;
    const applicablePlans = Array.isArray(body.applicablePlans)
      ? body.applicablePlans.filter((p): p is string => typeof p === "string")
      : [];
    const status =
      body.status === "ACTIVE" ||
      body.status === "EXPIRED" ||
      body.status === "DISABLED"
        ? body.status
        : "ACTIVE";

    if (!code || !name || !type || !validFrom || isNaN(validFrom.getTime())) {
      return NextResponse.json(
        { ok: false, message: "Datos de cupón inválidos.", data: null },
        { status: 400 },
      );
    }

    if (value <= 0) {
      return NextResponse.json(
        { ok: false, message: "El valor del cupón debe ser mayor a cero.", data: null },
        { status: 400 },
      );
    }

    if (type === "PERCENTAGE" && value > 100) {
      return NextResponse.json(
        { ok: false, message: "El porcentaje no puede superar 100%.", data: null },
        { status: 400 },
      );
    }

    const coupon = await createCoupon({
      code,
      name,
      description: body.description ?? null,
      type: type as CouponType,
      value,
      maxRedemptions,
      validFrom,
      validUntil,
      applicablePlans,
      status,
    });

    return NextResponse.json({
      ok: true,
      message: "Cupón creado correctamente.",
      data: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        maxRedemptions: coupon.maxRedemptions,
        currentRedemptions: coupon.currentRedemptions,
        validFrom: coupon.validFrom.toISOString(),
        validUntil: coupon.validUntil?.toISOString() ?? null,
        applicablePlans: coupon.applicablePlans,
        status: coupon.status,
        createdAt: coupon.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[billing/coupons POST]", error);

    return NextResponse.json(
      { ok: false, message: "Error al crear el cupón.", data: null },
      { status: 500 },
    );
  }
}
