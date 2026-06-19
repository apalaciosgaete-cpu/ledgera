// src/modules/voice/voiceCache.ts
// Caché de audio TTS — evita sintetizar repetidamente el mismo texto.
// Almacena los blobs de audio en memoria clave-valor.
// En producción, se podría migrar a Redis o CDN.

import type { TTSProvider } from "./voiceProvider";

export type CacheEntry = {
  audio: ArrayBuffer;
  format: "mp3" | "wav" | "ogg";
  provider: TTSProvider;
  cachedAt: number;
};

const CACHE = new Map<string, CacheEntry>();

/** Tamaño máximo del caché: 50 entradas */
const MAX_CACHE_SIZE = 50;

function makeKey(text: string, voiceId: string): string {
  // Normalizar espacios para mejorar hits de caché
  const normalized = text.replace(/\s+/g, " ").trim();
  return `${voiceId}::${normalized}`;
}

/**
 * Obtiene una entrada del caché si existe.
 */
export function getCachedAudio(
  text: string,
  voiceId: string,
): CacheEntry | null {
  const key = makeKey(text, voiceId);
  return CACHE.get(key) ?? null;
}

/**
 * Almacena un resultado de audio en el caché.
 */
export function setCachedAudio(
  text: string,
  voiceId: string,
  entry: CacheEntry,
): void {
  // Si el caché está lleno, eliminar la entrada más antigua
  if (CACHE.size >= MAX_CACHE_SIZE) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [k, v] of CACHE) {
      if (v.cachedAt < oldestTime) {
        oldestTime = v.cachedAt;
        oldestKey = k;
      }
    }

    if (oldestKey) CACHE.delete(oldestKey);
  }

  const key = makeKey(text, voiceId);
  CACHE.set(key, entry);
}

/**
 * Limpia el caché completo.
 */
export function clearAudioCache(): void {
  CACHE.clear();
}

/**
 * Retorna el tamaño actual del caché.
 */
export function getCacheSize(): number {
  return CACHE.size;
}
