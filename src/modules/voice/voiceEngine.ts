// src/modules/voice/voiceEngine.ts
// Motor de Voz LEDGERA — orquesta la bienvenida automática al entrar al panel.
//
// Flujo UX 3.1.4:
//   Usuario entra a /panel
//   → VoiceEngine.playWelcome()
//   → Browser speechSynthesis (rápido, sin API key, mismo enfoque original)
//   → Si speechSynthesis falla: blocked | unsupported
//   → TTS neuronal (ElevenLabs) se usa solo en respuestas del asistente via speakResponse()

"use client";

import { VOICE_CONFIG, WELCOME_MESSAGE } from "./voiceConfig";
import { speakWithBrowser, stopSpeaking } from "./textToSpeech";
import { hasWelcomeBeenPlayed, markWelcomeAsPlayed } from "./voiceSession";

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
 * VoiceEngine — Singleton que maneja la bienvenida automática del panel.
 * Usa speechSynthesis del navegador directamente (mismo enfoque que el código original).
 * El TTS neuronal queda para speakResponse() en el asistente.
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

    // Pausa inicial para que la página cargue completamente
    await new Promise((resolve) => setTimeout(resolve, VOICE_CONFIG.startDelay));

    // Usar speakWithBrowser de textToSpeech (única fuente de fallback)
    const result = await speakWithBrowser(WELCOME_MESSAGE);

    if (result.success) {
      this.setState("played");
      markWelcomeAsPlayed();
    } else if (result.blocked) {
      this.setState("blocked");
    } else {
      this.setState("unsupported");
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
