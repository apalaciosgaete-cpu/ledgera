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
  assert.equal(domain.DASHBOARD_METRIC_KEYS.length, 20);
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("open_alerts"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("average_risk_score"));
  assert.ok(domain.DASHBOARD_METRIC_KEYS.includes("estimated_mrr"));
});

test("createEmptyDashboard returns zeroed structure", () => {
  const dashboard = domain.createEmptyDashboard();

  assert.equal(dashboard.alerts.open, 0);
  assert.equal(dashboard.risk.averageScore, 0);
  assert.equal(dashboard.tax.dtePending, 0);
  assert.equal(dashboard.billing.activeSubscriptions, 0);
  assert.equal(dashboard.operations.degradedConnections, 0);
  assert.equal(dashboard.audit.criticalEvents, 0);
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
