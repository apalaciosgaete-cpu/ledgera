export type CouponType = "PERCENTAGE" | "FIXED_AMOUNT";

export type CouponStatus = "ACTIVE" | "EXPIRED" | "DISABLED";

export interface BillingCoupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: CouponType;
  value: number;
  maxRedemptions: number | null;
  currentRedemptions: number;
  validFrom: Date;
  validUntil: Date | null;
  applicablePlans: string[];
  status: CouponStatus;
  createdAt: Date;
}

export interface CouponRedemption {
  id: string;
  couponId: string;
  userId: string | null;
  email: string | null;
  checkoutId: string | null;
  redeemedAt: Date;
}

export interface CreateCouponInput {
  code: string;
  name: string;
  description?: string | null;
  type: CouponType;
  value: number;
  maxRedemptions?: number | null;
  validFrom: Date;
  validUntil?: Date | null;
  applicablePlans: string[];
  status?: CouponStatus;
}

export interface ValidateCouponInput {
  code: string;
  plan: string;
  amount: number;
}

export interface ValidateCouponResult {
  valid: boolean;
  coupon?: BillingCoupon;
  discountAmount: number;
  finalAmount: number;
  message?: string;
}

export interface RedeemCouponInput {
  couponId: string;
  userId?: string | null;
  email?: string | null;
  checkoutId?: string | null;
}

export function calculateCouponDiscount(
  coupon: BillingCoupon,
  amount: number,
): number {
  if (coupon.type === "PERCENTAGE") {
    return Math.round((amount * coupon.value) / 100);
  }

  return Math.min(Math.round(coupon.value), amount);
}
