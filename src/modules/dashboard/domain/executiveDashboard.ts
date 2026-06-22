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

  smartTax: {
    averageScore: number;
    deficientUsers: number;
    optimalUsers: number;
  };

  recommendations: {
    active: number;
    critical: number;
    pendingUsers: number;
  };

  tasks: {
    pending: number;
    overdue: number;
    critical: number;
    averageResolutionMinutes: number;
  };

  taxFiles: {
    critical: number;
    attentionRequired: number;
    healthy: number;
  };

  documents: {
    total: number;
    tax: number;
    pendingReview: number;
    last30Days: number;
  };

  adaptiveProfiles: {
    optimized: number;
    standard: number;
    attentionRequired: number;
    critical: number;
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
  "smart_tax_average",
  "smart_tax_deficient_users",
  "smart_tax_optimal_users",
  "active_recommendations",
  "critical_recommendations",
  "users_with_pending_recommendations",
  "pending_tasks",
  "overdue_tasks",
  "critical_tasks",
  "average_resolution_minutes",
  "critical_tax_files",
  "attention_required_tax_files",
  "healthy_tax_files",
  "total_documents",
  "tax_documents",
  "documents_pending_review",
  "documents_last_30_days",
  "profiles_optimized",
  "profiles_standard",
  "profiles_attention_required",
  "profiles_critical",
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
    smartTax: { averageScore: 0, deficientUsers: 0, optimalUsers: 0 },
    recommendations: { active: 0, critical: 0, pendingUsers: 0 },
    tasks: { pending: 0, overdue: 0, critical: 0, averageResolutionMinutes: 0 },
    taxFiles: { critical: 0, attentionRequired: 0, healthy: 0 },
    documents: { total: 0, tax: 0, pendingReview: 0, last30Days: 0 },
    adaptiveProfiles: { optimized: 0, standard: 0, attentionRequired: 0, critical: 0 },
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
    { key: "smart_tax_average", label: "Smart Tax Score promedio", value: dashboard.smartTax.averageScore },
    { key: "smart_tax_deficient_users", label: "Usuarios deficientes", value: dashboard.smartTax.deficientUsers },
    { key: "smart_tax_optimal_users", label: "Usuarios óptimos", value: dashboard.smartTax.optimalUsers },
    { key: "active_recommendations", label: "Recomendaciones activas", value: dashboard.recommendations.active },
    { key: "critical_recommendations", label: "Recomendaciones críticas", value: dashboard.recommendations.critical },
    { key: "users_with_pending_recommendations", label: "Usuarios con recomendaciones pendientes", value: dashboard.recommendations.pendingUsers },
    { key: "pending_tasks", label: "Tareas pendientes", value: dashboard.tasks.pending },
    { key: "overdue_tasks", label: "Tareas vencidas", value: dashboard.tasks.overdue },
    { key: "critical_tasks", label: "Tareas críticas", value: dashboard.tasks.critical },
    { key: "average_resolution_minutes", label: "Tiempo promedio resolución (min)", value: dashboard.tasks.averageResolutionMinutes },
    { key: "critical_tax_files", label: "Expedientes críticos", value: dashboard.taxFiles.critical },
    { key: "attention_required_tax_files", label: "Expedientes con atención", value: dashboard.taxFiles.attentionRequired },
    { key: "healthy_tax_files", label: "Expedientes saludables", value: dashboard.taxFiles.healthy },
    { key: "total_documents", label: "Documentos totales", value: dashboard.documents.total },
    { key: "tax_documents", label: "Documentos tributarios", value: dashboard.documents.tax },
    { key: "documents_pending_review", label: "Documentos por revisar", value: dashboard.documents.pendingReview },
    { key: "documents_last_30_days", label: "Documentos últimos 30 días", value: dashboard.documents.last30Days },
    { key: "profiles_optimized", label: "Perfiles optimizados", value: dashboard.adaptiveProfiles.optimized },
    { key: "profiles_standard", label: "Perfiles estándar", value: dashboard.adaptiveProfiles.standard },
    { key: "profiles_attention_required", label: "Perfiles con atención", value: dashboard.adaptiveProfiles.attentionRequired },
    { key: "profiles_critical", label: "Perfiles críticos", value: dashboard.adaptiveProfiles.critical },
  ];
}
