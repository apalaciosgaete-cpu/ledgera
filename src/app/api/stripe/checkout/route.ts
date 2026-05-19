import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getStripeFieldsByUserId } from "@/modules/identity/infrastructure/userRepository";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ledgera.cl";

export async function POST(req: NextRequest) {
  try {
    const auth = await getSessionFromRequest(req);
    if (!auth) return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 401 });

    const { plan, billing = "mensual" } = await req.json() as {
      plan: "PERSONAL" | "PROFESIONAL" | "EMPRESA";
      billing?: "mensual" | "anual";
    };

    const priceId = STRIPE_PRICES[plan]?.[billing];
    if (!priceId) {
      return NextResponse.json({ ok: false, message: "Plan no válido o no configurado" }, { status: 400 });
    }

    const stripeData = await getStripeFieldsByUserId(auth.user.id);

    const session = await stripe.checkout.sessions.create({
      mode:          "subscription",
      customer:      stripeData?.stripeCustomerId ?? undefined,
      customer_email: stripeData?.stripeCustomerId ? undefined : auth.user.email,
      line_items:    [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { userId: auth.user.id, plan },
      },
      metadata:     { userId: auth.user.id, plan },
      success_url:  `${APP_URL}/planes?checkout=success`,
      cancel_url:   `${APP_URL}/bienvenida#precios`,
      locale:       "es",
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear sesión de pago";
    if (err && typeof err === "object" && "type" in err) {
      const se = err as { type?: string; code?: string; statusCode?: number };
      console.error("[stripe/checkout]", JSON.stringify({ type: se.type, code: se.code, status: se.statusCode, message }));
    } else {
      console.error("[stripe/checkout]", message);
    }
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
