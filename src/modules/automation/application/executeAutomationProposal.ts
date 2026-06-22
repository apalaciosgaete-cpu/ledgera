import { AutomationProposal } from "@/modules/automation/domain/automation";
import {
  markExecuted,
  markFailed,
} from "@/modules/automation/infrastructure/automationRepository";

export interface AutomationDependencies {
  createTask: (data: any) => Promise<any>;
  createRecommendation: (data: any) => Promise<any>;
}

export class ExecuteAutomationProposal {
  constructor(private deps: AutomationDependencies) {}

  async execute(proposal: AutomationProposal): Promise<void> {
    try {
      switch (proposal.type) {
        case "CREATE_TASK":
        case "CREATE_FOLLOW_UP":
        case "CREATE_REMINDER":
          await this.deps.createTask({
            userId: proposal.userId,
            title: proposal.title,
            description: proposal.description,
            category: proposal.type === "CREATE_REMINDER" ? "REMINDER" : "GENERAL",
            priority: proposal.priority,
            source: "AUTOMATION",
            sourceId: proposal.id,
            metadata: proposal.metadata,
          });
          break;

        case "CREATE_RECOMMENDATION":
          await this.deps.createRecommendation({
            userId: proposal.userId,
            category: "AUTOMATION",
            priority: proposal.priority,
            title: proposal.title,
            description: proposal.description,
            actionLabel: (proposal.metadata as any)?.actionLabel || "Ver más",
            actionUrl: (proposal.metadata as any)?.actionUrl || "/dashboard",
            sourceType: "AUTOMATION",
            sourceId: proposal.id,
          });
          break;
      }
      await markExecuted(proposal.id);
    } catch (error: any) {
      await markFailed(proposal.id, error.message || "Execution error");
      throw error;
    }
  }
}
