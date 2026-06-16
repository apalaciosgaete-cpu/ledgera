export type RecommendationCategory =
  | "TRIBUTARY"
  | "COMPLIANCE"
  | "OPERATIONS"
  | "CONNECTIONS"
  | "BILLING"
  | "RISK";

export type RecommendationPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type RecommendationStatus =
  | "ACTIVE"
  | "DISMISSED"
  | "COMPLETED";

export interface Recommendation {
  id: string;
  userId: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  status: RecommendationStatus;
  sourceType: string;
  sourceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRecommendationInput {
  userId: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  sourceType: string;
  sourceId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface RecommendationSignal {
  userId: string;
  category: RecommendationCategory;
  sourceType: string;
  sourceId?: string | null;
  priority: RecommendationPriority;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  metadata?: Record<string, unknown> | null;
}

export const RECOMMENDATION_CATEGORIES: RecommendationCategory[] = [
  "TRIBUTARY",
  "COMPLIANCE",
  "OPERATIONS",
  "CONNECTIONS",
  "BILLING",
  "RISK",
];

export const RECOMMENDATION_PRIORITIES: RecommendationPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

export const RECOMMENDATION_STATUSES: RecommendationStatus[] = [
  "ACTIVE",
  "DISMISSED",
  "COMPLETED",
];

export function isValidRecommendationCategory(value: string): value is RecommendationCategory {
  return RECOMMENDATION_CATEGORIES.includes(value as RecommendationCategory);
}

export function isValidRecommendationPriority(value: string): value is RecommendationPriority {
  return RECOMMENDATION_PRIORITIES.includes(value as RecommendationPriority);
}

export function isValidRecommendationStatus(value: string): value is RecommendationStatus {
  return RECOMMENDATION_STATUSES.includes(value as RecommendationStatus);
}

/**
 * Genera una clave canónica para deduplicar recomendaciones.
 * Dos señales con la misma clave se consideran la misma recomendación.
 */
export function recommendationKey(signal: {
  userId: string;
  sourceType: string;
  sourceId?: string | null;
}): string {
  const suffix = signal.sourceId ? `:${signal.sourceId}` : "";
  return `${signal.userId}:${signal.sourceType}${suffix}`;
}
