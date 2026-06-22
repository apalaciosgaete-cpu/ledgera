// src/modules/identity/client/authSessionCache.ts
// Cache breve de usuario para reducir el parpadeo de AuthGuard en recargas.
// La fuente de verdad sigue siendo /api/me; esto solo mejora UX inicial.

import type { AuthUser } from "./authClient";

const CACHE_KEY = "ledgera.auth.user.cache";
const CACHE_TTL_MS = 60_000;

type CachedAuthUser = {
  user: AuthUser;
  cachedAt: number;
};

export function readCachedAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedAuthUser;
    if (!parsed.user || !parsed.cachedAt) return null;

    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      window.sessionStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed.user;
  } catch {
    window.sessionStorage.removeItem(CACHE_KEY);
    return null;
  }
}

export function writeCachedAuthUser(user: AuthUser): void {
  if (typeof window === "undefined") return;

  const payload: CachedAuthUser = {
    user,
    cachedAt: Date.now(),
  };

  window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

export function clearCachedAuthUser(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CACHE_KEY);
}
