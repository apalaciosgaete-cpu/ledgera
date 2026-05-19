import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { updateUserSubscription } from "@/modules/identity/infrastructure/userRepository";
import type { SubscriptionPlan } from "@/modules/identity/domain/user";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

const VALID_PLANS = new Set<SubscriptionPlan>(["PERSONAL", "PROFESIONAL", "EMPRESA"]);

function expiresAt(billing: string): Date {
  const d = new Date();
  if (billing === "annual") {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  const secret    = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ ok: false, message: "Webhook secret no configurado." }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("[stripe/webhook] Firma inválida:", err);
    return NextResponse.json({ ok: false, message: "Firma inválida." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session  = event.data.object;
    const userId   = session.metadata?.userId;
    const planKey  = session.metadata?.subscriptionPlan as SubscriptionPlan | undefined;
    const billing  = session.metadata?.billing ?? "monthly";

    if (!userId || !planKey || !VALID_PLANS.has(planKey)) {
      console.error("[stripe/webhook] Metadata inválida:", session.metadata);
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await updateUserSubscription({
      userId,
      plan:      planKey,
      expiresAt: expiresAt(billing),
    });

    console.log(`[stripe/webhook] Suscripción actualizada: userId=${userId} plan=${planKey} billing=${billing}`);
  }

  return NextResponse.json({ ok: true });
}
