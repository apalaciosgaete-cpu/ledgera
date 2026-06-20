// src/modules/voice/voiceEngine.ts
// Motor de Voz LEDGERA — orquesta la bienvenida automática al entrar al panel.
//
// Flujo UX 3.1.3:
//   Usuario entra a /panel
//   → VoiceEngine detecta sesión nueva
//   → Reproduce bienvenida con speechSynthesis del navegador (inmediato, confiable)
//   → Si falla: speechSynthesis fallback → blocked | unsupported
//   → TTS neuronal (ElevenLabs) se usa solo en respuestas del asistente via speakResponse()

"use client";

import { VOICE_CONFIG, WELCOME_MESSAGE } from "./voiceConfig";
import { stopSpeaking } from "./textToSpeech";
import { hasWelcomeBeenPlayed, markWelcomeAsPlayed } from "./voiceSession";
import { normalizePronunciation } from "./voiceDictionary";

export type VoiceEngineState =
  | "idle"
  | "playing"
  | "played"
  | "blocked"
  | "unsupported";

export type VoiceEngineCallbacks = {
  onStateChange?: (state: VoiceEngineState) => void;
};

/**
 * Busca la mejor voz disponible (es-CL → es-419 → es-ES → cualquier es).
 */
function findBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const preferred = [VOICE_CONFIG.lang, ...VOICE_CONFIG.fallbacks];
  for (const lang of preferred) {
    const match = voices.find((v) => v.lang === lang || v.lang.startsWith(lang));
    if (match) return match;
  }
  return voices.find((v) => v.lang.startsWith("es")) ?? null;
}

/**
 * Reproduce bienvenida con speechSynthesis del navegador.
 * Mismo enfoque que el código original que funcionaba.
 */
function speakWelcomeBrowser(): Promise<VoiceEngineState> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve("unsupported");
      return;
    }

    window.speechSynthesis.cancel();

    const normalized = normalizePronunciation(WELCOME_MESSAGE);
    const utterance = new SpeechSynthesisUtterance(normalized);

    utterance.lang = VOICE_CONFIG.lang;
    utterance.rate = VOICE_CONFIG.rate;
    utterance.pitch = VOICE_CONFIG.pitch;
    utterance.volume = VOICE_CONFIG.volume;

    const voice = findBestVoice();
    if (voice) utterance.voice = voice;

    let resolved = false;

    utterance.onstart = () => { if (!resolved) { resolved = true; resolve("playing"); } };
    utterance.onend = () => { if (!resolved) { resolved = true; resolve("played"); } };
    utterance.onerror = (event) => {
      if (!resolved) {
        resolved = true;
        resolve(event.error === "not-allowed" ? "blocked" : "unsupported");
      }
    };

    window.speechSynthesis.speak(utterance);

    // Timeout 3s: si no empezó, asumir bloqueado
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve("blocked");
      }
    }, 3000);
  });
}

/**
 * VoiceEngine — Singleton que maneja la bienvenida automática.
 * Usa speechSynthesis del navegador directamente (como el código original).
 * El TTS neuronal se usa solo en speakResponse() para respuestas del asistente.
 */
export class VoiceEngine {
  private state: VoiceEngineState = "idle";
  private callbacks: VoiceEngineCallbacks = {};
  private played = false;

  private setState(newState: VoiceEngineState): void {
    this.state = newState;
    this.callbacks.onStateChange?.(newState);
  }

  async playWelcome(callbacks?: VoiceEngineCallbacks): Promise<VoiceEngineState> {
    if (this.played) return this.state;
    this.played = true;

    if (callbacks) this.callbacks = callbacks;

    if (hasWelcomeBeenPlayed()) {
      this.setState("played");
      return this.state;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.setState("unsupported");
      return this.state;
    }

    this.setState("playing");

    // Misma pausa que el código original (650ms)
    await new Promise((resolve) => setTimeout(resolve, VOICE_CONFIG.startDelay));

    // Usar speechSynthesis del navegador — rápido, confiable, igual que el original
    const result = await speakWelcomeBrowser();

    this.setState(result);

    if (result === "played") {
      markWelcomeAsPlayed();
    }

    return this.state;
  }

  stop(): void {
    stopSpeaking();
    this.setState("idle");
  }

  async retryWelcome(): Promise<VoiceEngineState> {
    this.played = false;
    return this.playWelcome(this.callbacks);
  }

  getState(): VoiceEngineState {
    return this.state;
  }
}
