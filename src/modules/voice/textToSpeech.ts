// src/modules/voice/textToSpeech.ts
// Motor de síntesis de voz — capa sobre TTS neuronal con fallback a SpeechSynthesis.
//
// speak()        → para bienvenida automática (/api/voice/welcome)
// speakResponse() → para respuestas del asistente (/api/voice/speak)
//
// Flujo:
//   1. Intenta TTS neuronal (ElevenLabs)
//   2. Si falla → speechSynthesis del navegador (fallback)
//   3. Si el navegador bloquea → blocked

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

  const preferred = [VOICE_CONFIG.lang, ...VOICE_CONFIG.fallbacks];

  for (const lang of preferred) {
    const match = voices.find(
      (v) => v.lang === lang || v.lang.startsWith(lang),
    );
    if (match) return match;
  }

  return voices.find((v) => v.lang.startsWith("es")) ?? null;
}

function speakWithBrowser(text: string): Promise<SpeakResult> {
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
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voiceId: ELEVENLABS_VOICE_ID,
      }),
    });

    if (!response.ok) {
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

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Reproduce texto usando el endpoint de bienvenida (/api/voice/welcome).
 * Sirve para la bienvenida automática del panel.
 */
export async function speak(text: string): Promise<SpeakResult> {
  const neural = await speakWithNeural("/api/voice/welcome", text);
  if (neural.success || neural.blocked) return neural;
  return speakWithBrowser(text);
}

/**
 * Reproduce una respuesta del asistente usando /api/voice/speak.
 * Conecta el chat con voz neuronal ElevenLabs.
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
