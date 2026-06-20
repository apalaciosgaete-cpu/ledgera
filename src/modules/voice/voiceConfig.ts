// src/modules/voice/voiceConfig.ts
// Configuración de carácter de voz LEDGERA — UX 3.1.3 Identidad Vocal Chilena

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
  startDelay: 750,
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

// ─── ElevenLabs Neural TTS — UX 3.1.3 ──────────────────────────────────────

/** Voz Matilda — cálida, cercana, excelente entonación natural en español LATAM */
export const ELEVENLABS_VOICE_ID = "XrExE9yKIg1WjnnlVkGX";

/** Modelo multilingüe optimizado para español */
export const ELEVENLABS_MODEL = "eleven_multilingual_v2";

/** Configuración base de voz para el proveedor neuronal */
export const NEURAL_VOICE_SETTINGS = {
  stability: 0.45,
  similarityBoost: 0.70,
  styleExaggeration: 0,
};

// ─── Perfiles A/B para identidad vocal ──────────────────────────────────────
// Probar 3 perfiles y dejar uno solo.
// Voz A = Consultiva cercana  → Matilda (default)
// Voz B = Profesional sobria  → Brian
// Voz C = Ejecutiva cálida    → Marcus

export type VoiceProfile = {
  id: string;
  label: string;
  description: string;
  voiceId: string;
  stability: number;
  similarityBoost: number;
  styleExaggeration: number;
  rate: number;
};

export const VOICE_PROFILES: Record<string, VoiceProfile> = {
  consultiva: {
    id: "consultiva",
    label: "Consultiva Cercana",
    description: "Voz femenina cálida, cercana, tono asesor natural. Recomendada para LEDGERA.",
    voiceId: "XrExE9yKIg1WjnnlVkGX", // Matilda
    stability: 0.45,
    similarityBoost: 0.70,
    styleExaggeration: 0,
    rate: 0.92,
  },
  profesional: {
    id: "profesional",
    label: "Profesional Sobria",
    description: "Voz masculina serena, tono institucional sobrio, sin entusiasmo artificial.",
    voiceId: "nPczCjzI2devNBz1zQrb", // Brian
    stability: 0.55,
    similarityBoost: 0.75,
    styleExaggeration: 0,
    rate: 0.90,
  },
  ejecutiva: {
    id: "ejecutiva",
    label: "Ejecutiva Cálida",
    description: "Voz masculina sofisticada, tono ejecutivo pero cercano, transmite confianza.",
    voiceId: "vGWWh1bodhwwi4yHd6qZ", // Marcus
    stability: 0.50,
    similarityBoost: 0.72,
    styleExaggeration: 5,
    rate: 0.93,
  },
};

/** Perfil activo por defecto */
export const ACTIVE_VOICE_PROFILE: VoiceProfile = VOICE_PROFILES.consultiva;
