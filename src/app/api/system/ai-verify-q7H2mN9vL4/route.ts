import { NextResponse } from "next/server";

import { generateAssistantAiReply } from "@/modules/assistant/application/generateAssistantAiReply";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  try {
    const reply = await generateAssistantAiReply({
      pathname: "/",
      isAuthenticated: false,
      context: null,
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
        understoodFollowUp: /import|normaliz|operacion|movimiento/i.test(reply.text),
        text: reply.text,
        model: reply.model,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "unknown",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
