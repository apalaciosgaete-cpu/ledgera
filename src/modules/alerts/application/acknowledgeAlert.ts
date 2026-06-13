import { acknowledgeAlert as persistAcknowledge } from "@/modules/alerts/infrastructure/alertRepository";
import type { Alert } from "@/modules/alerts/domain/alert";

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

  return { ok: true, alert };
}
