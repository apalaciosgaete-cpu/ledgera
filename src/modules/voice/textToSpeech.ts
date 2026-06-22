// src/modules/voice/textToSpeech.ts
// Motor de síntesis de voz para LEDGERA.
//
// speakWelcome()  → bienvenida del panel (/api/voice/welcome)
// speakResponse() → respuestas del asistente (/api/voice/speak)
//
// Flujo:
//   1. Intenta TTS neuronal
//   2. Si falla → speechSynthesis del navegador
//   3. Si el navegador bloquea → blocked

import { VOICE_CONFIG, ELEVENLABS_VOICE_ID } from "./voiceConfig";
import { normalizePronunciation } from "./voiceDictionary";
import { playAudioBlob, stopAudio, setSimulatedAudioLevel, clearSimulatedAudioLevel } from "./audioPlayer";

export type SpeakResult = {
  success: boolean;
  blocked: boolean;
  provider: "neural" | "browser" | "none";
};

function findBestVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const naturalKeywords = ["natural", "premium", "neural", "sabina", "helena"];
  const preferred = [VOICE_CONFIG.lang, ...VOICE_CONFIG.fallbacks];

  for (const lang of preferred) {
    const candidates = voices.filter(
      (v) => v.lang === lang || v.lang.startsWith(lang),
    );
    for (const keyword of naturalKeywords) {
      const match = candidates.find((v) =>
        v.name.toLowerCase().includes(keyword),
      );
      if (match) return match;
    }
    if (candidates.length > 0) return candidates[0];
  }

  return voices.find((v) => v.lang.startsWith("es")) ?? null;
}

function waitForBrowserVoices(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }

    if (window.speechSynthesis.getVoices().length > 0) {
      resolve();
      return;
    }

    const timeout = window.setTimeout(() => resolve(), 600);
    window.speechSynthesis.onvoiceschanged = () => {
      window.clearTimeout(timeout);
      resolve();
    };
  });
}

export async function speakWithBrowser(text: string): Promise<SpeakResult> {
  await waitForBrowserVoices();

  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      clearSimulatedAudioLevel();
      resolve({ success: false, blocked: false, provider: "none" });
      return;
    }

    window.speechSynthesis.cancel();

    const normalized = normalizePronunciation(text);
    const utterance = new SpeechSynthesisUtterance(normalized);

    utterance.lang = VOICE_CONFIG.lang;
    utterance.rate = VOICE_CONFIG.rate;
    utterance.pitch = VOICE_CONFIG.pitch;
    utterance.volume = VOICE_CONFIG.volume;

    const voice = findBestVoice();
    if (voice) utterance.voice = voice;

    // Activar nivel simulado para que el VoiceOrb muestre actividad
    setSimulatedAudioLevel();

    let resolved = false;

    utterance.onend = () => {
      if (!resolved) {
        resolved = true;
        clearSimulatedAudioLevel();
        resolve({ success: true, blocked: false, provider: "browser" });
      }
    };
    utterance.onerror = (event) => {
      if (!resolved) {
        resolved = true;
        clearSimulatedAudioLevel();
        resolve({
          success: false,
          blocked: event.error === "not-allowed",
          provider: "browser",
        });
      }
    };

    window.speechSynthesis.speak(utterance);

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        clearSimulatedAudioLevel();
        resolve({ success: false, blocked: true, provider: "browser" });
      }
    }, 3500);
  });
}

async function speakWithNeural(endpoint: "/api/voice/welcome" | "/api/voice/speak", text: string): Promise<SpeakResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

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
  const neural = await speakWithNeural("/api/voice/welcome", text);
  if (neural.success || neural.blocked) return neural;
  return speakWithBrowser(text);
}

export async function speakResponse(text: string): Promise<SpeakResult> {
  const neural = await speakWithNeural("/api/voice/speak", text);
  if (neural.success || neural.blocked) return neural;
  return speakWithBrowser(text);
}

export function stopSpeaking(): void {
  stopAudio();
  clearSimulatedAudioLevel();
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
