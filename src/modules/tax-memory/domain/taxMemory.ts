export type TaxMemoryCategory = "RISK" | "TASK" | "RECOMMENDATION" | "DOCUMENT" | "SII" | "AUTOMATION";

export type TaxMemoryStrength = "LOW" | "MEDIUM" | "HIGH";

export interface TaxMemoryPattern {
  id: string;
  userId: string;
  category: TaxMemoryCategory;
  title: string;
  description: string;
  strength: TaxMemoryStrength;
  occurrenceCount: number;
  lastSeenAt: Date;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertTaxMemoryPatternInput {
  userId: string;
  category: TaxMemoryCategory;
  title: string;
  description: string;
  strength: TaxMemoryStrength;
  occurrenceCount?: number;
  metadata?: Record<string, unknown> | null;
}

export function resolveMemoryStrength(count: number): TaxMemoryStrength {
  if (count >= 5) return "HIGH";
  if (count >= 2) return "MEDIUM";
  return "LOW";
}
