import { NextResponse } from "next/server";

import { FxRateService } from "@/services/fxRateService";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await FxRateService.syncDailyRate();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[cron/fx-rate]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
