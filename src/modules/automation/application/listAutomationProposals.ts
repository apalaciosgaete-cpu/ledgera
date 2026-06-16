import { listProposals, listUserProposals } from "@/modules/automation/infrastructure/automationRepository";
import type { AutomationProposal, AutomationProposalFilters } from "@/modules/automation/domain/automation";

export type ListAutomationProposalsResult =
  | { ok: true; proposals: AutomationProposal[] }
  | { ok: false; message: string };

export async function getUserAutomationProposals(
  userId: string,
  filters?: AutomationProposalFilters,
): Promise<ListAutomationProposalsResult> {
  try {
    const proposals = await listUserProposals(userId, filters);
    return { ok: true, proposals };
  } catch (error) {
    console.error("[automation/getUserAutomationProposals]", error);
    return { ok: false, message: "No se pudieron obtener las propuestas." };
  }
}

export async function getAutomationProposals(
  filters?: AutomationProposalFilters,
): Promise<ListAutomationProposalsResult> {
  try {
    const proposals = await listProposals(filters);
    return { ok: true, proposals };
  } catch (error) {
    console.error("[automation/getAutomationProposals]", error);
    return { ok: false, message: "No se pudieron obtener las propuestas." };
  }
}
