import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { buildLAIOSState, saveLAIOSState } from "@/modules/laios/application/buildLAIOSState";
import { evaluateMonitoringSignals } from "@/modules/monitoring/application/evaluateMonitoringSignals";
import { buildDecisionCenter } from "@/modules/decision-center/application/buildDecisionCenter";
import { buildTaxCases } from "@/modules/tax-cases/application/buildTaxCases";

export async function runOperatingCycle(userId: string) {
  const startTime = Date.now();

  await recordAuditEvent({
    userId,
    category: "AI",
    severity: "INFO",
    event: "laios_cycle_started",
    description: "Ciclo operativo LAIOS iniciado.",
    result: "SUCCESS",
    entityType: "LAIOS",
    entityId: userId,
  }).catch(() => null);

  try {
    // Step 1: Execute monitoring
    await evaluateMonitoringSignals(userId).catch(() => null);

    // Step 2: Update cases
    await buildTaxCases(userId).catch(() => null);

    // Step 3: Generate decisions
    await buildDecisionCenter(userId).catch(() => null);

    // Step 4: Build and persist the consolidated LAIOS state
    const state = await buildLAIOSState(userId);
    await saveLAIOSState(state);

    const duration = Date.now() - startTime;

    await recordAuditEvent({
      userId,
      category: "AI",
      severity: state.operatingStatus === "CRITICAL" ? "CRITICAL" : "INFO",
      event: "laios_cycle_completed",
      description: `Ciclo operativo completado en ${duration}ms. Estado: ${state.operatingStatus}`,
      result: "SUCCESS",
      entityType: "LAIOS",
      entityId: userId,
      metadata: {
        operatingStatus: state.operatingStatus,
        activeCases: state.activeCases,
        activeWorkflows: state.activeWorkflows,
        duration,
      },
    }).catch(() => null);

    return { ok: true, state, duration };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";

    await recordAuditEvent({
      userId,
      category: "AI",
      severity: "ERROR",
      event: "laios_cycle_failed",
      description: `Ciclo operativo falló: ${message}`,
      result: "FAILED",
      entityType: "LAIOS",
      entityId: userId,
      metadata: { error: message },
    }).catch(() => null);

    return { ok: false, message };
  }
}
