// src/modules/voice/voiceDictionary.ts
// Diccionario de pronunciación — corrige palabras clave antes de hablar
// UX 3.1.3 — afinado para identidad vocal chilena
// Evita que el TTS diga "Legera", "criptoactivos" literal, etc.

export type PronunciationEntry = {
  pattern: RegExp;
  replacement: string;
};

const DICTIONARY: PronunciationEntry[] = [
  // ── Marca LEDGERA ────────────────────────────────────────────────────────
  // El caso más importante: que diga "Lédyera", no "Legera" ni "Ledgera"
  { pattern: /\bLEDGERA\b/gi, replacement: "Lédyera" },

  // ── Términos financieros y tributarios ───────────────────────────────────
  // "tributaria" con énfasis correcto
  { pattern: /\btributaria\b/gi, replacement: "tributária" },
  { pattern: /\btributario\b/gi, replacement: "tributário" },

  // cryptoactivos → separado para mejor prosodia
  { pattern: /\bcryptoactivos?\b/gi, replacement: "cripto activos" },
  { pattern: /\bcrypto[- ]?activos?\b/gi, replacement: "cripto activos" },
  { pattern: /\bcriptoactivos?\b/gi, replacement: "cripto activos" },

  // ── Siglas — letra por letra (evita que las lea como palabras) ──────────
  { pattern: /\bSII\b/g, replacement: "ese i i" },
  { pattern: /\bUSDT\b/g, replacement: "u ese de te" },
  { pattern: /\bBTC\b/g, replacement: "be te ce" },
  { pattern: /\bETH\b/g, replacement: "e te ache" },
  { pattern: /\bUSDC\b/g, replacement: "u ese de ce" },
  { pattern: /\bDAI\b/g, replacement: "da i" },

  // ── Marcas y plataformas ─────────────────────────────────────────────────
  { pattern: /\bBinance\b/gi, replacement: "bainans" },

  // ── Términos técnicos — fonética adaptada al español chileno ────────────
  { pattern: /\bwallet\b/gi, replacement: "guólet" },
  { pattern: /\bwallets\b/gi, replacement: "guólets" },
  { pattern: /\bstaking\b/gi, replacement: "estéikin" },
  { pattern: /\btoken\b/gi, replacement: "tóken" },
  { pattern: /\btokens\b/gi, replacement: "tókens" },
  { pattern: /\bblockchain\b/gi, replacement: "bloch chain" },
  { pattern: /\btrading\b/gi, replacement: "tréiding" },
  { pattern: /\bswap\b/gi, replacement: "suáp" },
  { pattern: /\bfiat\b/gi, replacement: "fiát" },
];

/**
 * Normaliza un texto aplicando el diccionario de pronunciación.
 * Úsalo ANTES de pasar el texto al TTS neuronal o a speechSynthesis.
 */
export function normalizePronunciation(text: string): string {
  let result = text;
  for (const entry of DICTIONARY) {
    result = result.replace(entry.pattern, entry.replacement);
  }
  return result;
}
