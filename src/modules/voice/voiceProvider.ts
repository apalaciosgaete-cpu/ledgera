// src/modules/voice/voiceProvider.ts
// Interfaz unificada para proveedores de TTS neuronal.
// Implementación principal: ElevenLabs.
// UX 3.1.3 — Matilda como voz principal, perfiles A/B, styleExaggeration.

export type TTSProvider = "elevenlabs" | "browser";

export type TTSOptions = {
  /** Voz a utilizar (voice_id para ElevenLabs) */
  voiceId: string;
  /** Estabilidad: 0-1 (ElevenLabs) — 0.45 recomendado para español natural */
  stability?: number;
  /** Similitud: 0-1 (ElevenLabs) — 0.70 recomendado */
  similarityBoost?: number;
  /** Exageración de estilo: 0-100 (ElevenLabs) — mantener bajo para tono serio */
  styleExaggeration?: number;
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

// ─── Voz principal de LEDGERA — UX 3.1.4 ────────────────────────────────────
// Voz Ledgera — voz personalizada clonada para LEDGERA, tono profesional chileno
export const LEDGERA_ELEVENLABS_VOICE = "9ZVfdvBemUaGEWZgCiv0";

// Modelo multilingüe optimizado para español
export const ELEVENLABS_MODEL = "eleven_multilingual_v2";

/**
 * Sintetiza texto usando ElevenLabs TTS API.
 * @param text — Texto a sintetizar (ya normalizado con voiceFormatter)
 * @param options — Opciones de voz (voiceId, stability, similarityBoost, styleExaggeration)
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

  const body: Record<string, unknown> = {
    text,
    model_id: model,
    voice_settings: {
      stability: options.stability ?? 0.45,
      similarity_boost: options.similarityBoost ?? 0.70,
    },
  };

  // style_exaggeration solo se envía si es > 0 (ElevenLabs lo omite por defecto)
  if (options.styleExaggeration !== undefined && options.styleExaggeration > 0) {
    (body.voice_settings as Record<string, unknown>).style_exaggeration =
      options.styleExaggeration;
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(body),
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
