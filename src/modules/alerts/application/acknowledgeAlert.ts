import { acknowledgeAlert as persistAcknowledge } from "@/modules/alerts/infrastructure/alertRepository";
import type { Alert } from "@/modules/alerts/domain/alert";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";

export type AcknowledgeAlertResult =
  | { ok: true; alert: Alert }
  | { ok: false; message: string };

export async function acknowledgeAlert(
  id: string,
): Promise<AcknowledgeAlertResult> {
  const alert = await persistAcknowledge(id);

  if (!alert) {
    return {
      ok: false,
      message: "La alerta no existe o no puede ser reconocida.",
    };
  }

  console.info("[alerts]", {
    event: "alert_acknowledged",
    alertId: alert.id,
    userId: alert.userId,
    category: alert.category,
  });

  await recordAuditEvent({
    userId: alert.userId,
    category: "ALERT",
    severity: "INFO",
    event: "alert_acknowledged",
    description: `Alerta reconocida: ${alert.title}`,
    result: "SUCCESS",
    entityType: "Alert",
    entityId: alert.id,
    metadata: { category: alert.category, severity: alert.severity },
  });

  await recordTimelineEvent({
    userId: alert.userId,
    category: "ALERT",
    severity: "INFO",
    title: "Alerta reconocida",
    description: `Reconociste la alerta: ${alert.title}`,
    entityType: "Alert",
    entityId: alert.id,
    metadata: { category: alert.category, severity: alert.severity },
  });

  return { ok: true, alert };
}
