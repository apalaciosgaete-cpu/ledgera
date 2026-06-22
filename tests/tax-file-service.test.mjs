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
  const now = new Date();

  return {
    $transaction: async (promises) => Promise.all(promises),
    users: {
      findUnique: async () => ({
        id: "u1",
        email: "user@example.com",
        full_name: "Usuario Ejemplo",
        subscription_plan: "PRO",
      }),
      findMany: async () => [
        { id: "u1", email: "user@example.com", full_name: "Usuario Ejemplo", subscription_plan: "PRO" },
      ],
      ...overrides.users,
    },
    taxProfile: {
      findUnique: async () => ({
        documentType: "RUT",
        rut: "12.345.678-9",
        legalName: "Empresa SpA",
        isValidated: true,
      }),
      ...overrides.taxProfile,
    },
    taxRiskScore: {
      findFirst: async () => ({ score: 75, level: "HIGH" }),
      findMany: async () => [{ userId: "u1", score: 75, level: "HIGH" }],
      ...overrides.taxRiskScore,
    },
    smartTaxScore: {
      findFirst: async () => ({ score: 65, level: "HEALTHY" }),
      findMany: async () => [{ userId: "u1", score: 65, level: "HEALTHY" }],
      ...overrides.smartTaxScore,
    },
    alert: {
      count: async () => 0,
      ...overrides.alert,
    },
    recommendation: {
      count: async () => 0,
      ...overrides.recommendation,
    },
    task: {
      count: async () => 0,
      ...overrides.task,
    },
    taxDocument: {
      count: async () => 0,
      ...overrides.taxDocument,
    },
    siiCredential: {
      findMany: async () => [],
      ...overrides.siiCredential,
    },
    siiCaf: {
      count: async () => 5,
      ...overrides.siiCaf,
    },
    billingSubscription: {
      findFirst: async () => ({ status: "ACTIVE" }),
      ...overrides.billingSubscription,
    },
    exchangeConnection: {
      findMany: async () => [],
      ...overrides.exchangeConnection,
    },
    auditEvent: {
      count: async () => 0,
      ...overrides.auditEvent,
    },
  };
}

test("buildTaxFileSummary aggregates user tax file", async () => {
  const domain = loadTsModule("src/modules/tax-file/domain/taxFile.ts");
  const { buildTaxFileSummary } = loadTsModule(
    "src/modules/tax-file/application/buildTaxFileSummary.ts",
    {
      "@/lib/prisma": { prisma: buildPrismaMock() },
      "@/modules/tax-file/domain/taxFile": domain,
    },
  );

  const result = await buildTaxFileSummary("u1");

  assert.equal(result.ok, true);
  assert.equal(result.summary.userId, "u1");
  assert.equal(result.summary.taxProfile.exists, true);
  assert.equal(result.summary.risk.level, "HIGH");
  assert.equal(result.summary.smartScore.level, "HEALTHY");
});

test("buildTaxFileSummary returns error for missing user", async () => {
  const domain = loadTsModule("src/modules/tax-file/domain/taxFile.ts");
  const { buildTaxFileSummary } = loadTsModule(
    "src/modules/tax-file/application/buildTaxFileSummary.ts",
    {
      "@/lib/prisma": {
        prisma: buildPrismaMock({ users: { findUnique: async () => null } }),
      },
      "@/modules/tax-file/domain/taxFile": domain,
    },
  );

  const result = await buildTaxFileSummary("unknown");

  assert.equal(result.ok, false);
});

test("listTaxFiles returns summarized files", async () => {
  const domain = loadTsModule("src/modules/tax-file/domain/taxFile.ts");
  const { listTaxFiles } = loadTsModule(
    "src/modules/tax-file/application/listTaxFiles.ts",
    {
      "@/lib/prisma": { prisma: buildPrismaMock() },
      "@/modules/tax-file/domain/taxFile": domain,
    },
  );

  const result = await listTaxFiles();

  assert.equal(result.ok, true);
  assert.equal(result.files.length, 1);
  assert.equal(result.files[0].userId, "u1");
});

test("Tax file service source uses prisma $transaction", () => {
  const source = read("src/modules/tax-file/application/buildTaxFileSummary.ts");

  assert.match(source, /prisma\.\$transaction/);
  assert.match(source, /taxRiskScore/);
  assert.match(source, /smartTaxScore/);
  assert.match(source, /resolveTaxFileStatus/);
});
