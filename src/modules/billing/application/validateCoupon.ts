import {
  calculateCouponDiscount,
  type BillingCoupon,
  type ValidateCouponInput,
  type ValidateCouponResult,
} from "@/modules/billing/domain/coupons";
import { findCouponByCode } from "@/modules/billing/infrastructure/couponRepository";

export async function validateCoupon(
  input: ValidateCouponInput,
): Promise<ValidateCouponResult> {
  const coupon = await findCouponByCode(input.code);

  if (!coupon) {
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: input.amount,
      message: "Cupón no encontrado.",
    };
  }

  if (coupon.status === "DISABLED") {
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: input.amount,
      message: "El cupón está deshabilitado.",
    };
  }

  if (coupon.status === "EXPIRED") {
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: input.amount,
      message: "El cupón ha expirado.",
    };
  }

  const now = new Date();

  if (now < coupon.validFrom) {
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: input.amount,
      message: "El cupón aún no está vigente.",
    };
  }

  if (coupon.validUntil && now > coupon.validUntil) {
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: input.amount,
      message: "El cupón ha expirado.",
    };
  }

  if (
    coupon.applicablePlans.length > 0 &&
    !coupon.applicablePlans.includes(input.plan)
  ) {
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: input.amount,
      message: "El cupón no aplica para este plan.",
    };
  }

  if (
    coupon.maxRedemptions !== null &&
    coupon.currentRedemptions >= coupon.maxRedemptions
  ) {
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: input.amount,
      message: "El cupón ha alcanzado su límite de uso.",
    };
  }

  const discountAmount = calculateCouponDiscount(coupon, input.amount);
  const finalAmount = Math.max(input.amount - discountAmount, 0);

  return {
    valid: true,
    coupon,
    discountAmount,
    finalAmount,
  };
}

export type { BillingCoupon };
