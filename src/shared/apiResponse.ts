import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

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