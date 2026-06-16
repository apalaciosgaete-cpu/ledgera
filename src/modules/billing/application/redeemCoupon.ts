import type { RedeemCouponInput } from "@/modules/billing/domain/coupons";
import {
  createCouponRedemption,
  incrementCouponRedemptions,
} from "@/modules/billing/infrastructure/couponRepository";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";

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

  if (input.userId) {
    await recordTimelineEvent({
      userId: input.userId,
      category: "BILLING",
      severity: "SUCCESS",
      title: "Cupón aplicado",
      description: `Aplicaste un cupón de descuento en tu compra.`,
      entityType: "BillingCoupon",
      entityId: input.couponId,
      metadata: { couponId: input.couponId, checkoutId: input.checkoutId },
    });
  }

  return { ok: true };
}
