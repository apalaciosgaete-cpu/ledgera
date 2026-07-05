import { NextResponse } from "next/server";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
function hasValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function checkAppUrl(): { configured: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!hasValue(process.env.NEXT_PUBLIC_APP_URL)) {
    missing.push("NEXT_PUBLIC_APP_URL");
  }

  return { configured: missing.length === 0, missing };
}

export async function GET() {
  const appUrl = checkAppUrl();

  const allMissing = [...appUrl.missing];
  const healthy = allMissing.length === 0;

  return NextResponse.json(
    {
      ok: healthy,
      message: healthy
        ? "Billing configurado correctamente."
        : "Billing requiere variables de entorno.",
      data: {
        healthy,
        app: { appUrlConfigured: appUrl.configured, missing: appUrl.missing },
        missing: allMissing,
      },
    },
    { status: healthy ? 200 : 503 },
  );
}
