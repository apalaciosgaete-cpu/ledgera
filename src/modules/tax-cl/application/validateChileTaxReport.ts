import type { ChileAnnualDeclaration } from "./buildChileAnnualDeclaration";

export type ValidationIssue = {
  code:        string;
  severity:    "ERROR" | "WARNING" | "INFO";
  description: string;
};

export type ValidationResult = {
  valid:  boolean;
  issues: ValidationIssue[];
};

export function validateChileTaxReport(declaration: ChileAnnualDeclaration): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (declaration.pendingCount > 0) {
    issues.push({
      code:        "PENDING_EVENTS",
      severity:    "ERROR",
      description: `${declaration.pendingCount} línea(s) con categoría PENDIENTE — no se puede declarar hasta clasificar`,
    });
  }

  if (declaration.lines.length === 0) {
    issues.push({
      code:        "NO_LINES",
      severity:    "WARNING",
      description: "La declaración no tiene líneas — confirma que importaste todos los movimientos del año",
    });
  }

  const negativeProceeds = declaration.lines.filter((l) => l.totalProceedsClp < 0);
  if (negativeProceeds.length > 0) {
    issues.push({
      code:        "NEGATIVE_PROCEEDS",
      severity:    "ERROR",
      description: `${negativeProceeds.length} línea(s) con ingresos negativos — revisar datos fuente`,
    });
  }

  const incomeLines = declaration.lines.filter((l) => l.category === "INGRESO_TRIBUTABLE");
  if (incomeLines.length > 0) {
    issues.push({
      code:        "STAKING_INCOME_REVIEW",
      severity:    "INFO",
      description: `${incomeLines.length} línea(s) de ingreso tributable (staking/airdrop) — verificar base imponible`,
    });
  }

  const valid = !issues.some((i) => i.severity === "ERROR");
  return { valid, issues };
}
