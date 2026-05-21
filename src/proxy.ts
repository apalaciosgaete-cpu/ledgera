import { NextRequest, NextResponse } from "next/server";

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) return null;

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) return null;

  return token;
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".map") ||
    pathname.endsWith(".woff") ||
    pathname.endsWith(".woff2") ||
    pathname.endsWith(".ttf")
  );
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const publicRoutes = [
    "/",
    "/bienvenida",
    "/login",
    "/register",
    "/planes",
    "/quienes-somos",
    "/preguntas",
    "/blog",
    "/api/login",
    "/api/2fa/login",
    "/api/users",
    "/api/billing/health",
    "/api/billing/mercadopago/webhook",
    "/verify",
    "/api/verify",
  ];

  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isPublic) return NextResponse.next();

  const cookieToken = req.cookies.get("session_token")?.value ?? null;
  const bearerToken = getBearerToken(req);
  const sessionToken = cookieToken ?? bearerToken;

  if (pathname.startsWith("/api")) {
    if (!sessionToken) {
      return NextResponse.json(
        { ok: false, message: "No autorizado" },
        { status: 401 },
      );
    }

    return NextResponse.next();
  }

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/bienvenida", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};