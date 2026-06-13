import type { RedeemCouponInput } from "@/modules/billing/domain/coupons";
import {
  createCouponRedemption,
  incrementCouponRedemptions,
} from "@/modules/billing/infrastructure/couponRepository";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";

export async function redeemCoupon(
  input: RedeemCouponInput,
): Promise<{ ok: true }> {
  await createCouponRedemption(input);
  await incrementCouponRedemptions(input.couponId);

  await recordAuditEvent({
    userId: input.userId ?? null,
    category: "BILLING",
    severity: "INFO",
    event: "coupon_redeemed",
    description: `Cupón ${input.couponId} redimido`,
    result: "SUCCESS",
    entityType: "BillingCoupon",
    entityId: input.couponId,
    metadata: { couponId: input.couponId, userId: input.userId, checkoutId: input.checkoutId },
  });

  return { ok: true };
}
