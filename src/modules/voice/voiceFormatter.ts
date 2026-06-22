// src/modules/voice/voiceFormatter.ts
// Formateo de texto para TTS neuronal — UX 3.1.3 Identidad Vocal Chilena
//
// Ajustes para prosodia chilena:
//   - Frases más cortas (punto por cada salto de línea)
//   - Pausas naturales entre ideas
//   - Sin entusiasmo artificial (evita exclamaciones)
//   - Tono consultivo, no corporativo

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
 * Limpia el texto eliminando caracteres de control.
 */
function stripControlChars(text: string): string {
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
}

/**
 * Reemplaza saltos de línea con pausas naturales.
 *
 * UX 3.1.3 — para tono chileno:
 *   Doble salto de línea = pausa larga (punto y espacio)
 *   Salto simple = pausa media (punto, no coma)
 *   Esto produce frases cortas con pausas marcadas,
 *   que es más natural para el oído chileno.
 */
function formatLineBreaks(text: string): string {
  // Doble salto → pausa larga (nueva oración)
  let result = text.replace(/\n\n+/g, ". ");
  // Salto simple → punto también, no coma (frases cortas)
  result = result.replace(/\n/g, ". ");
  return result;
}

/**
 * Asegura puntuación adecuada para prosodia natural.
 *
 * Para tono chileno:
 *   - Punto seguido para separar ideas relacionadas
 *   - Punto aparte para cambio de tema
 *   - Sin exclamaciones (elimina signos de entusiasmo artificial)
 */
function ensurePunctuation(text: string): string {
  let result = text;

  // Eliminar exclamaciones — tono chileno no las usa en asesoría
  result = result.replace(/¡/g, "");
  result = result.replace(/!/g, ".");

  // Asegurar que las oraciones tengan punto final (pero respetar comas naturales)
  // Sin reemplazo agresivo de comas — ElevenLabs maneja pausas de coma por sí solo

  // Asegurar punto final si no tiene
  if (!/[.!?]\s*$/.test(result)) {
    result += ".";
  }

  return result;
}

/**
 * Aplica el formato completo para TTS neuronal:
 * 1. Normaliza pronunciación (diccionario)
 * 2. Limpia caracteres de control
 * 3. Formatea saltos de línea como pausas
 * 4. Asegura puntuación para prosodia chilena
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

  // 3. Formatear saltos de línea como pausas
  if (opts.preserveLineBreaks) {
    result = formatLineBreaks(result);
  }

  // 4. Asegurar puntuación y prosodia chilena
  if (opts.addPauses) {
    result = ensurePunctuation(result);
  }

  return result;
}
