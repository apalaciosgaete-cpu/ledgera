// Versión del motor tributario
// Incrementar cuando cambie: algoritmo FIFO, taxPolicy, FX, redondeos
// Formato: MAJOR.MINOR.PATCH
// MAJOR: cambio de algoritmo que altera resultados históricos
// MINOR: nueva funcionalidad (nueva categoría, nueva regla SII)
// PATCH: corrección de bug sin impacto en resultados

export const TAX_ENGINE_VERSION = "1.0.0";

export const TAX_ENGINE_METADATA = {
  version:        TAX_ENGINE_VERSION,
  algorithm:      "FIFO",
  roundingMode:   "HALF_UP",
  decimalPlaces:  8,
  fxSource:       "mindicador.cl",
  normativa:      "Circular SII N°23/2021",
  regime:         "PERSONA_NATURAL",
} as const;