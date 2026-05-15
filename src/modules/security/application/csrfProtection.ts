// src/modules/security/application/csrfProtection.ts

import { NextRequest, NextResponse } from "next/server";

const CSRF_HEADER_NAME = "x-ledgera-csrf";
const CSRF_COOKIE_NAME = "ledgera_csrf";

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

function isSafeMethod(method: string) {
  return SAFE_METHODS.includes(method.toUpperCase());
}

function normalizeToken(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

export function getCsrfCookieName() {
  return CSRF_COOKIE_NAME;
}

export function getCsrfHeaderName() {
  return CSRF_HEADER_NAME;
}

export function generateCsrfToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

export function setCsrfCookie(
  response: NextResponse,
  token: string,
) {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function readCsrfTokenFromRequest(req: NextRequest) {
  return {
    cookieToken: normalizeToken(
      req.cookies.get(CSRF_COOKIE_NAME)?.value,
    ),
    headerToken: normalizeToken(
      req.headers.get(CSRF_HEADER_NAME),
    ),
  };
}

export function validateCsrfRequest(req: NextRequest) {
  if (isSafeMethod(req.method)) {
    return {
      ok: true,
    };
  }

  const { cookieToken, headerToken } =
    readCsrfTokenFromRequest(req);

  if (!cookieToken || !headerToken) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message: "CSRF token requerido.",
          data: {
            code: "CSRF_TOKEN_MISSING",
          },
        },
        { status: 403 },
      ),
    };
  }

  if (!timingSafeEqual(cookieToken, headerToken)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message: "CSRF token inválido.",
          data: {
            code: "CSRF_TOKEN_INVALID",
          },
        },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
  };
}

export function enforceCsrfProtection(req: NextRequest) {
  const validation = validateCsrfRequest(req);

  if (!validation.ok) {
    return validation.response;
  }

  return null;
}