export type DecisionPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type DecisionCategory =
  | "RISK"
  | "COMPLIANCE"
  | "DOCUMENTATION"
  | "AUTOMATION"
  | "AI"
  | "INVESTMENT"
  | "TAX_SAVINGS";

export interface DecisionItem {
  id: string;
  category: DecisionCategory;
  priority: DecisionPriority;
  title: string;
  description: string;
  impact: string;
  actionLabel: string;
  actionHref: string;
  sourceType: string;
  sourceId: string | null;
  score: number;
  createdAt: Date;
}

export interface DecisionCenterSummary {
  userId: string;
  decisions: DecisionItem[];
  criticalCount: number;
  highCount: number;
  generatedAt: Date;
}

export function priorityWeight(priority: DecisionPriority): number {
  if (priority === "CRITICAL") return 100;
  if (priority === "HIGH") return 75;
  if (priority === "MEDIUM") return 50;
  return 25;
}

export function decisionKey(sourceType: string, sourceId: string | null, title: string): string {
  return `${sourceType}:${sourceId ?? "none"}:${title.toLowerCase().trim()}`;
}
