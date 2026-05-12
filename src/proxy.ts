import { NextRequest, NextResponse } from "next/server";

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicRoutes = [
    "/",
    "/bienvenida",
    "/login",
    "/register",
    "/api/login",
    "/api/users",
    "/verify",
    "/api/verify",
  ];

  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublic) return NextResponse.next();

  const cookieToken = req.cookies.get("session_token")?.value ?? null;
  const bearerToken = getBearerToken(req);
  const sessionToken = cookieToken ?? bearerToken;

  if (pathname.startsWith("/api")) {
    if (!sessionToken) {
      return NextResponse.json(
        { ok: false, message: "No autorizado" },
        { status: 401 }
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
  matcher: ["/((?!_next|favicon.ico).*)"],
};
