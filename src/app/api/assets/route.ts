import { NextResponse } from "next/server";
import { getAssets } from "@/modules/portfolio/infrastructure/assetRepository";

export async function GET() {
  try {
    const assets = await getAssets();

    return NextResponse.json(
      {
        ok: true,
        count: assets.length,
        data: assets,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}