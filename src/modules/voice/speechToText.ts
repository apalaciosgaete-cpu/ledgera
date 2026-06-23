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
  | "unsupported"
  | "denied"
  | "no-device";

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
 * Chrome bloquea la Web Speech API en HTTP (no seguro).
 */
export function isSecureContext(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
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
 * Primero verifica permiso/hardware con getUserMedia,
 * luego arranca SpeechRecognition con manejo robusto de errores.
 * @param callbacks — Eventos de resultado, estado y error.
 * @returns Una función para detener el reconocimiento, o null si no es soportado.
 */
export function startListening(
  callbacks: STTEventCallback,
): (() => void) | null {
  if (!isSpeechRecognitionSupported()) {
    callbacks.onStateChange?.("unsupported");
    callbacks.onError?.("Este navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari.");
    return null;
  }

  // Chrome exige HTTPS para la Web Speech API
  if (!isSecureContext()) {
    callbacks.onStateChange?.("unsupported");
    callbacks.onError?.("Chrome requiere HTTPS para el reconocimiento de voz. Conéctate por https:// o localhost.");
    return null;
  }

  const recognition = createRecognition();
  if (!recognition) {
    callbacks.onStateChange?.("unsupported");
    callbacks.onError?.("No se pudo inicializar el reconocimiento de voz en este navegador.");
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
    // Mapear errores del navegador a estados más específicos
    if (event.error === "not-allowed") {
      callbacks.onStateChange?.("denied");
      callbacks.onError?.("Permiso de micrófono denegado. Actívalo en la configuración del navegador.");
    } else if (event.error === "no-speech") {
      callbacks.onStateChange?.("error");
      callbacks.onError?.("No se detectó voz. ¿El micrófono está funcionando?");
    } else if (event.error === "audio-capture") {
      callbacks.onStateChange?.("no-device");
      callbacks.onError?.("No se encontró un micrófono. Verifica la conexión.");
    } else {
      callbacks.onStateChange?.("error");
      callbacks.onError?.(event.error);
    }
  };

  recognition.onend = () => {
    callbacks.onStateChange?.("idle");
  };

  try {
    recognition.start();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error desconocido al iniciar el micrófono";
    callbacks.onStateChange?.("error");
    callbacks.onError?.(`Error al iniciar reconocimiento: ${message}`);
    return null;
  }

  return () => {
    try {
      recognition.stop();
    } catch {
      // Ignorar si ya está detenido
    }
  };
}
