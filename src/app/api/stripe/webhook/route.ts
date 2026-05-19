import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, PRICE_TO_PLAN } from "@/lib/stripe";
import {
  getUserByStripeCustomerId,
  getUserByEmail,
  updateUserStripeSubscription,
  updateUserSubscription,
} from "@/modules/identity/infrastructure/userRepository";
import type { SubscriptionPlan } from "@/modules/identity/domain/user";

function subPeriodEnd(sub: Stripe.Subscription): Date {
  const item = sub.items.data[0];
  const ts   = item?.current_period_end ?? sub.billing_cycle_anchor;
  return new Date(ts * 1000);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig     = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
    }
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan   = session.metadata?.plan as SubscriptionPlan;
  if (!userId || !plan || !session.subscription || !session.customer) return;

  const sub = await stripe.subscriptions.retrieve(session.subscription as string);
  await updateUserStripeSubscription({
    userId,
    stripeCustomerId:     session.customer as string,
    stripeSubscriptionId: sub.id,
    stripePriceId:        sub.items.data[0]?.price.id ?? "",
    stripeStatus:         sub.status,
    plan,
    expiresAt:            subPeriodEnd(sub),
  });
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const user = await getUserByStripeCustomerId(sub.customer as string);
  if (!user) return;

  const priceId = sub.items.data[0]?.price.id ?? "";
  const plan    = (PRICE_TO_PLAN[priceId] as SubscriptionPlan) ?? "BASICO";

  await updateUserStripeSubscription({
    userId:               user.id,
    stripeCustomerId:     sub.customer as string,
    stripeSubscriptionId: sub.id,
    stripePriceId:        priceId,
    stripeStatus:         sub.status,
    plan,
    expiresAt:            subPeriodEnd(sub),
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const user = await getUserByStripeCustomerId(sub.customer as string);
  if (!user) return;
  await updateUserSubscription({ userId: user.id, plan: "BASICO", expiresAt: new Date() });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subId     = invoice.parent?.subscription_details?.subscription;
  const customerId = invoice.customer as string | null;
  if (!subId || !customerId) return;

  const sub  = await stripe.subscriptions.retrieve(subId as string);
  const user = await getUserByStripeCustomerId(customerId);

  const priceId = sub.items.data[0]?.price.id ?? "";
  const plan    = (PRICE_TO_PLAN[priceId] as SubscriptionPlan) ?? "BASICO";
  const payload = {
    stripeCustomerId:     customerId,
    stripeSubscriptionId: sub.id,
    stripePriceId:        priceId,
    stripeStatus:         sub.status,
    plan,
    expiresAt:            subPeriodEnd(sub),
  };

  if (user) {
    await updateUserStripeSubscription({ userId: user.id, ...payload });
    return;
  }

  if (invoice.customer_email) {
    const byEmail = await getUserByEmail(invoice.customer_email);
    if (byEmail) await updateUserStripeSubscription({ userId: byEmail.id, ...payload });
  }
}
