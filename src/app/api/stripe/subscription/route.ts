import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getStripeFieldsByUserId } from "@/modules/identity/infrastructure/userRepository";

export async function GET(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 401 });

  const stripeData = await getStripeFieldsByUserId(auth.user.id);
  if (!stripeData?.stripeSubscriptionId) {
    return NextResponse.json({ ok: true, data: null });
  }

  const sub = await stripe.subscriptions.retrieve(stripeData.stripeSubscriptionId, {
    expand: ["default_payment_method"],
  });

  const item      = sub.items.data[0];
  const periodEnd = item?.current_period_end ?? sub.billing_cycle_anchor;
  const pm        = sub.default_payment_method as import("stripe").Stripe.PaymentMethod | null;

  return NextResponse.json({
    ok: true,
    data: {
      status:            sub.status,
      currentPeriodEnd:  new Date(periodEnd * 1000).toISOString(),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      card: pm?.card ? {
        brand:    pm.card.brand,
        last4:    pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear:  pm.card.exp_year,
      } : null,
    },
  });
}
