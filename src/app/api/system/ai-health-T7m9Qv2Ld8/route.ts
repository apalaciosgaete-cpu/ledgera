import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
      model: process.env.OPENAI_MODEL?.trim() || "gpt-5-mini",
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
