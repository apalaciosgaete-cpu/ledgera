// src/modules/voice/voiceEngine.ts
// Motor de Voz LEDGERA — orquesta la bienvenida automática al entrar al panel.
//
// Flujo UX 3.1.2:
//   Usuario entra a /panel
//   → VoiceEngine detecta sesión nueva
//   → Genera bienvenida contextual
//   → Normaliza pronunciación y formatea texto
//   → /api/voice/welcome → ElevenLabs TTS neuronal
//   → Devuelve audio mp3 → autoplay en panel
//   → Si falla el proveedor: fallback a speechSynthesis del navegador
//   → Si el navegador bloquea: muestra aviso discreto

"use client";

import { VOICE_CONFIG, WELCOME_MESSAGE } from "./voiceConfig";
import { speak, stopSpeaking } from "./textToSpeech";
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
 * VoiceEngine — Singleton que maneja el ciclo de vida de la voz.
 *
 * Orden de reproducción:
 *   1. TTS neuronal (ElevenLabs vía /api/voice/welcome)
 *   2. Fallback a speechSynthesis del navegador
 *   3. Si el navegador bloquea el autoplay → blocked
 *
 * Uso:
 * ```tsx
 * const engine = useRef(new VoiceEngine());
 * useEffect(() => {
 *   engine.current.playWelcome({ onStateChange: setVoiceState });
 * }, []);
 * ```
 */
export class VoiceEngine {
  private state: VoiceEngineState = "idle";
  private callbacks: VoiceEngineCallbacks = {};
  private played = false;

  private setState(newState: VoiceEngineState): void {
    this.state = newState;
    this.callbacks.onStateChange?.(newState);
  }

  /**
   * Reproduce la bienvenida automática si es una sesión nueva.
   * Solo se ejecuta una vez por sesión de navegador.
   * Prioriza TTS neuronal; fallback a speechSynthesis del navegador.
   *
   * @param callbacks — Callbacks opcionales para estado y UI.
   * @returns El estado resultante.
   */
  async playWelcome(callbacks?: VoiceEngineCallbacks): Promise<VoiceEngineState> {
    if (this.played) return this.state;
    this.played = true;

    if (callbacks) this.callbacks = callbacks;

    // Verificar si ya se reprodujo en esta sesión
    if (hasWelcomeBeenPlayed()) {
      this.setState("played");
      return this.state;
    }

    // Verificar soporte de audio
    if (typeof window === "undefined") {
      this.setState("unsupported");
      return this.state;
    }

    this.setState("playing");

    // Pequeña pausa antes de comenzar
    await new Promise((resolve) => setTimeout(resolve, VOICE_CONFIG.startDelay));

    // Intentar reproducir (neuronal primero, fallback a browser)
    const result = await speak(WELCOME_MESSAGE);

    if (result.blocked) {
      // Navegador bloqueó el audio — mostrar aviso discreto
      this.setState("blocked");
      return this.state;
    }

    if (result.success) {
      markWelcomeAsPlayed();
      this.setState("played");
    } else {
      this.setState("unsupported");
    }

    return this.state;
  }

  /**
   * Detiene la voz en curso.
   */
  stop(): void {
    stopSpeaking();
    this.setState("idle");
  }

  /**
   * Reintenta la bienvenida (útil si fue bloqueada y el usuario habilita audio).
   */
  async retryWelcome(): Promise<VoiceEngineState> {
    this.played = false;
    return this.playWelcome(this.callbacks);
  }

  getState(): VoiceEngineState {
    return this.state;
  }
}
