import crypto from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/modules/identity/application/password";
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

const REGISTRATION_2FA_TOKEN_SECRET =
  process.env.REGISTRATION_2FA_TOKEN_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  process.env.AUTH_SECRET ??
  "ledgera-dev-registration-2fa-secret";

function signSetupToken(userId: string, email: string, secret: string) {
  return crypto
    .createHmac("sha256", REGISTRATION_2FA_TOKEN_SECRET)
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

function redirectToLogin(req: NextRequest, reason: string) {
  const url = new URL("/login", req.nextUrl.origin);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

async function exchangeCodeForAccessToken(req: NextRequest, code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth no está configurado.");
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: resolveRedirectUri(req),
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
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
  const response = await fetch(GOOGLE_USERINFO_URL, {
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

    // Si el usuario no tiene 2FA, forzar configuración antes de permitir acceso
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
        maxAge: 15 * 60, // 15 minutos
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

    const response = NextResponse.redirect(new URL("/portafolio", req.nextUrl.origin));

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
