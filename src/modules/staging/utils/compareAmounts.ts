export type AmountTolerance = {
  absolute?: number;
  relative?: number;
};

export function clpToUsd(clp: number, usdClpRate: number): number {
  if (usdClpRate <= 0) return 0;
  return clp / usdClpRate;
}

export function amountsWithinTolerance(
  a: number,
  b: number,
  tolerance: AmountTolerance = { relative: 0.05 },
): boolean {
  if (a === 0 && b === 0) return true;
  const max = Math.max(Math.abs(a), Math.abs(b));
  if (max === 0) return true;
  if (tolerance.absolute !== undefined && Math.abs(a - b) <= tolerance.absolute) return true;
  if (tolerance.relative !== undefined && Math.abs(a - b) / max <= tolerance.relative) return true;
  return false;
}

export function scoreAmountMatch(bankClp: number, pmUsd: number, usdClpRate: number): number {
  const pmClp = pmUsd * usdClpRate;
  if (bankClp <= 0 || pmClp <= 0) return 0;
  return Math.min(bankClp, pmClp) / Math.max(bankClp, pmClp);
}
