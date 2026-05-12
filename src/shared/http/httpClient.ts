import { getSessionToken } from "@/modules/identity/client/authStorage";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  auth?: boolean;
};

export async function httpClient<T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers, auth = false } = options;

  const finalHeaders = new Headers(headers ?? {});

  if (body !== undefined && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getSessionToken();
    if (token) {
      finalHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof (payload as any).message === "string"
        ? (payload as any).message
        : `HTTP ${response.status}`;

    throw new Error(message);
  }

  return payload as T;
}