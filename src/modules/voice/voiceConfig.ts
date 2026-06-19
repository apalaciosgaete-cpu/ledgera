// src/modules/voice/voiceConfig.ts
// Configuración de carácter de voz LEDGERA — UX 3.1.1

export type VoiceQuality = {
  /** Idioma principal: es-CL */
  lang: string;
  /** Fallbacks en orden de preferencia */
  fallbacks: string[];
  /** Velocidad de habla: 0.92 – 0.96 */
  rate: number;
  /** Tono: 0.98 – 1.03 */
  pitch: number;
  /** Volumen: 0 – 1 */
  volume: number;
  /** Retardo antes de comenzar a hablar (ms) */
  startDelay: number;
};

export const VOICE_CONFIG: VoiceQuality = {
  lang: "es-CL",
  fallbacks: ["es-419", "es-ES", "es"],
  rate: 0.94,
  pitch: 1.0,
  volume: 1.0,
  startDelay: 650,
};

export const WELCOME_MESSAGE =
  "Hola. Soy Lédyera, tu Sistema Operativo Financiero y Tributario. Cuéntame cuál es tu situación, o qué quieres evaluar.";

/** Clave de sessionStorage para evitar repetir bienvenida */
export const SESSION_STORAGE_KEY = "ledgera_voice_welcome_played";

// ─── ElevenLabs Neural TTS ──────────────────────────────────────────────────

/** Voz Rachel — profesional, clara, excelente para español */
export const ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

/** Modelo multilingüe optimizado para español */
export const ELEVENLABS_MODEL = "eleven_multilingual_v2";

/** Configuración de voz para el proveedor neuronal */
export const NEURAL_VOICE_SETTINGS = {
  stability: 0.45,
  similarityBoost: 0.75,
};
