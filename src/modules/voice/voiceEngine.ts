// src/modules/voice/voiceEngine.ts
// Motor de Voz LEDGERA — orquesta la bienvenida automática al entrar al panel.

"use client";

import { VOICE_CONFIG, WELCOME_MESSAGE } from "./voiceConfig";
import { speakWelcome, stopSpeaking } from "./textToSpeech";
import {
  consumePostLoginWelcomePending,
  hasWelcomeBeenPlayed,
  markWelcomeAsPlayed,
} from "./voiceSession";

export type VoiceEngineState =
  | "idle"
  | "playing"
  | "played"
  | "blocked"
  | "unsupported";

export type VoiceEngineCallbacks = {
  onStateChange?: (state: VoiceEngineState) => void;
};

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

    const forceAfterLogin = consumePostLoginWelcomePending();

    if (!forceAfterLogin && hasWelcomeBeenPlayed()) {
      this.setState("played");
      return this.state;
    }

    this.setState("playing");
    await new Promise((resolve) => setTimeout(resolve, VOICE_CONFIG.startDelay));

    const result = await speakWelcome(WELCOME_MESSAGE);

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
