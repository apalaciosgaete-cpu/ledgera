export function round(value: number, decimals = 8): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function normalizeSymbol(value: string): string {
  return value.trim().toUpperCase();
}
