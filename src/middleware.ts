import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "session_token";
const CSRF_COOKIE = "ledgera_csrf";
const CSRF_HEADER = "x-ledgera-csrf";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 180;

const MAINTENANCE_PATH = "/mantenimiento";

function isMaintenanceMode() {
  const value = process.env.SITE_MAINTENANCE_MODE?.trim().toLowerCase();
  const disabled = value === "false" || value === "0";
  return process.env.NODE_ENV === "production" && !disabled;
}

function enforceMaintenanceMode(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (!isMaintenanceMode()) return null;
  if (pathname === MAINTENANCE_PATH || pathname.startsWith(`${MAINTENANCE_PATH}/`)) return null;
  if (pathname.startsWith("/api/")) return null;

  const maintenanceUrl = req.nextUrl.clone();
  maintenanceUrl.pathname = MAINTENANCE_PATH;
  maintenanceUrl.search = "";

  return NextResponse.rewrite(maintenanceUrl, {
    status: 503,
    headers: {
      "Retry-After": "3600",
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
    },
  });
}

const protectedPagePrefixes = [
  "/panel",
  "/origen-fondos",
  "/cryptoactivos",
  "/obligaciones-tributarias",
  "/declaraciones",
  "/configuracion",
  "/ayuda",
  "/onboarding",
  "/importaciones",
  "/documentacion",
  "/casos",
];

const csrfBypassApiPrefixes = [
  "/api/csrf",
  "/api/billing/webhook",
  "/api/auth/google",
  "/api/verify",
  "/api/health",
];

const publicPagePrefixes = [
  "/",
  "/bienvenida",
  "/login",
  "/register",
  "/blocked",
  "/verify",
  "/blog",
  "/terminos",
  "/privacidad",
  "/cookies",
  "/preguntas",
  "/planes",
  "/como-funciona",
  "/quienes-somos",
  "/mantenimiento",
];

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitBucket>();

function isMutationMethod(method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

function pathStarts(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicPage(pathname: string) {
  if (pathname === "/") return true;
  return pathStarts(pathname, publicPagePrefixes.filter((prefix) => prefix !== "/"));
}

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function enforceRateLimit(req: NextRequest) {
  const now = Date.now();
  const key = `${getClientIp(req)}:${req.nextUrl.pathname}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  current.count += 1;

  if (current.count <= RATE_LIMIT_MAX_REQUESTS) {
    return null;
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));

  return NextResponse.json(
    {
      ok: false,
      message: "Demasiadas solicitudes. Intenta nuevamente más tarde.",
      data: {
        code: "RATE_LIMITED",
        retryAfterSeconds,
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}

function enforceCsrf(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (!pathname.startsWith("/api/")) return null;
  if (!isMutationMethod(req.method)) return null;
  if (pathStarts(pathname, csrfBypassApiPrefixes)) return null;

  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value?.trim() ?? "";
  const headerToken = req.headers.get(CSRF_HEADER)?.trim() ?? "";

  if (!cookieToken || !headerToken) {
    return NextResponse.json(
      {
        ok: false,
        message: "CSRF token requerido.",
        data: { code: "CSRF_TOKEN_MISSING" },
      },
      { status: 403 },
    );
  }

  if (!timingSafeEqual(cookieToken, headerToken)) {
    return NextResponse.json(
      {
        ok: false,
        message: "CSRF token inválido.",
        data: { code: "CSRF_TOKEN_INVALID" },
      },
      { status: 403 },
    );
  }

  return null;
}

function setCsrfCookieIfMissing(req: NextRequest, response: NextResponse) {
  if (req.cookies.get(CSRF_COOKIE)?.value) return response;

  response.cookies.set(CSRF_COOKIE, crypto.randomUUID().replace(/-/g, ""), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

function enforceProtectedPages(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (!pathStarts(pathname, protectedPagePrefixes)) return null;

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  if (hasSession) return null;

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export function middleware(req: NextRequest) {
  const maintenanceResponse = enforceMaintenanceMode(req);
  if (maintenanceResponse) return maintenanceResponse;

  const rateLimitResponse = enforceRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const csrfResponse = enforceCsrf(req);
  if (csrfResponse) return csrfResponse;

  const protectedResponse = enforceProtectedPages(req);
  if (protectedResponse) return protectedResponse;

  const response = NextResponse.next();

  if (!req.nextUrl.pathname.startsWith("/api/") && isPublicPage(req.nextUrl.pathname)) {
    return setCsrfCookieIfMissing(req, response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|opengraph-image|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|xml)).*)",
  ],
};
