import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function loadTsModule(relativePath, mocks = {}) {
  const source = read(relativePath);
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

  const exports = {};
  const context = {
    exports,
    module: { exports },
    require: (specifier) => {
      if (mocks[specifier]) return mocks[specifier];
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(compiled, context, { filename: relativePath });
  return context.module.exports;
}

const domain = loadTsModule("src/modules/dashboard/domain/executiveDashboard.ts");

test("Dashboard domain defines metric keys", () => {
  assert.equal(domain.DASHBOARD_METRIC_KEYS.length, 37);
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("total_documents"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("tax_documents"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("documents_pending_review"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("documents_last_30_days"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("open_alerts"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("average_risk_score"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("estimated_mrr"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("smart_tax_average"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("smart_tax_deficient_users"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("smart_tax_optimal_users"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("active_recommendations"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("critical_recommendations"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("users_with_pending_recommendations"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("pending_tasks"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("overdue_tasks"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("critical_tasks"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("average_resolution_minutes"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("critical_tax_files"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("attention_required_tax_files"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("healthy_tax_files"));
});

test("createEmptyDashboard returns zeroed structure", () => {
  const dashboard = domain.createEmptyDashboard();

  assert.equal(dashboard.alerts.open, 0);
  assert.equal(dashboard.risk.averageScore, 0);
  assert.equal(dashboard.tax.dtePending, 0);
  assert.equal(dashboard.billing.activeSubscriptions, 0);
  assert.equal(dashboard.operations.degradedConnections, 0);
  assert.equal(dashboard.audit.criticalEvents, 0);
  assert.equal(dashboard.smartTax.averageScore, 0);
  assert.equal(dashboard.recommendations.active, 0);
  assert.equal(dashboard.recommendations.critical, 0);
  assert.equal(dashboard.recommendations.pendingUsers, 0);
  assert.equal(dashboard.tasks.pending, 0);
  assert.equal(dashboard.tasks.overdue, 0);
  assert.equal(dashboard.tasks.critical, 0);
  assert.equal(dashboard.tasks.averageResolutionMinutes, 0);
  assert.equal(dashboard.taxFiles.critical, 0);
  assert.equal(dashboard.taxFiles.attentionRequired, 0);
  assert.equal(dashboard.taxFiles.healthy, 0);
  assert.equal(dashboard.metrics.length, 0);
  assert.equal(typeof dashboard.generatedAt, "object");
  assert.ok(Number.isFinite(dashboard.generatedAt.getTime()));
});

test("buildMetrics produces one metric per key", () => {
  const dashboard = domain.createEmptyDashboard();
  dashboard.alerts.open = 5;
  dashboard.risk.averageScore = 72;
  dashboard.tax.dtePending = 3;

  const metrics = domain.buildMetrics(dashboard);

  assert.equal(metrics.length, domain.DASHBOARD_METRIC_KEYS.length);

  const openAlerts = metrics.find((m) => m.key === "open_alerts");
  assert.ok(openAlerts);
  assert.equal(openAlerts.value, 5);

  const avgRisk = metrics.find((m) => m.key === "average_risk_score");
  assert.ok(avgRisk);
  assert.equal(avgRisk.value, 72);

  const dtePending = metrics.find((m) => m.key === "dte_pending");
  assert.ok(dtePending);
  assert.equal(dtePending.value, 3);
});

test("ExecutiveDashboardSnapshot type fields exist in source", () => {
  const source = read("src/modules/dashboard/domain/executiveDashboard.ts");

  assert.match(source, /interface ExecutiveDashboardSnapshot/);
  assert.match(source, /topRisk/);
  assert.match(source, /latestAlerts/);
  assert.match(source, /criticalEvents/);
});
