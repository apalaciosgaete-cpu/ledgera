type LoginAttemptRecord = {
  count: number;
  firstAttemptAt: number;
};

const attempts = new Map<string, LoginAttemptRecord>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function checkLoginRateLimit(identifier: string) {
  const now = Date.now();
  const current = attempts.get(identifier);

  if (!current || now - current.firstAttemptAt > WINDOW_MS) {
    attempts.set(identifier, {
      count: 1,
      firstAttemptAt: now,
    });

    return {
      allowed: true,
      remaining: MAX_ATTEMPTS - 1,
      retryAfterSeconds: 0,
    };
  }

  if (current.count >= MAX_ATTEMPTS) {
    const retryAfterMs = WINDOW_MS - (now - current.firstAttemptAt);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  current.count += 1;
  attempts.set(identifier, current);

  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - current.count,
    retryAfterSeconds: 0,
  };
}

export function clearLoginRateLimit(identifier: string) {
  attempts.delete(identifier);
}