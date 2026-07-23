import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/shared";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";
import { buildAssistantAccountContext } from "@/modules/assistant/application/buildAssistantAccountContext";
import {
  generateAssistantAiReply,
  type AssistantAiMessage,
} from "@/modules/assistant/application/generateAssistantAiReply";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_TOTAL_LENGTH = 7000;

function sanitizePathname(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  return value.slice(0, 180).split("?")[0] || "/";
}

function sanitizeMessages(value: unknown): AssistantAiMessage[] {
  if (!Array.isArray(value)) return [];

  const messages = value
    .slice(-MAX_MESSAGES)
    .flatMap((item): AssistantAiMessage[] => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Record<string, unknown>;
      if (candidate.role !== "user" && candidate.role !== "assistant") return [];
      if (typeof candidate.text !== "string") return [];
      const text = candidate.text.trim().slice(0, MAX_MESSAGE_LENGTH);
      return text ? [{ role: candidate.role, text }] : [];
    });

  let totalLength = 0;
  const bounded: AssistantAiMessage[] = [];
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message) continue;
    if (totalLength + message.text.length > MAX_TOTAL_LENGTH) break;
    bounded.unshift(message);
    totalLength += message.text.length;
  }

  return bounded;
}

export async function POST(request: NextRequest) {
  const rateLimited = enforceRequestRateLimit(request, {
    scope: "assistant-ai-chat",
    maxAttempts: 12,
    windowMs: 60_000,
  });
  if (rateLimited) return rateLimited;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const messages = sanitizeMessages(body.messages);
    const pathname = sanitizePathname(body.pathname);

    if (!messages.length || messages[messages.length - 1]?.role !== "user") {
      return NextResponse.json(
        { ok: false, message: "La conversación no contiene una pregunta válida." },
        { status: 400 },
      );
    }

    const session = await getSession(request);
    const context = session
      ? await buildAssistantAccountContext(session.user.id)
      : null;

    const reply = await generateAssistantAiReply({
      messages,
      pathname,
      isAuthenticated: Boolean(session),
      context,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          text: reply.text,
          links: reply.links,
          meta: reply.meta,
          engine: "ai",
        },
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("[assistant-ai]", message);

    return NextResponse.json(
      {
        ok: false,
        message: "El chatbot IA no está disponible temporalmente.",
        data: { code: "AI_UNAVAILABLE" },
      },
      {
        status: 503,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  }
}
