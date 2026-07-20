import { httpClient } from "@/shared/http/httpClient";

const STORAGE_KEY = "ledgera_admin_reauth";
const HEADER_NAME = "X-LEDGERA-ADMIN-REAUTH";

type StoredAdminReauthentication = {
  token: string;
  expiresAt: string;
};

type ReauthenticationResponse = {
  ok: true;
  data: StoredAdminReauthentication;
};

function readStoredToken(): StoredAdminReauthentication | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const stored = JSON.parse(raw) as StoredAdminReauthentication;
    const expiresAt = new Date(stored.expiresAt).getTime();

    if (!stored.token || !Number.isFinite(expiresAt) || expiresAt <= Date.now() + 15_000) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return stored;
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function storeToken(value: StoredAdminReauthentication) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function clearAdminReauthentication() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
}

export async function requestAdminReauthentication(input: {
  password: string;
  code: string;
}) {
  const response = await httpClient<ReauthenticationResponse>("/api/admin/reauth", {
    method: "POST",
    body: input,
  });

  storeToken(response.data);
  return response.data;
}

export function getAdminReauthenticationHeaders(): HeadersInit | null {
  const stored = readStoredToken();
  if (!stored) return null;

  return {
    [HEADER_NAME]: stored.token,
  };
}

export const adminReauthenticationClient = {
  headerName: HEADER_NAME,
  storageKey: STORAGE_KEY,
};
