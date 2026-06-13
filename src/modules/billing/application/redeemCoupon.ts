import type { RedeemCouponInput } from "@/modules/billing/domain/coupons";
import {
  createCouponRedemption,
  incrementCouponRedemptions,
} from "@/modules/billing/infrastructure/couponRepository";

export async function redeemCoupon(
  input: RedeemCouponInput,
): Promise<{ ok: true }> {
  await createCouponRedemption(input);
  await incrementCouponRedemptions(input.couponId);

  return { ok: true };
}
