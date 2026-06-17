export type DecisionPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type DecisionCategory =
  | "RIESGO"
  | "CUMPLIMIENTO"
  | "AHORRO_TRIBUTARIO"
  | "INVERSION"
  | "DOCUMENTACION"
  | "AUTOMATIZACION"
  | "AI";

export type DecisionSource =
  | "MONITOR"
  | "COPILOTO"
  | "AUTOMATION"
  | "AGENT_AI"
  | "SIMULADOR";

export interface DecisionImpact {
  label: string;
  value: number;
  type: "RISK" | "SCORE" | "TAX" | "COMPLIANCE";
}

export interface DecisionItem {
  id: string;
  title: string;
  description: string;
  category: DecisionCategory;
  source: DecisionSource;
  priority: DecisionPriority;
  impact: DecisionImpact | null;
  actionLabel: string;
  actionHref: string;
  sourceId: string | null;
  metadata: Record<string, unknown> | null;
  detectedAt: Date;
}

export interface DecisionCenterQueue {
  userId: string;
  total: number;
  urgentCount: number;
  attentionCount: number;
  opportunityCount: number;
  items: DecisionItem[];
  generatedAt: Date;
}

const priorityRank: Record<DecisionPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export function comparePriority(a: DecisionPriority, b: DecisionPriority): number {
  return priorityRank[b] - priorityRank[a];
}

export function groupByCategory(items: DecisionItem[]): Record<DecisionCategory, DecisionItem[]> {
  const grouped: Record<string, DecisionItem[]> = {};
  for (const cat of CATEGORIES) grouped[cat] = [];
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }
  return grouped as Record<DecisionCategory, DecisionItem[]>;
}

export const CATEGORIES: DecisionCategory[] = [
  "RIESGO",
  "CUMPLIMIENTO",
  "AHORRO_TRIBUTARIO",
  "INVERSION",
  "DOCUMENTACION",
  "AUTOMATIZACION",
  "AI",
];

export const CATEGORY_LABELS: Record<DecisionCategory, string> = {
  RIESGO: "Riesgo",
  CUMPLIMIENTO: "Cumplimiento",
  AHORRO_TRIBUTARIO: "Ahorro Tributario",
  INVERSION: "Inversión",
  DOCUMENTACION: "Documentación",
  AUTOMATIZACION: "Automatización",
  AI: "Inteligencia Artificial",
};

export const CATEGORY_EMOJIS: Record<DecisionCategory, string> = {
  RIESGO: "🔴",
  CUMPLIMIENTO: "⚖️",
  AHORRO_TRIBUTARIO: "💰",
  INVERSION: "📈",
  DOCUMENTACION: "📄",
  AUTOMATIZACION: "🤖",
  AI: "🧠",
};

export const PRIORITY_LABELS: Record<DecisionPriority, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

export function categorizePriority(priority: DecisionPriority): "urgent" | "attention" | "opportunity" {
  switch (priority) {
    case "CRITICAL":
      return "urgent";
    case "HIGH":
      return "attention";
    default:
      return "opportunity";
  }
}
