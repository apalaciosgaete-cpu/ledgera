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

// Analyser para sincronizar el VoiceOrb con el audio real
let analyser: AnalyserNode | null = null;
let analyserData: Uint8Array<ArrayBuffer> | null = null;

// Flag para detectar cancelación por stopAudio()
let playbackCancelled = false;
let resolvePlayback: ((result: AudioPlayResult) => void) | null = null;

/** Retorna el nivel de amplitud promedio del audio en reproducción (0–1). */
export function getAudioLevel(): number {
  if (!analyser || !analyserData) return 0;
  analyser.getByteFrequencyData(analyserData);
  let sum = 0;
  for (let i = 0; i < analyserData.length; i++) sum += analyserData[i];
  return sum / analyserData.length / 255;
}

/**
 * Desbloquea el autoplay del navegador usando la user activation actual.
 * Debe llamarse dentro de la ventana de activación (< 1s tras el gesto del usuario).
 */
export function unlockAutoplay(): void {
  if (typeof window === "undefined") return;
  try {
    if (!audioContext) audioContext = new AudioContext();
    if (audioContext.state === "suspended") void audioContext.resume();
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
 * Detiene cualquier audio en reproducción y limpia el analyser.
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
  analyser = null;
  analyserData = null;
}

/**
 * Reproduce un blob de audio (mp3) devuelto por el backend TTS.
 * Usa AudioBufferSourceNode para garantizar sincronización real con el AnalyserNode.
 */
export function playAudioBlob(blob: Blob): Promise<AudioPlayResult> {
  return new Promise((resolve) => {
    stopAudio();
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
              // Analyser conectado entre source y destination
              analyser = audioContext!.createAnalyser();
              analyser.fftSize = 256;
              analyserData = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
              analyser.connect(audioContext!.destination);

              const source = audioContext!.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(analyser);
              activeSource = source;

              source.onended = () => {
                if (!playbackCancelled) {
                  resolve({ success: true, blocked: false });
                }
                activeSource = null;
                analyser = null;
                analyserData = null;
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
