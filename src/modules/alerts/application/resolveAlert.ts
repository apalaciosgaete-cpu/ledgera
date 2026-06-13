import { resolveAlert as persistResolve } from "@/modules/alerts/infrastructure/alertRepository";
import type { Alert } from "@/modules/alerts/domain/alert";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";

export type ResolveAlertResult =
  | { ok: true; alert: Alert }
  | { ok: false; message: string };

export async function resolveAlert(id: string): Promise<ResolveAlertResult> {
  const alert = await persistResolve(id);

  if (!alert) {
    return {
      ok: false,
      message: "La alerta no existe o no puede ser resuelta.",
    };
  }

  console.info("[alerts]", {
    event: "alert_resolved",
    alertId: alert.id,
    userId: alert.userId,
    category: alert.category,
  });

  await recordAuditEvent({
    userId: alert.userId,
    category: "ALERT",
    severity: "INFO",
    event: "alert_resolved",
    description: `Alerta resuelta: ${alert.title}`,
    result: "SUCCESS",
    entityType: "Alert",
    entityId: alert.id,
    metadata: { category: alert.category, severity: alert.severity },
  });

  return { ok: true, alert };
}
