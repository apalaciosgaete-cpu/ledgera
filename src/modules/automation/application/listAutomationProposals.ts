import type { AutomationProposal, AutomationProposalFilters } from "@/modules/automation/domain/automation";

export type ListAutomationProposalsResult =
  | { ok: true; proposals: AutomationProposal[] }
  | { ok: false; message: string };

export async function getUserAutomationProposals(
  _userId: string,
  _filters?: AutomationProposalFilters,
): Promise<ListAutomationProposalsResult> {
  return { ok: true, proposals: [] };
}

export async function getAutomationProposals(
  _filters?: AutomationProposalFilters,
): Promise<ListAutomationProposalsResult> {
  return { ok: true, proposals: [] };
}
