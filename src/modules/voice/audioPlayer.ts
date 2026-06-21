// src/modules/voice/audioPlayer.ts
// Frontend Audio Player — reproduce audio blob desde el backend TTS neuronal
// Mantiene referencia global al elemento Audio activo para poder detenerlo.

"use client";

export type AudioPlayResult = {
  success: boolean;
  blocked: boolean;
};

let activeAudio: HTMLAudioElement | null = null;

// Audio context compartido — se desbloquea con user activation
let audioContext: AudioContext | null = null;

// Analyser para sincronizar el VoiceOrb con el audio real
let analyser: AnalyserNode | null = null;
let analyserData: Uint8Array | null = null;

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
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }
    // Reproducir un buffer silencioso para registrar interacción con audio
    const buffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
  } catch {
    // Si falla, el navegador no soporta Web Audio API — no es crítico
  }
}

/**
 * Detiene cualquier audio en reproducción y libera recursos.
 */
export function stopAudio(): void {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.src = "";
    } catch {
      // Ignorar errores al detener
    }
    activeAudio = null;
  }
}

/**
 * Reproduce un blob de audio (mp3) devuelto por el backend TTS.
 * Detiene cualquier reproducción previa antes de empezar.
 * @returns AudioPlayResult — éxito o bloqueado por el navegador.
 */
export function playAudioBlob(blob: Blob): Promise<AudioPlayResult> {
  return new Promise((resolve) => {
    try {
      // Detener reproducción previa
      stopAudio();

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.crossOrigin = "anonymous";
      activeAudio = audio;

      // Conectar al analyser para sincronizar el VoiceOrb con el audio real
      try {
        if (!audioContext) audioContext = new AudioContext();
        if (audioContext.state === "suspended") void audioContext.resume();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserData = new Uint8Array(analyser.frequencyBinCount);
        const src = audioContext.createMediaElementSource(audio);
        src.connect(analyser);
        analyser.connect(audioContext.destination);
      } catch {
        analyser = null;
        analyserData = null;
      }

      let resolved = false;

      const cleanup = () => {
        URL.revokeObjectURL(url);
        if (activeAudio === audio) {
          activeAudio = null;
        }
      };

      audio.onplay = () => {
        if (!resolved) {
          resolved = true;
          resolve({ success: true, blocked: false });
        }
      };

      audio.onended = () => {
        cleanup();
        if (!resolved) {
          resolved = true;
          resolve({ success: true, blocked: false });
        }
      };

      audio.onerror = () => {
        cleanup();
        if (!resolved) {
          resolved = true;
          resolve({ success: false, blocked: false });
        }
      };

      // Intentar reproducir (puede lanzar error si el navegador bloquea autoplay)
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((err: DOMException) => {
          cleanup();
          if (!resolved) {
            resolved = true;
            if (err.name === "NotAllowedError") {
              resolve({ success: false, blocked: true });
            } else {
              resolve({ success: false, blocked: false });
            }
          }
        });
      }

      // Timeout de seguridad: 15s (suficiente para textos largos)
      setTimeout(() => {
        cleanup();
        if (!resolved) {
          resolved = true;
          resolve({ success: false, blocked: true });
        }
      }, 15000);
    } catch {
      resolve({ success: false, blocked: false });
    }
  });
}
