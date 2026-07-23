import { NextRequest, NextResponse } from "next/server";

import { generateAssistantAiReply } from "@/modules/assistant/application/generateAssistantAiReply";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const reply = await generateAssistantAiReply({
      pathname: "/",
      isAuthenticated: false,
      context: null,
      oidcToken: request.headers.get("x-vercel-oidc-token"),
      messages: [
        { role: "user", text: "¿Para qué sirve LEDGERA?" },
        {
          role: "assistant",
          text: "LEDGERA transforma operaciones de exchanges y archivos en información tributaria trazable.",
        },
        { role: "user", text: "¿Cómo transforma?" },
      ],
    });

    return NextResponse.json(
      {
        ok: true,
        text: reply.text,
        links: reply.links,
        model: reply.model,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Error desconocido",
        oidcHeaderPresent: Boolean(request.headers.get("x-vercel-oidc-token")),
      },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
