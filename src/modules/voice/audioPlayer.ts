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
      activeAudio = audio;

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
