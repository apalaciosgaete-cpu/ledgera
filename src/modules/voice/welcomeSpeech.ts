// src/modules/voice/welcomeSpeech.ts
// Bienvenida robusta para el login → panel.
// Intenta voz neuronal y, si no se puede reproducir, cae a la voz local.

import { ELEVENLABS_VOICE_ID, VOICE_CONFIG } from "./voiceConfig";
import { normalizePronunciation } from "./voiceDictionary";
import { playAudioBlob, setSimulatedAudioLevel, clearSimulatedAudioLevel } from "./audioPlayer";
import type { SpeakResult } from "./textToSpeech";

async function speakWelcomeWithNeural(text: string): Promise<SpeakResult> {
  try {
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

function waitForVoices(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }

    if (window.speechSynthesis.getVoices().length > 0) {
      resolve();
      return;
    }

    const timer = window.setTimeout(resolve, 700);
    window.speechSynthesis.onvoiceschanged = () => {
      window.clearTimeout(timer);
      resolve();
    };
  });
}

async function speakWelcomeWithBrowser(text: string): Promise<SpeakResult> {
  await waitForVoices();

  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve({ success: false, blocked: false, provider: "none" });
      return;
    }

    const normalized = normalizePronunciation(text);
    const utterance = new SpeechSynthesisUtterance(normalized);
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((item) => item.lang === VOICE_CONFIG.lang) ??
      voices.find((item) => item.lang.startsWith("es")) ??
      null;

    if (voice) utterance.voice = voice;
    utterance.lang = VOICE_CONFIG.lang;
    utterance.rate = VOICE_CONFIG.rate;
    utterance.pitch = VOICE_CONFIG.pitch;
    utterance.volume = VOICE_CONFIG.volume;

    // Activar nivel simulado para que el VoiceOrb muestre actividad
    setSimulatedAudioLevel();

    let done = false;

    utterance.onend = () => {
      if (done) return;
      done = true;
      clearSimulatedAudioLevel();
      resolve({ success: true, blocked: false, provider: "browser" });
    };

    utterance.onerror = () => {
      if (done) return;
      done = true;
      clearSimulatedAudioLevel();
      resolve({ success: false, blocked: true, provider: "browser" });
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    window.setTimeout(() => {
      if (done) return;
      done = true;
      clearSimulatedAudioLevel();
      resolve({ success: false, blocked: true, provider: "browser" });
    }, 3500);
  });
}

export async function speakWelcomeRobust(text: string): Promise<SpeakResult> {
  const neural = await speakWelcomeWithNeural(text);
  if (neural.success) return neural;

  return speakWelcomeWithBrowser(text);
}
