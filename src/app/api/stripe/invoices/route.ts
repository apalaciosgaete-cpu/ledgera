import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getStripeFieldsByUserId } from "@/modules/identity/infrastructure/userRepository";

export async function GET(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const stripeData = await getStripeFieldsByUserId(auth.user.id);
  if (!stripeData?.stripeCustomerId) {
    return NextResponse.json({ ok: true, data: [] });
  }

  const invoices = await stripe.invoices.list({
    customer: stripeData.stripeCustomerId,
    limit:    24,
  });

  const data = invoices.data.map(inv => ({
    id:                  inv.id,
    created:             inv.created,
    amount_paid:         inv.amount_paid,
    currency:            inv.currency,
    status:              inv.status,
    hosted_invoice_url:  inv.hosted_invoice_url ?? null,
    description:         inv.description ?? null,
    period_start:        inv.period_start,
    period_end:          inv.period_end,
  }));

  return NextResponse.json({ ok: true, data });
}
