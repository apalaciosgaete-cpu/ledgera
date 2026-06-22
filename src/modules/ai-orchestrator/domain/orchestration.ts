export type OrchestrationStatus = "SUCCESS" | "PARTIAL" | "FAILED";

export interface OrchestrationResult {
  id: string;
  userId: string;
  status: OrchestrationStatus;
  riskUpdated: boolean;
  recommendationsCreated: number;
  automationsCreated: number;
  errors: string[];
  executedAt: Date;
}

export interface CreateOrchestrationRunInput {
  userId: string;
  status: OrchestrationStatus;
  riskUpdated?: boolean;
  recommendationsCreated?: number;
  automationsCreated?: number;
  errors?: string[];
}
