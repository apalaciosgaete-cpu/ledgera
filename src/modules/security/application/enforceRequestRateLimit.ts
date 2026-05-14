import { NextRequest, NextResponse } from "next/server";

type RateLimitEntry = {
  attempts: number;
  expiresAt: number;
};

type EnforceRateLimitInput = {
  scope: string;
  maxAttempts?: number;
  windowMs?: number;
};

const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 20;

const store = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries() {
  const now = Date.now();

  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= now) {
      store.delete(key);
    }
  }
}

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return realIp || "unknown";
}

function buildRateLimitKey(req: NextRequest, scope: string): string {
  return `${scope}:${getClientIp(req)}`;
}

function resolveRetryAfterSeconds(expiresAt: number): number {
  return Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));
}

export function enforceRequestRateLimit(
  req: NextRequest,
  input: EnforceRateLimitInput,
): NextResponse | null {
  cleanupExpiredEntries();

  const scope = input.scope;
  const maxAttempts = input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = input.windowMs ?? DEFAULT_WINDOW_MS;

  const key = buildRateLimitKey(req, scope);
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.expiresAt <= now) {
    store.set(key, {
      attempts: 1,
      expiresAt: now + windowMs,
    });

    return null;
  }

  current.attempts += 1;
  store.set(key, current);

  if (current.attempts <= maxAttempts) {
    return null;
  }

  const retryAfterSeconds = resolveRetryAfterSeconds(current.expiresAt);

  return NextResponse.json(
    {
      ok: false,
      message: "Demasiadas solicitudes. Intenta nuevamente más tarde.",
      data: {
        code: "RATE_LIMIT_EXCEEDED",
        scope,
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