// src/modules/voice/voiceSession.ts
// Gestión de sesión de voz — asegura bienvenida controlada por sesión
// y permite forzar reproducción después de login real.

import { SESSION_STORAGE_KEY } from "./voiceConfig";

const POST_LOGIN_WELCOME_KEY = "ledgera_voice_after_login";

export function hasWelcomeBeenPlayed(): boolean {
  if (typeof window === "undefined") return true;
  return window.sessionStorage.getItem(SESSION_STORAGE_KEY) === "1";
}

export function markWelcomeAsPlayed(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, "1");
  window.sessionStorage.removeItem(POST_LOGIN_WELCOME_KEY);
}

export function resetWelcomeSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export function markPostLoginWelcomePending(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(POST_LOGIN_WELCOME_KEY, "1");
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export function consumePostLoginWelcomePending(): boolean {
  if (typeof window === "undefined") return false;
  const pending = window.sessionStorage.getItem(POST_LOGIN_WELCOME_KEY) === "1";
  if (pending) {
    window.sessionStorage.removeItem(POST_LOGIN_WELCOME_KEY);
  }
  return pending;
}
