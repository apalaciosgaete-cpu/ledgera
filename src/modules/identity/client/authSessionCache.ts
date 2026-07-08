// src/modules/identity/client/authSessionCache.ts
// Cache breve de usuario para reducir el parpadeo de AuthGuard en recargas.
// La fuente de verdad sigue siendo /api/me; esto solo mejora UX inicial.

import type { AuthUser } from "./authClient";

const CACHE_KEY = "ledgera.auth.user.cache";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type CachedAuthUser = {
  user: AuthUser;
  cachedAt: number;
};

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readCachedAuthUser(): AuthUser | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedAuthUser;
    if (!parsed.user || !parsed.cachedAt) return null;

    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      storage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed.user;
  } catch {
    storage.removeItem(CACHE_KEY);
    return null;
  }
}

export function writeCachedAuthUser(user: AuthUser): void {
  const storage = getStorage();
  if (!storage) return;

  const payload: CachedAuthUser = {
    user,
    cachedAt: Date.now(),
  };

  storage.setItem(CACHE_KEY, JSON.stringify(payload));
}

export function clearCachedAuthUser(): void {
  const storage = getStorage();
  if (!storage) return;

  storage.removeItem(CACHE_KEY);
}
