import type { AutomationProposal } from "@/modules/automation/domain/automation";

export interface AutomationDependencies {
  createTask: (data: unknown) => Promise<unknown>;
  createRecommendation: (data: unknown) => Promise<unknown>;
}

export class ExecuteAutomationProposal {
  constructor(private _deps: AutomationDependencies) {}

  async execute(_proposal: AutomationProposal): Promise<void> {
    return;
  }
}
