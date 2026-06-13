export interface ExecutiveMetric {
  key: string;
  label: string;
  value: number;
  trend?: number;
}

export interface ExecutiveDashboard {
  generatedAt: Date;
  metrics: ExecutiveMetric[];

  alerts: {
    open: number;
    critical: number;
    resolvedToday: number;
  };

  risk: {
    averageScore: number;
    criticalUsers: number;
    highUsers: number;
  };

  tax: {
    dtePending: number;
    dteRejected: number;
    availableFolios: number;
    siiDisconnected: number;
  };

  billing: {
    activeSubscriptions: number;
    pendingPayments: number;
    cancelledSubscriptions: number;
    estimatedMrr: number;
  };

  operations: {
    degradedConnections: number;
    failedImports: number;
    disconnectedExchanges: number;
  };

  audit: {
    criticalEvents: number;
    errorsToday: number;
    totalEventsToday: number;
  };
}

export interface RiskRow {
  userId: string;
  score: number;
  level: string;
  evaluatedAt: Date;
}

export interface AlertRow {
  id: string;
  userId: string;
  category: string;
  severity: string;
  title: string;
  status: string;
  createdAt: Date;
}

export interface AuditEventRow {
  id: string;
  userId: string | null;
  actorId: string | null;
  category: string;
  severity: string;
  event: string;
  description: string;
  result: string;
  createdAt: Date;
}

export interface ExecutiveDashboardSnapshot {
  dashboard: ExecutiveDashboard;
  topRisk: RiskRow[];
  latestAlerts: AlertRow[];
  criticalEvents: AuditEventRow[];
}

export const DASHBOARD_METRIC_KEYS = [
  "open_alerts",
  "critical_alerts",
  "resolved_today",
  "average_risk_score",
  "high_risk_users",
  "critical_risk_users",
  "dte_pending",
  "dte_rejected",
  "available_folios",
  "sii_disconnected",
  "active_subscriptions",
  "cancelled_subscriptions",
  "pending_payments",
  "estimated_mrr",
  "degraded_connections",
  "failed_imports",
  "disconnected_exchanges",
  "critical_audit_events",
  "errors_today",
  "total_audit_events_today",
] as const;

export type DashboardMetricKey = (typeof DASHBOARD_METRIC_KEYS)[number];

export function createEmptyDashboard(now = new Date()): ExecutiveDashboard {
  return {
    generatedAt: now,
    metrics: [],
    alerts: { open: 0, critical: 0, resolvedToday: 0 },
    risk: { averageScore: 0, criticalUsers: 0, highUsers: 0 },
    tax: { dtePending: 0, dteRejected: 0, availableFolios: 0, siiDisconnected: 0 },
    billing: { activeSubscriptions: 0, pendingPayments: 0, cancelledSubscriptions: 0, estimatedMrr: 0 },
    operations: { degradedConnections: 0, failedImports: 0, disconnectedExchanges: 0 },
    audit: { criticalEvents: 0, errorsToday: 0, totalEventsToday: 0 },
  };
}

export function buildMetrics(dashboard: ExecutiveDashboard): ExecutiveMetric[] {
  return [
    { key: "open_alerts", label: "Alertas abiertas", value: dashboard.alerts.open },
    { key: "critical_alerts", label: "Alertas críticas", value: dashboard.alerts.critical },
    { key: "resolved_today", label: "Alertas resueltas hoy", value: dashboard.alerts.resolvedToday },
    { key: "average_risk_score", label: "Riesgo promedio", value: dashboard.risk.averageScore },
    { key: "high_risk_users", label: "Usuarios HIGH", value: dashboard.risk.highUsers },
    { key: "critical_risk_users", label: "Usuarios CRITICAL", value: dashboard.risk.criticalUsers },
    { key: "dte_pending", label: "DTE pendientes", value: dashboard.tax.dtePending },
    { key: "dte_rejected", label: "DTE rechazados", value: dashboard.tax.dteRejected },
    { key: "available_folios", label: "Folios disponibles", value: dashboard.tax.availableFolios },
    { key: "sii_disconnected", label: "SII desconectado", value: dashboard.tax.siiDisconnected },
    { key: "active_subscriptions", label: "Suscripciones activas", value: dashboard.billing.activeSubscriptions },
    { key: "cancelled_subscriptions", label: "Cancelaciones", value: dashboard.billing.cancelledSubscriptions },
    { key: "pending_payments", label: "Pagos pendientes", value: dashboard.billing.pendingPayments },
    { key: "estimated_mrr", label: "MRR estimado", value: dashboard.billing.estimatedMrr },
    { key: "degraded_connections", label: "Conexiones degradadas", value: dashboard.operations.degradedConnections },
    { key: "failed_imports", label: "Importaciones fallidas", value: dashboard.operations.failedImports },
    { key: "disconnected_exchanges", label: "Exchanges desconectados", value: dashboard.operations.disconnectedExchanges },
    { key: "critical_audit_events", label: "Eventos críticos", value: dashboard.audit.criticalEvents },
    { key: "errors_today", label: "Errores últimas 24h", value: dashboard.audit.errorsToday },
    { key: "total_audit_events_today", label: "Eventos totales hoy", value: dashboard.audit.totalEventsToday },
  ];
}
