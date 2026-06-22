export type OperatingStatus =
  | "OPTIMAL"
  | "NORMAL"
  | "ATTENTION"
  | "CRITICAL";

export type EngineStatus =
  | "OK"
  | "ATTENTION"
  | "CRITICAL"
  | "DISABLED";

export interface EngineState {
  name: string;
  status: EngineStatus;
  summary: string;
}

export interface LAIOSState {
  id?: string;
  userId: string;

  monitoringStatus: string;

  activeCases: number;
  activeWorkflows: number;
  pendingDecisions: number;
  pendingExecutions: number;

  adaptiveProfileScore: number | null;
  taxHealthScore: number | null;

  operatingStatus: OperatingStatus;
  executiveSummary: string;
  engineStates: EngineState[];

  generatedAt: Date;
}

export const OPERATING_LABELS: Record<OperatingStatus, string> = {
  OPTIMAL: "Óptimo",
  NORMAL: "Normal",
  ATTENTION: "Atención",
  CRITICAL: "Crítico",
};

export const OPERATING_EMOJIS: Record<OperatingStatus, string> = {
  OPTIMAL: "🟢",
  NORMAL: "🔵",
  ATTENTION: "🟡",
  CRITICAL: "🔴",
};

export const ENGINE_EMOJIS: Record<string, string> = {
  Monitor: "📡",
  Casos: "📂",
  Workflows: "⚙️",
  Decisiones: "🎯",
  Ejecuciones: "🤖",
  "Perfil Adaptativo": "🧠",
  "Memoria Tributaria": "💾",
  "Multiagente": "👥",
};

export function operatingColor(status: OperatingStatus): string {
  switch (status) {
    case "OPTIMAL": return "#047857";
    case "NORMAL": return "#2563EB";
    case "ATTENTION": return "#B45309";
    case "CRITICAL": return "#B91C1C";
  }
}

export function engineColor(status: EngineStatus): string {
  switch (status) {
    case "OK": return "#047857";
    case "ATTENTION": return "#B45309";
    case "CRITICAL": return "#B91C1C";
    case "DISABLED": return "#94A3B8";
  }
}

export function resolveOperatingStatus(engineStates: EngineState[]): OperatingStatus {
  if (engineStates.some((e) => e.status === "CRITICAL")) return "CRITICAL";
  if (engineStates.some((e) => e.status === "ATTENTION")) return "ATTENTION";
  if (engineStates.every((e) => e.status === "OK")) return "OPTIMAL";
  return "NORMAL";
}
