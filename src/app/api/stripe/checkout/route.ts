import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { stripe, getStripePrice, PLAN_KEY_TO_SUBSCRIPTION, type PaidPlan, type BillingPeriod } from "@/lib/stripe";

const PAID_PLANS  = new Set<PaidPlan>(["personal", "contador", "empresa"]);
const BILLINGS    = new Set<BillingPeriod>(["monthly", "annual"]);

function getAppUrl(req: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getSessionFromRequest(req);
    if (!auth) {
      return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const plan    = body.plan    as string;
    const billing = body.billing as string;

    if (!PAID_PLANS.has(plan as PaidPlan)) {
      return NextResponse.json({ ok: false, message: "Plan inválido." }, { status: 400 });
    }
    if (!BILLINGS.has(billing as BillingPeriod)) {
      return NextResponse.json({ ok: false, message: "Período de facturación inválido." }, { status: 400 });
    }

    const priceId = getStripePrice(plan as PaidPlan, billing as BillingPeriod);
    const appUrl  = getAppUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: auth.user.email,
      success_url: `${appUrl}/portafolio?upgraded=1`,
      cancel_url:  `${appUrl}/planes`,
      metadata: {
        userId:           auth.user.id,
        plan:             plan,
        billing:          billing,
        subscriptionPlan: PLAN_KEY_TO_SUBSCRIPTION[plan as PaidPlan],
      },
      subscription_data: {
        metadata: {
          userId: auth.user.id,
          plan:   plan,
        },
      },
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    const msg   = error instanceof Error ? error.message : String(error);
    const type  = (error as Record<string, unknown>)?.type  ?? "unknown";
    const code  = (error as Record<string, unknown>)?.code  ?? "none";
    const param = (error as Record<string, unknown>)?.param ?? "none";
    console.error("[stripe/checkout] type=" + type + " code=" + code + " param=" + param + " msg=" + msg);
    return NextResponse.json(
      { ok: false, message: msg || "No se pudo crear la sesión de pago." },
      { status: 500 },
    );
  }
}
