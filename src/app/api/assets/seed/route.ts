import { NextResponse } from "next/server";
import {

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
  createAsset,
  getAssetBySymbol,
} from "@/modules/portfolio/infrastructure/assetRepository";

const baseAssets = [
  { symbol: "BTC", name: "Bitcoin", decimals: 8 },
  { symbol: "ETH", name: "Ethereum", decimals: 18 },
  { symbol: "USDT", name: "Tether USD", decimals: 6 },
];

export async function POST() {
  try {
    const created = [];
    const skipped = [];

    for (const asset of baseAssets) {
      const existing = await getAssetBySymbol(asset.symbol);

      if (existing) {
        skipped.push(asset.symbol);
        continue;
      }

      const newAsset = await createAsset(asset);
      created.push(newAsset.symbol);
    }

    return NextResponse.json(
      {
        ok: true,
        created,
        skipped,
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