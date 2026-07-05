import crypto from "node:crypto";

import { NextRequest, NextResponse } from "next/server";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export const runtime = "nodejs";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const OAUTH_STATE_COOKIE = "ledgera_google_oauth_state";

function resolveBaseUrl(req: NextRequest): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return req.nextUrl.origin;
}

function resolveRedirectUri(req: NextRequest): string {
  return (
    process.env.GOOGLE_REDIRECT_URI ??
    `${resolveBaseUrl(req)}/api/auth/google/callback`
  );
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      {
        ok: false,
        message: "GOOGLE_CLIENT_ID no está configurado.",
        data: null,
      },
      { status: 500 },
    );
  }

  const state = crypto.randomBytes(24).toString("hex");
  const redirectUri = resolveRedirectUri(req);

  const authorizationUrl = new URL(GOOGLE_AUTH_URL);
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("access_type", "offline");
  authorizationUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authorizationUrl);

  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });

  return response;
}
