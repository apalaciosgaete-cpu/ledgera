import type { CreateAuditEventInput } from "@/modules/audit/domain/audit";
import { createAuditEvent } from "@/modules/audit/infrastructure/auditRepository";

export async function recordAuditEvent(input: CreateAuditEventInput): Promise<void> {
  const event = await createAuditEvent({
    ...input,
    result: input.result ?? "SUCCESS",
  });

  console.info("[audit]", {
    event: "audit_event_recorded",
    auditEventId: event.id,
    category: event.category,
    severity: event.severity,
    recordedEvent: event.event,
    userId: event.userId,
    actorId: event.actorId,
  });
}
