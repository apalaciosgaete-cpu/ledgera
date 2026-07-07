// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';

import crypto from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";

import { prisma } from "@/lib/prisma";
import { optionalEnv, requireEnv } from "@/lib/env";
import { hashPassword } from "@/modules/identity/application/passwordHash";
import {
  buildSessionExpirationDate,
  generateSessionToken,
} from "@/modules/identity/application/sessionToken";
import { rotateSessionForUser } from "@/modules/identity/infrastructure/sessionRepository";

export const runtime = "nodejs";

const OAUTH_STATE_COOKIE = "ledgera_google_oauth_state";
const PENDING_2FA_COOKIE = "ledgera_pending_2fa";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const EXTERNAL_FETCH_TIMEOUT_MS = 7000;

function getRegistration2faTokenSecret() {
  return requireEnv("REGISTRATION_2FA_TOKEN_SECRET");
}

function signSetupToken(userId: string, email: string, secret: string) {
  return crypto
    .createHmac("sha256", getRegistration2faTokenSecret())
    .update(`${userId}:${email}:${secret}`)
    .digest("hex");
}

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
};

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXTERNAL_FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function resolveBaseUrl(req: NextRequest): string {
  const configuredUrl = optionalEnv("NEXT_PUBLIC_APP_URL") ?? optionalEnv("APP_URL");

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return req.nextUrl.origin;
}

function resolveRedirectUri(req: NextRequest): string {
  return (
    optionalEnv("GOOGLE_REDIRECT_URI") ??
    `${resolveBaseUrl(req)}/api/auth/google/callback`
  );
}

function redirectToLogin(req: NextRequest, reason: string) {
  const url = new URL("/login", req.nextUrl.origin);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

async function exchangeCodeForAccessToken(req: NextRequest, code: string) {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: resolveRedirectUri(req),
    grant_type: "authorization_code",
  });

  const response = await fetchWithTimeout(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description ??
        data.error ??
        "No fue posible obtener token de Google.",
    );
  }

  return data.access_token;
}

async function fetchGoogleUser(accessToken: string) {
  const response = await fetchWithTimeout(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = (await response.json()) as GoogleUserInfo;

  if (!response.ok || !data.email) {
    throw new Error("Google no entregó un correo válido.");
  }

  if (data.email_verified === false) {
    throw new Error("El correo de Google no está verificado.");
  }

  return {
    googleId: String(data.sub ?? ""),
    email: data.email.trim().toLowerCase(),
    fullName: String(data.name ?? data.email.split("@")[0]).trim(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const storedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

    if (!code || !state || !storedState || state !== storedState) {
      return redirectToLogin(req, "google_state_invalid");
    }

    const accessToken = await exchangeCodeForAccessToken(req, code);
    const googleUser = await fetchGoogleUser(accessToken);

    let user = await prisma.users.findUnique({
      where: {
        email: googleUser.email,
      },
    });

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await hashPassword(randomPassword);

      user = await prisma.users.create({
        data: {
          email: googleUser.email,
          full_name: googleUser.fullName,
          password_hash: passwordHash,
          role: "personal",
          status: "active",
          twoFactorEnabled: false,
          twoFactorSecret: null,
          updated_at: new Date(),
        },
      });
    }

    if (user.status !== "active") {
      return redirectToLogin(req, "inactive_account");
    }

    const sessionToken = generateSessionToken();
    const expiresAt = buildSessionExpirationDate();

    const session = await rotateSessionForUser({
      userId: user.id,
      token: sessionToken,
      expiresAt,
    });

    if (!user.twoFactorEnabled) {
      const secret = speakeasy.generateSecret({
        name: `LEDGERA (${user.email})`,
        issuer: "LEDGERA",
        length: 20,
      });

      if (!secret.base32 || !secret.otpauth_url) {
        return redirectToLogin(req, "google_2fa_setup_failed");
      }

      await prisma.users.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: secret.base32,
          twoFactorEnabled: false,
          updated_at: new Date(),
        },
      });

      const setupToken = signSetupToken(user.id, user.email, secret.base32);

      const response = NextResponse.redirect(new URL("/login?oauth2fa=1", req.nextUrl.origin));

      response.cookies.set("session_token", sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: expiresAt,
      });

      response.cookies.set(PENDING_2FA_COOKIE, setupToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 15 * 60,
      });

      response.cookies.set(OAUTH_STATE_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
      });

      return response;
    }

    const response = NextResponse.redirect(new URL("/panel", req.nextUrl.origin));

    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });

    response.cookies.set(OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("[auth/google/callback]", error);
    return redirectToLogin(req, "google_auth_failed");
  }
}
