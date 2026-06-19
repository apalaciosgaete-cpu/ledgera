// src/modules/voice/voiceFormatter.ts
// Formateo de texto para TTS neuronal — limpia, estructura pausas,
// y aplica el diccionario de pronunciación antes de enviar al proveedor.
// ElevenLabs no necesita SSML, pero sí texto limpio con marcadores de pausa.

import { normalizePronunciation } from "./voiceDictionary";

export type TextFormatOptions = {
  /** Agregar pausas después de signos de puntuación principales */
  addPauses: boolean;
  /** Reemplazar saltos de línea con pausas */
  preserveLineBreaks: boolean;
};

const DEFAULT_OPTIONS: TextFormatOptions = {
  addPauses: true,
  preserveLineBreaks: true,
};

/**
 * Limpia el texto eliminando caracteres de control, URLs, etc.
 */
function stripControlChars(text: string): string {
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
}

/**
 * Reemplaza saltos de línea dobles con pausas más largas (puntos suspensivos).
 * Los saltos simples se convierten en comas para pausa breve.
 */
function formatLineBreaks(text: string): string {
  // Doble salto de línea → punto y pausa
  let result = text.replace(/\n\n+/g, ". ");
  // Salto de línea simple → pausa breve con coma
  result = result.replace(/\n/g, ", ");
  return result;
}

/**
 * Agrega pausas naturales donde el texto las necesita.
 * ElevenLabs maneja bien las pausas con puntuación estándar,
 * pero aseguramos que no falten puntos o comas.
 */
function ensurePunctuation(text: string): string {
  let result = text;

  // Asegurar punto final si no tiene
  if (!/[.!?]\s*$/.test(result)) {
    result += ".";
  }

  // Asegurar comas después de frases introductorias
  // "Hola" → "Hola," (si no tiene puntuación)
  result = result.replace(/^(Hola|Bienvenido|Bienvenida)(\s+[A-ZÁÉÍÓÚ])/g, "$1,$2");

  return result;
}

/**
 * Aplica el formato completo para TTS neuronal:
 * 1. Normaliza pronunciación (diccionario)
 * 2. Limpia caracteres de control
 * 3. Formatea saltos de línea
 * 4. Asegura puntuación adecuada
 */
export function formatForTTS(
  text: string,
  options: Partial<TextFormatOptions> = {},
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let result = text;

  // 1. Normalizar pronunciación primero
  result = normalizePronunciation(result);

  // 2. Limpiar caracteres de control
  result = stripControlChars(result);

  // 3. Formatear saltos de línea
  if (opts.preserveLineBreaks) {
    result = formatLineBreaks(result);
  }

  // 4. Asegurar puntuación
  if (opts.addPauses) {
    result = ensurePunctuation(result);
  }

  return result;
}
