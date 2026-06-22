// src/modules/voice/textToSpeech.ts
// Motor de síntesis de voz para LEDGERA.
// Solo usa voz neuronal ElevenLabs.

import { ELEVENLABS_VOICE_ID } from "./voiceConfig";
import { stopAudio, clearSimulatedAudioLevel } from "./audioPlayer";
import { playAudioBlob } from "./audioPlayer";

export type SpeakResult = {
  success: boolean;
  blocked: boolean;
  provider: "neural" | "browser" | "none";
};

async function speakWithNeural(endpoint: "/api/voice/welcome" | "/api/voice/speak", text: string): Promise<SpeakResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voiceId: ELEVENLABS_VOICE_ID,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("[voice/neural] API error:", response.status, response.statusText);
      return { success: false, blocked: false, provider: "none" };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("audio")) {
      console.error("[voice/neural] Response is not audio:", contentType);
      return { success: false, blocked: false, provider: "none" };
    }

    const blob = await response.blob();
    const result = await playAudioBlob(blob);

    return {
      success: result.success,
      blocked: result.blocked,
      provider: "neural",
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.error("[voice/neural] Fetch timed out");
    } else {
      console.error("[voice/neural] Fetch error:", err);
    }
    return { success: false, blocked: false, provider: "none" };
  }
}

export async function speakWelcome(text: string): Promise<SpeakResult> {
  return speakWithNeural("/api/voice/welcome", text);
}

export async function speakResponse(text: string): Promise<SpeakResult> {
  return speakWithNeural("/api/voice/speak", text);
}

export function stopSpeaking(): void {
  stopAudio();
  clearSimulatedAudioLevel();
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
