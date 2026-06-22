type RateLimitEntry = {
  attempts: number;
  expiresAt: number;
};

type CheckRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 20;

function cleanupExpiredEntries() {
  const now = Date.now();

  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= now) {
      store.delete(key);
    }
  }
}

export function getRequestClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return realIp || "unknown";
}

export function buildRequestRateLimitKey(
  req: Request,
  scope: string,
): string {
  return `${scope}:${getRequestClientIp(req)}`;
}

export function checkRequestRateLimit(
  key: string,
): CheckRateLimitResult {
  cleanupExpiredEntries();

  const now = Date.now();

  const current = store.get(key);

  if (!current) {
    store.set(key, {
      attempts: 1,
      expiresAt: now + WINDOW_MS,
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  if (current.expiresAt <= now) {
    store.set(key, {
      attempts: 1,
      expiresAt: now + WINDOW_MS,
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  current.attempts += 1;

  store.set(key, current);

  if (current.attempts > MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((current.expiresAt - now) / 1000),
      ),
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}