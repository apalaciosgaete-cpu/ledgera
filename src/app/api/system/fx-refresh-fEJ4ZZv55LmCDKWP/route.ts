import { NextResponse } from "next/server";

import { FxRateService } from "@/services/fxRateService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ONE_TIME_TOKEN = "fEJ4ZZv55LmCDKWPkRHhZU5UKzPo0h6Lg4os73hXA14";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (token !== ONE_TIME_TOKEN) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const usdClp = await FxRateService.syncDailyRate();
    return NextResponse.json({ success: true, usdClp });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
