// src/modules/voice/textToSpeech.ts
// Motor de síntesis de voz para respuestas del asistente.
//
// speakResponse() → para respuestas del asistente (/api/voice/speak)
//
// Flujo:
//   1. Intenta TTS neuronal (ElevenLabs)
//   2. Si falla → speechSynthesis del navegador (fallback)
//   3. Si el navegador bloquea → blocked
//
// La bienvenida automática del panel usa VoiceEngine (speechSynthesis directo).

import { VOICE_CONFIG, ELEVENLABS_VOICE_ID } from "./voiceConfig";
import { normalizePronunciation } from "./voiceDictionary";
import { playAudioBlob, stopAudio } from "./audioPlayer";

export type SpeakResult = {
  success: boolean;
  blocked: boolean;
  provider: "neural" | "browser" | "none";
};

// ─── Fallback: Browser SpeechSynthesis ──────────────────────────────────────

function findBestVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Priorizar voces naturales/premium por nombre (mucho menos robóticas)
  const naturalKeywords = ["natural", "premium", "neural", "sabina", "helena"];

  const preferred = [VOICE_CONFIG.lang, ...VOICE_CONFIG.fallbacks];

  // 1. Buscar voz natural que coincida con idioma preferido
  for (const lang of preferred) {
    const candidates = voices.filter(
      (v) => v.lang === lang || v.lang.startsWith(lang),
    );
    // Priorizar voces con keywords naturales
    for (const keyword of naturalKeywords) {
      const match = candidates.find((v) =>
        v.name.toLowerCase().includes(keyword),
      );
      if (match) return match;
    }
    // Si no hay voz natural, usar la primera del idioma
    if (candidates.length > 0) return candidates[0];
  }

  // 2. Fallback: cualquier voz en español
  return voices.find((v) => v.lang.startsWith("es")) ?? null;
}

export function speakWithBrowser(text: string): Promise<SpeakResult> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
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

    let resolved = false;

    utterance.onstart = () => {
      if (!resolved) { resolved = true; resolve({ success: true, blocked: false, provider: "browser" }); }
    };
    utterance.onend = () => {
      if (!resolved) { resolved = true; resolve({ success: true, blocked: false, provider: "browser" }); }
    };
    utterance.onerror = (event) => {
      if (!resolved) {
        resolved = true;
        if (event.error === "not-allowed") {
          resolve({ success: false, blocked: true, provider: "browser" });
        } else {
          resolve({ success: false, blocked: false, provider: "browser" });
        }
      }
    };

    window.speechSynthesis.speak(utterance);

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({ success: false, blocked: true, provider: "browser" });
      }
    }, 3000);
  });
}

// ─── Neural: ElevenLabs via API ──────────────────────────────────────────────

async function speakWithNeural(endpoint: "/api/voice/welcome" | "/api/voice/speak", text: string): Promise<SpeakResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

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
      console.error("[voice/neural] Fetch timed out after 4s");
    } else {
      console.error("[voice/neural] Fetch error:", err);
    }
    return { success: false, blocked: false, provider: "none" };
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Reproduce una respuesta del asistente usando /api/voice/speak.
 * Conecta el chat con voz neuronal ElevenLabs.
 * Fallback a speechSynthesis del navegador si no hay API key.
 */
export async function speakResponse(text: string): Promise<SpeakResult> {
  const neural = await speakWithNeural("/api/voice/speak", text);
  if (neural.success || neural.blocked) return neural;
  return speakWithBrowser(text);
}

/**
 * Detiene cualquier reproducción de voz en curso.
 */
export function stopSpeaking(): void {
  stopAudio();
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
