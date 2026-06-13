import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/modules/billing/application/validateCoupon";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      code?: string;
      plan?: string;
      amount?: number;
    };

    const code = typeof body.code === "string" ? body.code.trim() : "";
    const plan = typeof body.plan === "string" ? body.plan.trim() : "";
    const amount = typeof body.amount === "number" ? body.amount : 0;

    if (!code) {
      return NextResponse.json(
        { ok: false, message: "El código de cupón es requerido.", data: null },
        { status: 400 },
      );
    }

    if (!plan) {
      return NextResponse.json(
        { ok: false, message: "El plan es requerido.", data: null },
        { status: 400 },
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { ok: false, message: "El monto debe ser mayor a cero.", data: null },
        { status: 400 },
      );
    }

    const result = await validateCoupon({ code, plan, amount });

    console.info("[commercial]", {
      event: "coupon_validated",
      code,
      plan,
      amount,
      valid: result.valid,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
    });

    if (!result.valid) {
      return NextResponse.json(
        {
          ok: false,
          message: result.message ?? "Cupón inválido.",
          data: null,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Cupón válido.",
      data: {
        coupon: {
          id: result.coupon?.id,
          code: result.coupon?.code,
          name: result.coupon?.name,
          type: result.coupon?.type,
          value: result.coupon?.value,
        },
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
      },
    });
  } catch (error) {
    console.error("[billing/coupons/validate POST]", error);

    return NextResponse.json(
      { ok: false, message: "No fue posible validar el cupón.", data: null },
      { status: 500 },
    );
  }
}
