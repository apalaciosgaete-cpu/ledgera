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

function buildPrismaMock(overrides = {}) {
  const defaults = {
    users: { findUnique: async () => ({ id: "u1", subscription_expires_at: null }) },
    alert: {
      groupBy: async () => [],
    },
    taxProfile: { findUnique: async () => null },
    taxDocument: { groupBy: async () => [] },
    siiCredential: { findFirst: async () => null },
    portfolioMovement: { count: async () => 0 },
    exchangeConnection: { count: async () => 0 },
    exchangeImportRecord: { count: async () => 0 },
  };

  return { prisma: { ...defaults, ...overrides } };
}

test("calculateTaxRiskScore returns LOW for user with validated profile and SII", async () => {
  const { calculateTaxRiskScore } = loadTsModule(
    "src/modules/risk/application/calculateTaxRiskScore.ts",
    {
      "@/lib/prisma": buildPrismaMock({
        taxProfile: { findUnique: async () => ({ isValidated: true }) },
        siiCredential: {
          findFirst: async () => ({
            isActive: true,
            certificateExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          }),
        },
      }),
      "@/modules/alerts/application/createAlert": {
        createAlert: async () => ({ ok: true }),
      },
      "@/modules/risk/infrastructure/taxRiskScoreRepository": {
        saveTaxRiskScore: async (input) => ({ id: "r1", ...input, evaluatedAt: new Date() }),
      },
      "@/modules/risk/domain/risk": loadTsModule("src/modules/risk/domain/risk.ts"),
    },
  );

  const result = await calculateTaxRiskScore("u1");

  assert.equal(result.ok, true);
  assert.equal(result.score, 0);
  assert.equal(result.level, "LOW");
  assert.equal(result.breakdown.length, 7);
});

test("calculateTaxRiskScore caps alerts at 25", async () => {
  const { calculateTaxRiskScore } = loadTsModule(
    "src/modules/risk/application/calculateTaxRiskScore.ts",
    {
      "@/lib/prisma": buildPrismaMock({
        alert: {
          groupBy: async () => [
            { severity: "CRITICAL", _count: { severity: 10 } },
          ],
        },
      }),
      "@/modules/alerts/application/createAlert": {
        createAlert: async () => ({ ok: true }),
      },
      "@/modules/risk/infrastructure/taxRiskScoreRepository": {
        saveTaxRiskScore: async (input) => ({ id: "r1", ...input, evaluatedAt: new Date() }),
      },
      "@/modules/risk/domain/risk": loadTsModule("src/modules/risk/domain/risk.ts"),
    },
  );

  const result = await calculateTaxRiskScore("u1");

  assert.equal(result.ok, true);
  const alertsItem = result.breakdown.find((item) => item.factor === "ALERTS");
  assert.equal(alertsItem.score, 25);
});

test("calculateTaxRiskScore creates CRITICAL alert for critical level", async () => {
  let createdAlert = null;

  const { calculateTaxRiskScore } = loadTsModule(
    "src/modules/risk/application/calculateTaxRiskScore.ts",
    {
      "@/lib/prisma": buildPrismaMock({
        alert: {
          groupBy: async () => [
            { severity: "CRITICAL", _count: { severity: 10 } },
          ],
        },
        taxProfile: { findUnique: async () => null },
        taxDocument: {
          groupBy: async () => [
            { status: "REJECTED", _count: { status: 3 } },
            { status: "READY_TO_SEND", _count: { status: 3 } },
          ],
        },
        portfolioMovement: { count: async () => 10 },
        exchangeConnection: { count: async () => 5 },
        exchangeImportRecord: { count: async () => 5 },
      }),
      "@/modules/alerts/application/createAlert": {
        createAlert: async (input) => {
          createdAlert = input;
          return { ok: true };
        },
      },
      "@/modules/risk/infrastructure/taxRiskScoreRepository": {
        saveTaxRiskScore: async (input) => ({ id: "r1", ...input, evaluatedAt: new Date() }),
      },
      "@/modules/risk/domain/risk": loadTsModule("src/modules/risk/domain/risk.ts"),
    },
  );

  const result = await calculateTaxRiskScore("u1");

  assert.equal(result.ok, true);
  assert.equal(result.level, "CRITICAL");
  assert.ok(createdAlert);
  assert.equal(createdAlert.severity, "CRITICAL");
  assert.equal(createdAlert.category, "TRIBUTARY");
});

test("calculateTaxRiskScore emits tax_risk_score_calculated telemetry", () => {
  const source = read("src/modules/risk/application/calculateTaxRiskScore.ts");

  assert.match(source, /tax_risk_score_calculated/);
});

test("getLatestTaxRiskScore returns existing score", async () => {
  const existing = {
    id: "r1",
    userId: "u1",
    score: 45,
    level: "MEDIUM",
    breakdown: [],
    evaluatedAt: new Date(),
  };

  const { getLatestTaxRiskScore } = loadTsModule(
    "src/modules/risk/application/getLatestTaxRiskScore.ts",
    {
      "@/modules/risk/infrastructure/taxRiskScoreRepository": {
        getLatestTaxRiskScoreByUserId: async () => existing,
      },
      "./calculateTaxRiskScore": {
        calculateTaxRiskScore: async () => ({ ok: true, score: 0, level: "LOW", breakdown: [] }),
      },
    },
  );

  const result = await getLatestTaxRiskScore("u1");

  assert.equal(result.score, 45);
  assert.equal(result.level, "MEDIUM");
});

test("TaxRiskScore repository exposes save and list methods", () => {
  const source = read("src/modules/risk/infrastructure/taxRiskScoreRepository.ts");

  assert.match(source, /saveTaxRiskScore/);
  assert.match(source, /getLatestTaxRiskScoreByUserId/);
  assert.match(source, /listTaxRiskScores/);
});
