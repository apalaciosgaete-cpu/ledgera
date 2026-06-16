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
const cache = loadTsModule("src/modules/dashboard/application/dashboardCache.ts");

function buildPrismaMock(overrides = {}) {
  return {
    $transaction: async (promises) => Promise.all(promises),
    alert: { count: async () => 0, findMany: async () => [], ...overrides.alert },
    taxRiskScore: { findMany: async () => [], ...overrides.taxRiskScore },
    taxDocument: { count: async () => 0, ...overrides.taxDocument },
    siiCaf: { findMany: async () => [], ...overrides.siiCaf },
    siiCredential: { count: async () => 0, ...overrides.siiCredential },
    billingSubscription: {
      count: async () => 0,
      aggregate: async () => ({ _sum: { amount: 0 } }),
      findFirst: async () => null,
      ...overrides.billingSubscription,
    },
    billingPayment: { count: async () => 0, findFirst: async () => null, ...overrides.billingPayment },
    exchangeConnection: { findMany: async () => [], ...overrides.exchangeConnection },
    exchangeImportRecord: { count: async () => 0, ...overrides.exchangeImportRecord },
    auditEvent: { count: async () => 0, findMany: async () => [], ...overrides.auditEvent },
    smartTaxScore: { findMany: async () => [], ...overrides.smartTaxScore },
    recommendation: { count: async () => 0, findMany: async () => [], ...overrides.recommendation },
    task: { count: async () => 0, findMany: async () => [], ...overrides.task },
    document: { count: async () => 0, ...overrides.document },
    users: { findUnique: async () => ({ subscription_plan: "BASICO", subscription_expires_at: null }), ...overrides.users },
  };
}

function loadDashboardService(prismaMock) {
  return loadTsModule("src/modules/dashboard/application/buildExecutiveDashboard.ts", {
    "@/lib/prisma": { prisma: prismaMock },
    "@/modules/dashboard/domain/executiveDashboard": domain,
    "./dashboardCache": cache,
    "@/modules/tax-file/application/listTaxFiles": {
      listTaxFiles: async () => ({ ok: true, files: [] }),
    },
  });
}

function loadUserDashboardService(prismaMock) {
  return loadTsModule("src/modules/dashboard/application/buildUserDashboard.ts", {
    "@/lib/prisma": { prisma: prismaMock },
  });
}

test("buildExecutiveDashboard calculates risk aggregates", async () => {
  cache.clearDashboardCache();

  const prismaMock = buildPrismaMock({
    taxRiskScore: {
      findMany: async () => [
        { userId: "u1", score: 85, level: "HIGH", evaluatedAt: new Date("2026-06-12T10:00:00Z") },
        { userId: "u2", score: 95, level: "CRITICAL", evaluatedAt: new Date("2026-06-12T11:00:00Z") },
        { userId: "u1", score: 70, level: "MEDIUM", evaluatedAt: new Date("2026-06-11T10:00:00Z") },
      ],
    },
  });

  const { buildExecutiveDashboard } = loadDashboardService(prismaMock);
  const result = await buildExecutiveDashboard();

  assert.equal(result.ok, true);
  assert.equal(result.snapshot.dashboard.risk.averageScore, 90);
  assert.equal(result.snapshot.dashboard.risk.highUsers, 1);
  assert.equal(result.snapshot.dashboard.risk.criticalUsers, 1);
});

test("buildExecutiveDashboard sums available folios", async () => {
  cache.clearDashboardCache();

  const prismaMock = buildPrismaMock({
    siiCaf: {
      findMany: async () => [
        { id: "c1", folioStart: 1, folioEnd: 100, currentFolio: 41, isActive: true },
        { id: "c2", folioStart: 101, folioEnd: 200, currentFolio: 150, isActive: true },
      ],
    },
  });

  const { buildExecutiveDashboard } = loadDashboardService(prismaMock);
  const result = await buildExecutiveDashboard();

  assert.equal(result.ok, true);
  assert.equal(result.snapshot.dashboard.tax.availableFolios, 60 + 51);
});

test("buildExecutiveDashboard uses cache for repeated calls", async () => {
  cache.clearDashboardCache();

  let alertCount = 0;
  const prismaMock = buildPrismaMock({
    alert: {
      count: async () => {
        alertCount += 1;
        return 7;
      },
    },
  });

  const { buildExecutiveDashboard } = loadDashboardService(prismaMock);
  const first = await buildExecutiveDashboard();
  const countAfterFirst = alertCount;
  const second = await buildExecutiveDashboard();
  const countAfterSecond = alertCount;

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.snapshot.dashboard.alerts.open, 7);
  assert.equal(second.snapshot.dashboard.alerts.open, 7);
  assert.ok(countAfterFirst > 0);
  assert.equal(countAfterSecond, countAfterFirst);
});

test("buildExecutiveDashboard counts degraded connections", async () => {
  cache.clearDashboardCache();

  const prismaMock = buildPrismaMock({
    exchangeConnection: {
      findMany: async () => [
        { id: "c1", status: "ACTIVE" },
        { id: "c2", status: "ERROR" },
        { id: "c3", status: "INVALID_CREDENTIALS" },
      ],
    },
  });

  const { buildExecutiveDashboard } = loadDashboardService(prismaMock);
  const result = await buildExecutiveDashboard();

  assert.equal(result.ok, true);
  assert.equal(result.snapshot.dashboard.operations.degradedConnections, 2);
  assert.equal(result.snapshot.dashboard.operations.disconnectedExchanges, 2);
});

test("buildUserDashboard returns user scoped data", async () => {
  const prismaMock = buildPrismaMock({
    document: {
      count: async () => 0,
    },
    taxRiskScore: {
      findFirst: async () => ({ score: 72, level: "HIGH" }),
    },
    alert: {
      count: async ({ where }) => {
        if (where.severity === "CRITICAL") return 1;
        return 3;
      },
    },
    taxDocument: {
      count: async ({ where }) => {
        if (where.status?.in) return 2;
        return 1;
      },
    },
    billingSubscription: {
      findFirst: async () => ({ status: "ACTIVE" }),
    },
    billingPayment: {
      findFirst: async () => ({ id: "p1", status: "PENDING" }),
    },
    users: {
      findUnique: async () => ({ subscription_plan: "PRO", subscription_expires_at: new Date("2027-01-01T00:00:00Z") }),
    },
  });

  const { buildUserDashboard } = loadUserDashboardService(prismaMock);
  const result = await buildUserDashboard("u1");

  assert.equal(result.ok, true);
  assert.equal(result.dashboard.risk.score, 72);
  assert.equal(result.dashboard.risk.level, "HIGH");
  assert.equal(result.dashboard.alerts.open, 3);
  assert.equal(result.dashboard.alerts.critical, 1);
  assert.equal(result.dashboard.tax.pendingDocuments, 2);
  assert.equal(result.dashboard.tax.rejectedDocuments, 1);
  assert.equal(result.dashboard.subscription.plan, "PRO");
  assert.equal(result.dashboard.subscription.pendingPayment, true);
});


test("buildExecutiveDashboard aggregates Smart Tax Scores", async () => {
  cache.clearDashboardCache();

  const prismaMock = buildPrismaMock({
    smartTaxScore: {
      findMany: async () => [
        { userId: "u1", score: 35, level: "DEFICIENT", evaluatedAt: new Date("2026-06-12T10:00:00Z") },
        { userId: "u2", score: 92, level: "OPTIMAL", evaluatedAt: new Date("2026-06-12T11:00:00Z") },
        { userId: "u1", score: 50, level: "DEVELOPING", evaluatedAt: new Date("2026-06-11T10:00:00Z") },
      ],
    },
  });

  const { buildExecutiveDashboard } = loadDashboardService(prismaMock);
  const result = await buildExecutiveDashboard();

  assert.equal(result.ok, true);
  assert.equal(result.snapshot.dashboard.smartTax.averageScore, 64);
  assert.equal(result.snapshot.dashboard.smartTax.deficientUsers, 1);
  assert.equal(result.snapshot.dashboard.smartTax.optimalUsers, 1);
});
