export type SimulationScenarioType = "INCOME" | "INVESTMENT" | "COMPLIANCE" | "CUSTOM";

export interface SimulationInput {
  scenarioType: SimulationScenarioType;
  payload: Record<string, unknown>;
}

export interface SimulationImpact {
  currentRisk: number;
  projectedRisk: number;
  currentScore: number;
  projectedScore: number;
  taxImpact: number;
}

export interface SimulationResult {
  summary: string;
  impact: SimulationImpact;
  recommendations: string[];
}

export interface TaxSimulation {
  id: string;
  userId: string;
  name: string;
  scenarioType: SimulationScenarioType;
  inputData: SimulationInput;
  resultData: SimulationResult;
  projectedRisk: number | null;
  projectedScore: number | null;
  createdAt: Date;
}

export function isValidSimulationScenarioType(value: string): value is SimulationScenarioType {
  return ["INCOME", "INVESTMENT", "COMPLIANCE", "CUSTOM"].includes(value);
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
