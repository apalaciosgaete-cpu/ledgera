import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getStripeFieldsByUserId } from "@/modules/identity/infrastructure/userRepository";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ledgera.cl";

export async function POST(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 401 });

  const stripeData = await getStripeFieldsByUserId(auth.user.id);
  if (!stripeData?.stripeCustomerId) {
    return NextResponse.json({ ok: false, message: "No tienes una suscripción activa de Stripe" }, { status: 404 });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer:   stripeData.stripeCustomerId,
      return_url: `${APP_URL}/planes`,
    });
    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al abrir portal";
    console.error("[stripe/portal]", message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
