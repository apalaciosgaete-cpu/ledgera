// src/modules/voice/conversationOrchestrator.ts
// Orquestador base del asistente de voz LEDGERA.
// Une estados de escucha, transcripción, pensamiento y reproducción.

export type VoiceConversationState =
  | "idle"
  | "welcoming"
  | "listening"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "blocked"
  | "error";

export type VoiceConversationSnapshot = {
  state: VoiceConversationState;
  transcript: string;
  error: string | null;
};

export type VoiceConversationCallbacks = {
  onStateChange?: (snapshot: VoiceConversationSnapshot) => void;
  onFinalTranscript?: (transcript: string) => void;
};

export class VoiceConversationOrchestrator {
  private snapshot: VoiceConversationSnapshot = {
    state: "idle",
    transcript: "",
    error: null,
  };

  constructor(private callbacks: VoiceConversationCallbacks = {}) {}

  private emit() {
    this.callbacks.onStateChange?.({ ...this.snapshot });
  }

  setState(state: VoiceConversationState) {
    this.snapshot.state = state;
    if (state !== "error") {
      this.snapshot.error = null;
    }
    this.emit();
  }

  setTranscript(transcript: string) {
    this.snapshot.transcript = transcript;
    this.emit();
  }

  setError(message: string) {
    this.snapshot.state = "error";
    this.snapshot.error = message;
    this.emit();
  }

  beginListening() {
    this.snapshot.transcript = "";
    this.setState("listening");
  }

  beginTranscribing(transcript: string) {
    this.snapshot.transcript = transcript;
    this.setState("transcribing");
  }

  beginThinking(finalTranscript: string) {
    this.snapshot.transcript = finalTranscript;
    this.setState("thinking");
    this.callbacks.onFinalTranscript?.(finalTranscript);
  }

  beginSpeaking() {
    this.setState("speaking");
  }

  block() {
    this.setState("blocked");
  }

  reset() {
    this.snapshot = {
      state: "idle",
      transcript: "",
      error: null,
    };
    this.emit();
  }

  getSnapshot(): VoiceConversationSnapshot {
    return { ...this.snapshot };
  }
}
