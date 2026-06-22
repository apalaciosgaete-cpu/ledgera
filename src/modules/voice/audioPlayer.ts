// src/modules/voice/audioPlayer.ts
// Frontend Audio Player — reproduce audio blob desde el backend TTS neuronal

"use client";

export type AudioPlayResult = {
  success: boolean;
  blocked: boolean;
};

// Audio context compartido — se desbloquea con user activation
let audioContext: AudioContext | null = null;

// Nodo activo para poder detener la reproducción
let activeSource: AudioBufferSourceNode | null = null;

// Analyser persistente para sincronizar el VoiceOrb con el audio real
let analyser: AnalyserNode | null = null;
let analyserData: Uint8Array<ArrayBuffer> | null = null;

// Flag para detectar cancelación por stopAudio()
let playbackCancelled = false;
let resolvePlayback: ((result: AudioPlayResult) => void) | null = null;

// Nivel simulado para fallback de browser speechSynthesis
let simulatedLevel = 0;
let simulatedLevelInterval: ReturnType<typeof setInterval> | null = null;

/** Crea el AnalyserNode persistente si aún no existe. */
function ensureAnalyser(): void {
  if (analyser) return;
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
    } catch {
      return;
    }
  }
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  analyserData = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
  analyser.connect(audioContext.destination);
}

/** Retorna el nivel de amplitud promedio del audio en reproducción (0–1). */
export function getAudioLevel(): number {
  // Prioridad: nivel simulado (browser fallback) > analyser real
  if (simulatedLevel > 0) return simulatedLevel;
  if (!analyser || !analyserData) return 0;
  analyser.getByteFrequencyData(analyserData);
  let sum = 0;
  for (let i = 0; i < analyserData.length; i++) sum += analyserData[i];
  return sum / analyserData.length / 255;
}

/**
 * Desbloquea el autoplay del navegador usando la user activation actual.
 * También inicializa el analizador persistente para el VoiceOrb.
 */
export function unlockAutoplay(): void {
  if (typeof window === "undefined") return;
  try {
    if (!audioContext) audioContext = new AudioContext();
    if (audioContext.state === "suspended") void audioContext.resume();
    // Inicializa el analizador persistente para el VoiceOrb
    ensureAnalyser();
    const buffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
  } catch {
    // Web Audio API no disponible — no es crítico
  }
}

/**
 * Detiene cualquier audio en reproducción.
 * NO limpia el analyser para que el VoiceOrb mantenga visualización continua.
 */
export function stopAudio(): void {
  try {
    activeSource?.stop();
  } catch {
    // ignore
  }
  playbackCancelled = true;
  if (resolvePlayback) {
    resolvePlayback({ success: false, blocked: false });
    resolvePlayback = null;
  }
  activeSource = null;
  // Mantenemos el analyser vivo para sincronización del VoiceOrb
  // analyser = null; ← NO limpiar
  // analyserData = null; ← NO limpiar
}

/**
 * Reproduce un blob de audio (mp3) devuelto por el backend TTS.
 * Conecta el audio al AnalyserNode persistente del VoiceOrb.
 */
export function playAudioBlob(blob: Blob): Promise<AudioPlayResult> {
  return new Promise((resolve) => {
    stopAudio();
    clearSimulatedAudioLevel();
    playbackCancelled = false;
    resolvePlayback = resolve;

    blob.arrayBuffer().then((arrayBuffer) => {
      if (!audioContext) {
        try {
          audioContext = new AudioContext();
        } catch {
          resolve({ success: false, blocked: false });
          return;
        }
      }

      const resume = audioContext.state === "suspended"
        ? audioContext.resume()
        : Promise.resolve();

      resume.then(() => {
        audioContext!.decodeAudioData(
          arrayBuffer,
          (audioBuffer) => {
            try {
              // Usa el analizador persistente en vez de crear uno nuevo
              ensureAnalyser();

              const source = audioContext!.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(analyser!);
              activeSource = source;

              source.onended = () => {
                if (!playbackCancelled) {
                  resolve({ success: true, blocked: false });
                }
                activeSource = null;
                resolvePlayback = null;
              };

              source.start(0);
            } catch {
              resolve({ success: false, blocked: false });
            }
          },
          () => {
            resolve({ success: false, blocked: false });
          },
        );
      }).catch(() => {
        resolve({ success: false, blocked: true });
      });
    }).catch(() => {
      resolve({ success: false, blocked: false });
    });
  });
}

// ─── Nivel simulado para browser speechSynthesis ──────────────────────────

/** Activa un nivel de audio simulado (0.15–0.7) para que el VoiceOrb
 *  muestre actividad durante el fallback a browser speechSynthesis. */
export function setSimulatedAudioLevel(): void {
  clearSimulatedAudioLevel();
  simulatedLevel = 0.3;
  simulatedLevelInterval = setInterval(() => {
    simulatedLevel = 0.15 + Math.random() * 0.55;
  }, 80);
}

/** Desactiva el nivel simulado. */
export function clearSimulatedAudioLevel(): void {
  if (simulatedLevelInterval !== null) {
    clearInterval(simulatedLevelInterval);
    simulatedLevelInterval = null;
  }
  simulatedLevel = 0;
}
