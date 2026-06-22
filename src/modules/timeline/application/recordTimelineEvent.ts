import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import type { AuditSeverity } from "@/modules/audit/domain/audit";
import type { CreateTimelineEventInput } from "@/modules/timeline/domain/timeline";
import { createTimelineEvent } from "@/modules/timeline/infrastructure/timelineRepository";

export async function recordTimelineEvent(input: CreateTimelineEventInput): Promise<void> {
  const event = await createTimelineEvent(input);

  console.info("[timeline]", {
    event: "timeline_event_created",
    timelineEventId: event.id,
    ...event,
  });

  // Mapeo preciso de severidad para el log de auditoría
  const severityMap: Record<string, AuditSeverity> = {
    CRITICAL: "CRITICAL",
    ERROR: "ERROR",
    WARNING: "WARNING",
    INFO: "INFO",
    SUCCESS: "INFO",
  };

  await recordAuditEvent({
    userId: event.userId,
    actorId: event.userId,
    category: "AUDIT",
    severity: severityMap[event.severity] || "INFO",
    event: "timeline_event_created",
    description: `Evento de timeline creado: ${event.title}`,
    result: "SUCCESS",
    entityType: "TimelineEvent",
    entityId: event.id,
    metadata: {
      category: event.category,
      severity: event.severity,
      referencedEntityType: event.entityType,
      referencedEntityId: event.entityId,
    },
  });
}
