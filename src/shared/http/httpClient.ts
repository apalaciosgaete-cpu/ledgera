import { getSessionToken } from "@/modules/identity/client/authStorage";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  auth?: boolean;
  timeoutMs?: number;
};

type ErrorPayload = {
  ok?: false;
  message?: string;
  data?: unknown;
  error?: unknown;
};

export class HttpClientError extends Error {
  status: number;
  data: unknown;
  code: string | null;
  retryAfterSeconds: number | null;

  constructor(input: {
    status: number;
    message: string;
    data?: unknown;
    code?: string | null;
    retryAfterSeconds?: number | null;
  }) {
    super(input.message);

    this.name = "HttpClientError";
    this.status = input.status;
    this.data = input.data ?? null;
    this.code = input.code ?? null;
    this.retryAfterSeconds = input.retryAfterSeconds ?? null;
  }
}

const CSRF_COOKIE_NAME = "ledgera_csrf";
const CSRF_HEADER_NAME = "X-LEDGERA-CSRF";
const DEFAULT_TIMEOUT_MS = 10000;

function isErrorPayload(value: unknown): value is ErrorPayload {
  return typeof value === "object" && value !== null;
}

function isMutationMethod(method: HttpMethod): boolean {
  return method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const target = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`));

  if (!target) return null;

  return decodeURIComponent(target.slice(name.length + 1));
}

function resolveErrorMessage(payload: unknown, status: number): string {
  if (
    isErrorPayload(payload) &&
    typeof payload.message === "string" &&
    payload.message.trim()
  ) {
    return payload.message;
  }

  switch (status) {
    case 0:
      return "La solicitud tardó demasiado. Intenta nuevamente.";
    case 401:
      return "Sesión expirada o no autorizada.";
    case 402:
      return "Suscripción requerida para continuar.";
    case 403:
      return "No tienes permisos para realizar esta acción.";
    case 404:
      return "Recurso no encontrado.";
    case 409:
      return "La operación no se puede completar.";
    case 429:
      return "Demasiados intentos. Intenta nuevamente más tarde.";
    case 500:
      return "Error interno del servidor.";
    default:
      return `HTTP ${status}`;
  }
}

function resolveErrorCode(payload: unknown): string | null {
  if (!isErrorPayload(payload)) return null;

  const data = payload.data;

  if (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    typeof (data as { code?: unknown }).code === "string"
  ) {
    return (data as { code: string }).code;
  }

  return null;
}

function resolveRetryAfterSeconds(response: Response, payload: unknown): number | null {
  const retryAfterHeader = response.headers.get("Retry-After");

  if (retryAfterHeader) {
    const value = Number(retryAfterHeader);

    if (Number.isFinite(value)) {
      return value;
    }
  }

  if (!isErrorPayload(payload)) return null;

  const data = payload.data;

  if (
    typeof data === "object" &&
    data !== null &&
    "retryAfterSeconds" in data &&
    typeof (data as { retryAfterSeconds?: unknown }).retryAfterSeconds === "number"
  ) {
    return (data as { retryAfterSeconds: number }).retryAfterSeconds;
  }

  return null;
}

export function isHttpClientError(error: unknown): error is HttpClientError {
  return error instanceof HttpClientError;
}

export async function httpClient<T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    headers,
    auth = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

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

  if (isMutationMethod(method) && !finalHeaders.has(CSRF_HEADER_NAME)) {
    const csrfToken = readCookie(CSRF_COOKIE_NAME);

    if (csrfToken) {
      finalHeaders.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      credentials: "include",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new HttpClientError({
        status: 0,
        message: resolveErrorMessage(null, 0),
        code: "REQUEST_TIMEOUT",
      });
    }

    throw new HttpClientError({
      status: 0,
      message: "No fue posible conectar con el servidor.",
      code: "NETWORK_ERROR",
    });
  } finally {
    window.clearTimeout(timeoutId);
  }

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new HttpClientError({
      status: response.status,
      message: resolveErrorMessage(payload, response.status),
      data: isErrorPayload(payload) ? payload.data ?? payload.error ?? null : null,
      code: resolveErrorCode(payload),
      retryAfterSeconds: resolveRetryAfterSeconds(response, payload),
    });
  }

  return payload as T;
}
