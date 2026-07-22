export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { sendFeedbackEmail } from "@/lib/emails/feedback";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";

const MAX_ANSWER_LENGTH = 1200;
const MAX_REQUEST_BYTES = 20_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(req: NextRequest) {
  const csrfResponse = enforceCsrfProtection(req);
  if (csrfResponse) return csrfResponse;

  const rateLimitResponse = enforceRequestRateLimit(req, {
    scope: "public-opinion",
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json(
      { ok: false, message: "La opinión supera el tamaño permitido.", data: null },
      { status: 413 },
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "La solicitud no es válida.", data: null },
      { status: 400 },
    );
  }

  if (typeof parsedBody !== "object" || parsedBody === null || Array.isArray(parsedBody)) {
    return NextResponse.json(
      { ok: false, message: "La solicitud no es válida.", data: null },
      { status: 400 },
    );
  }

  const body = parsedBody as Record<string, unknown>;

  if (readText(body.website, 200)) {
    return NextResponse.json({ ok: true, message: "Opinión recibida.", data: null });
  }

  const feedback = {
    expectation: readText(body.expectation, MAX_ANSWER_LENGTH),
    useful: readText(body.useful, MAX_ANSWER_LENGTH),
    clarity: readText(body.clarity, MAX_ANSWER_LENGTH),
    feature: readText(body.feature, MAX_ANSWER_LENGTH),
    contactRequested: body.contactRequested === true,
    email: readText(body.email, 254).toLowerCase(),
  };

  const hasAnswer = [feedback.expectation, feedback.useful, feedback.clarity, feedback.feature]
    .some((answer) => answer.length >= 3);

  if (!hasAnswer) {
    return NextResponse.json(
      { ok: false, message: "Escribe al menos una respuesta para poder enviarla.", data: null },
      { status: 400 },
    );
  }

  if (feedback.contactRequested && !EMAIL_PATTERN.test(feedback.email)) {
    return NextResponse.json(
      { ok: false, message: "Ingresa un correo de contacto válido.", data: null },
      { status: 400 },
    );
  }

  if (!feedback.contactRequested) {
    feedback.email = "";
  }

  try {
    const result = await sendFeedbackEmail(feedback);
    if (!result) {
      return NextResponse.json(
        { ok: false, message: "El servicio de opiniones no está disponible temporalmente.", data: null },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Gracias. Tu opinión fue enviada correctamente.",
      data: null,
    });
  } catch (error) {
    console.error(
      "[api/opinion] No fue posible enviar la opinión:",
      error instanceof Error ? error.message : "error desconocido",
    );
    return NextResponse.json(
      { ok: false, message: "No pudimos enviar tu opinión. Intenta nuevamente.", data: null },
      { status: 502 },
    );
  }
}
