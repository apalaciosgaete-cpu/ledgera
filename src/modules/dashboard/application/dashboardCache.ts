import type { ExecutiveDashboardSnapshot } from "@/modules/dashboard/domain/executiveDashboard";

const TTL_MS = 60 * 1000;

let cache: {
  snapshot: ExecutiveDashboardSnapshot;
  generatedAt: number;
} | null = null;

export function getCachedDashboard(): ExecutiveDashboardSnapshot | null {
  if (!cache) return null;
  if (Date.now() - cache.generatedAt > TTL_MS) {
    cache = null;
    return null;
  }
  return cache.snapshot;
}

export function setCachedDashboard(snapshot: ExecutiveDashboardSnapshot): void {
  cache = {
    snapshot,
    generatedAt: Date.now(),
  };
}

export function clearDashboardCache(): void {
  cache = null;
}
