// src/modules/voice/speechToText.ts
// Reconocimiento de voz — preparado para futura integración bidireccional
// UX 3.1.1 — Stub. Segunda versión: dictado por micrófono.
// Tercera versión: conversación bidireccional completa.

export type STTResult = {
  transcript: string;
  final: boolean;
};

export type STTState =
  | "idle"
  | "listening"
  | "processing"
  | "error"
  | "unsupported";

export type STTEventCallback = {
  onResult?: (result: STTResult) => void;
  onStateChange?: (state: STTState) => void;
  onError?: (error: string) => void;
};

/**
 * Verifica si el navegador soporta reconocimiento de voz.
 */
export function isSpeechRecognitionSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
}

/**
 * Crea una instancia de SpeechRecognition configurada para es-CL.
 * @returns La instancia o null si no es soportado.
 */
function createRecognition(): SpeechRecognition | null {
  const SpeechRecognitionAPI = window.SpeechRecognition ?? window.webkitSpeechRecognition;

  if (typeof SpeechRecognitionAPI !== "function") return null;

  const recognition = new (SpeechRecognitionAPI as new () => SpeechRecognition)();
  recognition.lang = "es-CL";
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  return recognition;
}

/**
 * Inicia el reconocimiento de voz.
 * @param callbacks — Eventos de resultado, estado y error.
 * @returns Una función para detener el reconocimiento, o null si no es soportado.
 */
export function startListening(
  callbacks: STTEventCallback,
): (() => void) | null {
  if (!isSpeechRecognitionSupported()) {
    callbacks.onStateChange?.("unsupported");
    return null;
  }

  const recognition = createRecognition();
  if (!recognition) {
    callbacks.onStateChange?.("unsupported");
    return null;
  }

  callbacks.onStateChange?.("listening");

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      const final = event.results[i].isFinal;
      callbacks.onResult?.({ transcript, final });

      if (final) {
        callbacks.onStateChange?.("processing");
      }
    }
  };

  recognition.onerror = (event) => {
    callbacks.onStateChange?.("error");
    callbacks.onError?.(event.error);
  };

  recognition.onend = () => {
    callbacks.onStateChange?.("idle");
  };

  recognition.start();

  return () => {
    try {
      recognition.stop();
    } catch {
      // Ignorar si ya está detenido
    }
  };
}
