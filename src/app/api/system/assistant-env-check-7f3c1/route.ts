import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      groqConfigured: Boolean(process.env.GROQ_API_KEY?.trim()),
      openAiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
      gatewayConfigured: Boolean(
        process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim(),
      ),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
