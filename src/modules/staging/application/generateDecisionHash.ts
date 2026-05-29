import { createStableSha256Hash } from "@/shared/hash";

export type DecisionHashPayload = {
  userId:    string;
  action:    string;
  entityIds: string[];
  at:        string;
  metadata?: Record<string, unknown>;
};

export function generateDecisionHash(payload: DecisionHashPayload): string {
  return createStableSha256Hash(payload);
}
