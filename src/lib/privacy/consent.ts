export const CONSENT_POLICY_VERSION = "ledgera-privacy-ley-21719-v3-2026-07-09";
export const CONSENT_REGIME = "CL_LEY_21719_19628";
export const CONSENT_STORAGE_KEY = "ledgera-privacy-consent";
export const LEGACY_CONSENT_STORAGE_KEY = "ledgera-cookie-consent";
export const CONSENT_COOKIE_NAME = "ledgera_privacy_consent";
export const CONSENT_EVENT = "ledgera-cookie-consent-updated";
export const PRIVACY_PREFERENCES_EVENT = "ledgera-open-privacy-preferences";
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type ConsentCategories = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
};

export type ConsentSnapshot = {
  id: string;
  version: string;
  regime: typeof CONSENT_REGIME;
  decidedAt: string;
  categories: ConsentCategories;
  serverLogged?: boolean;
  proofHash?: string;
};

export const DEFAULT_CONSENT_CATEGORIES: ConsentCategories = {
  necessary: true,
  functional: false,
  analytics: false,
};

export function normalizeConsentCategories(input: unknown): ConsentCategories {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  return {
    necessary: true,
    functional: source.functional === true,
    analytics: source.analytics === true,
  };
}

export function buildConsentSnapshot(args: {
  id?: string;
  categories: ConsentCategories;
  decidedAt?: string;
  serverLogged?: boolean;
  proofHash?: string;
}): ConsentSnapshot {
  return {
    id: args.id || createBrowserAnonId(),
    version: CONSENT_POLICY_VERSION,
    regime: CONSENT_REGIME,
    decidedAt: args.decidedAt || new Date().toISOString(),
    categories: normalizeConsentCategories(args.categories),
    serverLogged: args.serverLogged,
    proofHash: args.proofHash,
  };
}

export function isCurrentConsentSnapshot(value: unknown): value is ConsentSnapshot {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<ConsentSnapshot>;
  if (candidate.version !== CONSENT_POLICY_VERSION) return false;
  if (candidate.regime !== CONSENT_REGIME) return false;
  if (!candidate.categories || typeof candidate.categories !== "object") return false;

  return true;
}

export function readConsentSnapshot(): ConsentSnapshot | null {
  if (typeof window === "undefined") return null;

  const fromStorage = parseConsentSnapshot(window.localStorage?.getItem(CONSENT_STORAGE_KEY));
  if (fromStorage) return fromStorage;

  const fromCookie = parseConsentSnapshot(readCookie(CONSENT_COOKIE_NAME));
  if (fromCookie) return fromCookie;

  return null;
}

export function hasAnalyticsConsent(): boolean {
  return readConsentSnapshot()?.categories.analytics === true;
}

export function persistConsentSnapshot(snapshot: ConsentSnapshot): void {
  if (typeof window === "undefined") return;

  const normalized = buildConsentSnapshot({
    id: snapshot.id,
    categories: snapshot.categories,
    decidedAt: snapshot.decidedAt,
    serverLogged: snapshot.serverLogged,
    proofHash: snapshot.proofHash,
  });
  const value = JSON.stringify(normalized);

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
    window.localStorage.removeItem(LEGACY_CONSENT_STORAGE_KEY);
  } catch {}

  writeCookie(CONSENT_COOKIE_NAME, value, CONSENT_MAX_AGE_SECONDS);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: normalized }));
}

export function openPrivacyPreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PRIVACY_PREFERENCES_EVENT));
}

export function describeConsentDecision(categories: ConsentCategories): "ACCEPT_ALL" | "REJECT_NON_ESSENTIAL" | "CUSTOM" {
  if (categories.functional && categories.analytics) return "ACCEPT_ALL";
  if (!categories.functional && !categories.analytics) return "REJECT_NON_ESSENTIAL";
  return "CUSTOM";
}

function parseConsentSnapshot(raw: string | null | undefined): ConsentSnapshot | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isCurrentConsentSnapshot(parsed) ? (parsed as ConsentSnapshot) : null;
  } catch {
    return null;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const escaped = name.replace(/([.$?*|{}()\[\]\\/+^])/g, "\\$1");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === "undefined") return;

  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function createBrowserAnonId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
