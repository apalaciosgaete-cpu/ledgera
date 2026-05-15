import { NextRequest, NextResponse } from "next/server";

import {
  generateCsrfToken,
  setCsrfCookie,
} from "@/modules/security/application/csrfProtection";

export async function GET(_req: NextRequest) {
  try {
    const token = generateCsrfToken();

    const response = NextResponse.json({
      ok: true,
      data: {
        csrfInitialized: true,
      },
    });

    setCsrfCookie(response, token);

    return response;
  } catch (error) {
    console.error("CSRF_INIT_ERROR", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible inicializar protección CSRF.",
      },
      {
        status: 500,
      },
    );
  }
}