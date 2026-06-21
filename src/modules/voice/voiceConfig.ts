// src/modules/voice/voiceConfig.ts
// Configuración de carácter de voz LEDGERA — única fuente de verdad
// UX 3.1.4 — Identidad Vocal Chilena consolidada

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
  rate: 0.92,
  pitch: 1.0,
  volume: 1.0,
  startDelay: 150,
};

// ─── Mensaje de bienvenida — UX 3.1.3 ──────────────────────────────────────
// Chileno, cercano, sin lenguaje corporativo. Frases cortas, pausas naturales.

export const WELCOME_MESSAGE = [
  "Hola.",
  "Soy Lédyera.",
  "Te voy a ayudar a entender y evaluar tu situación financiera y tributaria con criptoactivos.",
  "Cuéntame cuál es tu situación o qué quieres evaluar.",
].join("\n\n");

/** Clave de sessionStorage para evitar repetir bienvenida */
export const SESSION_STORAGE_KEY = "ledgera_voice_welcome_played";

// ─── ElevenLabs Neural TTS — Voz Ledgera (clon personalizado) ─────────────

/** Voz Ledgera — voz personalizada clonada para LEDGERA, tono profesional chileno */
export const ELEVENLABS_VOICE_ID = "9ZVfdvBemUaGEWZgCiv0";

/** Modelo multilingüe optimizado para español */
export const ELEVENLABS_MODEL = "eleven_multilingual_v2";

/**
 * Configuración base de voz para ElevenLabs — única fuente de verdad.
 *
 *   stability:        0.40 — variación natural, menos robótico
 *   similarityBoost:  0.80 — mantiene identidad del clon
 *   styleExaggeration:0.15 — preserva características del acento del clon
 *   speakerBoost:     true — mejora calidad de voces clonadas
 */
export const NEURAL_VOICE_SETTINGS = {
  stability: 0.40,
  similarityBoost: 0.80,
  styleExaggeration: 0.15,
  speakerBoost: true,
};
