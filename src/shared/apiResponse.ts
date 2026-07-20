import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import {
  FREE_MOVEMENT_LIMIT,
  isMovementLimitError,
} from "@/modules/subscription/application/enforceMovementLimit";

export function ok<T>(data: T, message = "OK", status = 200) {
  return NextResponse.json(
    {
      ok: true,
      message,
      data,
    },
    { status },
  );
}

export function fail(message = "Error", status = 400, data: unknown = null) {
  return NextResponse.json(
    {
      ok: false,
      message,
      data,
    },
    { status },
  );
}

export function serverError(error: unknown) {
  console.error(error);

  if (isMovementLimitError(error)) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error
          ? error.message
          : `El plan Gratuito permite hasta ${FREE_MOVEMENT_LIMIT} movimientos.`,
        data: {
          code: "FREE_MOVEMENT_LIMIT",
          limit: FREE_MOVEMENT_LIMIT,
          currentCount: "currentCount" in error ? error.currentCount : null,
          requestedCount: "requestedCount" in error ? error.requestedCount : null,
        },
      },
      { status: 403 },
    );
  }

  Sentry.captureException(error);

  return NextResponse.json(
    {
      ok: false,
      message: "Error interno del servidor.",
      data: null,
    },
    { status: 500 },
  );
}
