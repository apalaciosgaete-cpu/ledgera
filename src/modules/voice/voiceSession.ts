// src/modules/voice/voiceSession.ts
// Gestión de sesión de voz — asegura que la bienvenida solo se reproduzca
// una vez por sesión de navegador.

import { SESSION_STORAGE_KEY } from "./voiceConfig";

/**
 * Verifica si la bienvenida ya fue reproducida en esta sesión.
 */
export function hasWelcomeBeenPlayed(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.sessionStorage.getItem(SESSION_STORAGE_KEY) === "1"
  );
}

/**
 * Marca la bienvenida como reproducida para esta sesión.
 */
export function markWelcomeAsPlayed(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, "1");
}

/**
 * Reinicia el estado de la sesión (útil para testing o depuración).
 */
export function resetWelcomeSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
