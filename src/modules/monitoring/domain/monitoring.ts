export type MonitoringSeverity = "INFO" | "WARNING" | "CRITICAL";

export type MonitoringSignalType =
  | "RISK_CRITICAL"
  | "RISK_HIGH"
  | "DOCUMENT_REJECTED"
  | "TASKS_ACCUMULATED"
  | "RECOMMENDATIONS_PENDING"
  | "AUTOMATIONS_PENDING"
  | "AGENT_PLANS_PENDING";

export interface MonitoringSignal {
  id: string;
  type: MonitoringSignalType;
  severity: MonitoringSeverity;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  value: number | string | null;
  detectedAt: Date;
}

export interface MonitoringSummary {
  userId: string;
  status: "HEALTHY" | "ATTENTION" | "CRITICAL";
  signals: MonitoringSignal[];
  criticalCount: number;
  warningCount: number;
  generatedAt: Date;
}

export function resolveMonitoringStatus(signals: MonitoringSignal[]): MonitoringSummary["status"] {
  if (signals.some((signal) => signal.severity === "CRITICAL")) return "CRITICAL";
  if (signals.some((signal) => signal.severity === "WARNING")) return "ATTENTION";
  return "HEALTHY";
}
