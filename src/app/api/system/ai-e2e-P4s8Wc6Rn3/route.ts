import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const oidcToken = request.headers.get("x-vercel-oidc-token")?.trim();
  if (!oidcToken) {
    return NextResponse.json(
      { ok: false, oidcHeaderPresent: false, message: "OIDC no disponible." },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }

  const response = await fetch("https://ai-gateway.vercel.sh/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${oidcToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      model: "openai/gpt-5-mini",
      store: false,
      input: "Responde únicamente: OK",
      max_output_tokens: 20,
    }),
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  const safeError =
    payload && typeof payload === "object" && "error" in payload
      ? (payload as { error?: { message?: unknown; type?: unknown; code?: unknown } }).error
      : null;

  return NextResponse.json(
    {
      ok: response.ok,
      providerStatus: response.status,
      oidcHeaderPresent: true,
      error: response.ok
        ? null
        : {
            message: typeof safeError?.message === "string" ? safeError.message.slice(0, 500) : null,
            type: typeof safeError?.type === "string" ? safeError.type : null,
            code: typeof safeError?.code === "string" ? safeError.code : null,
          },
    },
    {
      status: response.ok ? 200 : 500,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
