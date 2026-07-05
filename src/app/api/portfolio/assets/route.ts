import { NextResponse } from "next/server";
import { getSessionByToken } from "@/modules/identity/infrastructure/sessionRepository";
import { getPortfolioByUserId } from "@/modules/portfolio/infrastructure/portfolioRepository";
import { getAssetBySymbol } from "@/modules/portfolio/infrastructure/assetRepository";
import { addPortfolioAsset } from "@/modules/portfolio/infrastructure/portfolioAssetRepository";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { ok: false, error: "Missing Authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const session = await getSessionByToken(token);

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Invalid session" },
        { status: 401 }
      );
    }

    if (new Date(session.expiresAt) < new Date()) {
      return NextResponse.json(
        { ok: false, error: "Session expired" },
        { status: 401 }
      );
    }

    const portfolio = await getPortfolioByUserId(session.userId);

    if (!portfolio) {
      return NextResponse.json(
        { ok: false, error: "Portfolio not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { symbol, quantity, averageCost } = body;

    if (!symbol) {
      return NextResponse.json(
        { ok: false, error: "Missing field: symbol" },
        { status: 400 }
      );
    }

    const asset = await getAssetBySymbol(symbol);

    if (!asset) {
      return NextResponse.json(
        { ok: false, error: "Asset not found" },
        { status: 404 }
      );
    }

    const portfolioAsset = await addPortfolioAsset({
      portfolioId: portfolio.id,
      assetId: asset.id,
      quantity: quantity ?? "0",
      averageCost: averageCost ?? "0",
    });

    return NextResponse.json(
      {
        ok: true,
        data: portfolioAsset,
      },
      { status: 201 }
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