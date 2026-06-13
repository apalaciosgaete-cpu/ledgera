import {
  isValidAlertCategory,
  isValidAlertSeverity,
  type CreateAlertInput,
  type Alert,
} from "@/modules/alerts/domain/alert";
import { createAlert as persistAlert } from "@/modules/alerts/infrastructure/alertRepository";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";

export type CreateAlertResult =
  | { ok: true; alert: Alert }
  | { ok: false; message: string };

export async function createAlert(input: CreateAlertInput): Promise<CreateAlertResult> {
  const user = await getUserById(input.userId);

  if (!user) {
    return { ok: false, message: "Usuario no encontrado." };
  }

  if (!isValidAlertCategory(input.category)) {
    return { ok: false, message: "Categoría de alerta inválida." };
  }

  if (!isValidAlertSeverity(input.severity)) {
    return { ok: false, message: "Severidad de alerta inválida." };
  }

  if (!input.title.trim() || !input.message.trim()) {
    return { ok: false, message: "Título y mensaje son obligatorios." };
  }

  const alert = await persistAlert({
    userId: input.userId,
    category: input.category,
    severity: input.severity,
    title: input.title.trim(),
    message: input.message.trim(),
    metadata: input.metadata ?? null,
    source: input.source ?? null,
  });

  console.info("[alerts]", {
    event: "alert_created",
    alertId: alert.id,
    userId: alert.userId,
    category: alert.category,
    severity: alert.severity,
    source: alert.source,
  });

  return { ok: true, alert };
}
