// src/modules/voice/welcomeSpeech.ts
// Bienvenida del login → panel.
// Solo usa voz neuronal ElevenLabs.

import { ELEVENLABS_VOICE_ID } from "./voiceConfig";
import { playAudioBlob } from "./audioPlayer";
import type { SpeakResult } from "./textToSpeech";

async function speakWelcomeWithNeural(text: string): Promise<SpeakResult> {
  try {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const response = await fetch("/api/voice/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId: ELEVENLABS_VOICE_ID }),
    });

    if (!response.ok) {
      return { success: false, blocked: false, provider: "none" };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("audio")) {
      return { success: false, blocked: false, provider: "none" };
    }

    const blob = await response.blob();
    const result = await playAudioBlob(blob);

    return {
      success: result.success,
      blocked: result.blocked,
      provider: "neural",
    };
  } catch {
    return { success: false, blocked: false, provider: "none" };
  }
}

export async function speakWelcomeRobust(text: string): Promise<SpeakResult> {
  return speakWelcomeWithNeural(text);
}
