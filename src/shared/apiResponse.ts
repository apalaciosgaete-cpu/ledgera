import { NextResponse } from "next/server";

export function ok<T>(
  data: T,
  message = "OK",
  status: number = 200
) {
  return NextResponse.json(
    { ok: true, message, data },
    { status }
  );
}

export function fail(
  message: string,
  status: number = 400,
  options?: { code?: string; data?: unknown }
) {
  return NextResponse.json(
    {
      ok: false,
      message,
      code: options?.code ?? null,
      data: options?.data ?? null,
    },
    { status }
  );
}

export function serverError(error: unknown) {
  console.error(error);
  return NextResponse.json(
    {
      ok: false,
      message: "Error interno del servidor",
      code: null,
      data: null,
    },
    { status: 500 }
  );
}