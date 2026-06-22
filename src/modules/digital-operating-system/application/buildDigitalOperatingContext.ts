import { cryptoFirstModules } from "../domain/modules";
import type { DigitalProfile, SystemEvent } from "../domain/types";

export function buildDigitalOperatingContext(userId: string): DigitalProfile {
  return {
    userId,
    status: "PARTIAL",
    modules: cryptoFirstModules,
    updatedAt: null,
  };
}

export function buildSystemEvent(input: {
  userId: string;
  type: string;
  description: string;
}): SystemEvent {
  return {
    id: `event-${Date.now()}`,
    userId: input.userId,
    type: input.type,
    description: input.description,
    createdAt: new Date().toISOString(),
  };
}
