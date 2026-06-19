// src/modules/voice/audioPlayer.ts
// Frontend Audio Player — reproduce audio blob desde el backend TTS neuronal
// Maneja autoplay, detección de bloqueo y reproducción secuencial.

"use client";

export type AudioPlayResult = {
  success: boolean;
  blocked: boolean;
};

/**
 * Reproduce un blob de audio (mp3) devuelto por el backend TTS.
 * @returns AudioPlayResult — éxito o bloqueado por el navegador.
 */
export function playAudioBlob(blob: Blob): Promise<AudioPlayResult> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      let resolved = false;

      const cleanup = () => {
        URL.revokeObjectURL(url);
      };

      audio.oncanplaythrough = () => {
        // El audio está listo para reproducirse
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
        playPromise
          .then(() => {
            // Inició reproducción
          })
          .catch((err: DOMException) => {
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

      // Timeout de seguridad: 5s
      setTimeout(() => {
        cleanup();
        if (!resolved) {
          resolved = true;
          resolve({ success: false, blocked: true });
        }
      }, 5000);
    } catch {
      resolve({ success: false, blocked: false });
    }
  });
}

/**
 * Detiene cualquier audio en reproducción.
 */
export function stopAudio(): void {
  // No hay API global para detener un Audio(), pero podemos
  // silenciar todos los elementos audio creados.
  // Por ahora es un placeholder — la detención real requiere
  // mantener una referencia al elemento audio.
}
