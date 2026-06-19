// src/modules/voice/textToSpeech.ts
// Motor de síntesis de voz — capa sobre SpeechSynthesis con normalización

import { VOICE_CONFIG } from "./voiceConfig";
import { normalizePronunciation } from "./voiceDictionary";

export type SpeakResult = {
  success: boolean;
  blocked: boolean; // true si el navegador bloqueó el autoplay
};

/**
 * Busca la mejor voz disponible según la configuración.
 * Prioriza es-CL, luego es-419, luego es-ES, luego cualquier "es".
 */
function findBestVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const preferred = [VOICE_CONFIG.lang, ...VOICE_CONFIG.fallbacks];

  for (const lang of preferred) {
    const match = voices.find(
      (v) => v.lang === lang || v.lang.startsWith(lang),
    );
    if (match) return match;
  }

  // Último recurso: cualquier voz que tenga "es" en el lang
  return voices.find((v) => v.lang.startsWith("es")) ?? null;
}

/**
 * Reproduce un texto por voz usando SpeechSynthesis.
 * Aplica el diccionario de pronunciación antes de hablar.
 *
 * @returns SpeakResult — si fue exitoso o si el navegador bloqueó el audio.
 */
export function speak(text: string): Promise<SpeakResult> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve({ success: false, blocked: false });
      return;
    }

    // Cancelar cualquier utterance anterior
    window.speechSynthesis.cancel();

    const normalized = normalizePronunciation(text);
    const utterance = new SpeechSynthesisUtterance(normalized);

    utterance.lang = VOICE_CONFIG.lang;
    utterance.rate = VOICE_CONFIG.rate;
    utterance.pitch = VOICE_CONFIG.pitch;
    utterance.volume = VOICE_CONFIG.volume;

    const voice = findBestVoice();
    if (voice) utterance.voice = voice;

    let resolved = false;

    utterance.onstart = () => {
      if (!resolved) {
        resolved = true;
        resolve({ success: true, blocked: false });
      }
    };

    utterance.onend = () => {
      if (!resolved) {
        resolved = true;
        resolve({ success: true, blocked: false });
      }
    };

    utterance.onerror = (event) => {
      if (!resolved) {
        resolved = true;
        // "interrupted" no es un error real, es que se canceló
        if (event.error === "interrupted") {
          resolve({ success: false, blocked: false });
        } else if (event.error === "not-allowed") {
          resolve({ success: false, blocked: true });
        } else {
          resolve({ success: false, blocked: false });
        }
      }
    };

    window.speechSynthesis.speak(utterance);

    // Timeout de seguridad: si después de 3s no ha empezado, consideramos bloqueado
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({ success: false, blocked: true });
      }
    }, 3000);
  });
}

/**
 * Detiene cualquier reproducción de voz en curso.
 */
export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
