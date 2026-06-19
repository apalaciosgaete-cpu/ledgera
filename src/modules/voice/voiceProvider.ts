// src/modules/voice/voiceProvider.ts
// Interfaz unificada para proveedores de TTS neuronal.
// Implementación principal: ElevenLabs.
// Se puede extender con Azure, OpenAI, etc.

export type TTSProvider = "elevenlabs" | "browser";

export type TTSOptions = {
  /** Voz a utilizar (voice_id para ElevenLabs) */
  voiceId: string;
  /** Estabilidad: 0-1 (ElevenLabs) */
  stability?: number;
  /** Similitud: 0-1 (ElevenLabs) */
  similarityBoost?: number;
  /** Modelo (ElevenLabs: eleven_multilingual_v2, eleven_flash_v2) */
  model?: string;
};

export type TTSResult = {
  /** Audio en ArrayBuffer */
  audio: ArrayBuffer;
  /** Formato del audio */
  format: "mp3";
  /** Proveedor usado */
  provider: TTSProvider;
};

export type TTSProviderError = {
  code: string;
  message: string;
  status: number;
};

// ─── Voz recomendada para LEDGERA en ElevenLabs ──────────────────────────────
// "Rachel" — voz femenina clara, profesional, excelente para español
export const LEDGERA_ELEVENLABS_VOICE = "EXAVITQu4vr4xnSDxMaL";

// Modelo multilingüe optimizado para español
export const ELEVENLABS_MODEL = "eleven_multilingual_v2";

/**
 * Sintetiza texto usando ElevenLabs TTS API.
 * @param text — Texto a sintetizar (ya normalizado con voiceFormatter)
 * @param options — Opciones de voz
 * @returns TTSResult con el audio en ArrayBuffer
 */
export async function synthesizeWithElevenLabs(
  text: string,
  options: Partial<TTSOptions> = {},
): Promise<TTSResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw {
      code: "NO_API_KEY",
      message: "ELEVENLABS_API_KEY no está configurada en las variables de entorno.",
      status: 500,
    } satisfies TTSProviderError;
  }

  const voiceId = options.voiceId ?? LEDGERA_ELEVENLABS_VOICE;
  const model = options.model ?? ELEVENLABS_MODEL;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability: options.stability ?? 0.45,
          similarity_boost: options.similarityBoost ?? 0.75,
        },
      }),
    },
  );

  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
    } catch {
      errorBody = "No se pudo leer el cuerpo del error.";
    }

    throw {
      code: `HTTP_${response.status}`,
      message: `ElevenLabs TTS error: ${response.status} — ${errorBody}`,
      status: response.status,
    } satisfies TTSProviderError;
  }

  const audio = await response.arrayBuffer();

  return {
    audio,
    format: "mp3",
    provider: "elevenlabs",
  };
}
