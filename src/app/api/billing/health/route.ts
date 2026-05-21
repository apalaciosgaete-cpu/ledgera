import { NextResponse } from "next/server";

function hasValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function checkMercadoPago(): { configured: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!hasValue(process.env.MERCADOPAGO_ACCESS_TOKEN)) {
    missing.push("MERCADOPAGO_ACCESS_TOKEN");
  }

  return { configured: missing.length === 0, missing };
}

function checkAppUrl(): { configured: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!hasValue(process.env.NEXT_PUBLIC_APP_URL)) {
    missing.push("NEXT_PUBLIC_APP_URL");
  }

  return { configured: missing.length === 0, missing };
}

export async function GET() {
  const mercadoPago = checkMercadoPago();
  const appUrl = checkAppUrl();

  const allMissing = [...mercadoPago.missing, ...appUrl.missing];
  const healthy = allMissing.length === 0;

  return NextResponse.json(
    {
      ok: healthy,
      message: healthy
        ? "Billing configurado correctamente."
        : "Billing requiere variables de entorno.",
      data: {
        healthy,
        providers: { mercadoPago },
        app: { appUrlConfigured: appUrl.configured, missing: appUrl.missing },
        missing: allMissing,
      },
    },
    { status: healthy ? 200 : 503 },
  );
}
