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
  const inTenDays = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  return {
    $transaction: async (promises) => Promise.all(promises),
    recommendation: {
      create: async (args) => ({ id: "rec_1", ...args.data, createdAt: now, updatedAt: now }),
      findFirst: async () => null,
      findMany: async () => [],
      count: async () => 0,
      update: async (args) => ({ id: args.where.id, ...args.data, createdAt: now, updatedAt: now }),
      updateMany: async () => ({ count: 1 }),
      delete: async () => ({}),
      ...overrides.recommendation,
    },
    taxRiskScore: {
      findFirst: async () => null,
      ...overrides.taxRiskScore,
    },
    smartTaxScore: {
      findFirst: async () => null,
      ...overrides.smartTaxScore,
    },
    taxProfile: {
      findUnique: async () => null,
      ...overrides.taxProfile,
    },
    taxDocument: {
      count: async () => 0,
      ...overrides.taxDocument,
    },
    exchangeConnection: {
      findMany: async () => [],
      ...overrides.exchangeConnection,
    },
    billingSubscription: {
      findFirst: async () => null,
      ...overrides.billingSubscription,
    },
    siiCredential: {
      findMany: async () => [],
      ...overrides.siiCredential,
    },
  };
}

const domain = loadTsModule("src/modules/recommendations/domain/recommendation.ts");

const repository = loadTsModule(
  "src/modules/recommendations/infrastructure/recommendationRepository.ts",
  {
    "@/lib/prisma": { prisma: buildPrismaMock() },
    "@/modules/recommendations/domain/recommendation": domain,
  },
);

test("createRecommendation persists active recommendation", async () => {
  const recommendation = await repository.createRecommendation({
    userId: "u1",
    category: "RISK",
    priority: "HIGH",
    title: "Riesgo alto",
    description: "Revisa alertas pendientes",
    actionLabel: "Revisar alertas",
    actionUrl: "/alertas",
    sourceType: "TAX_RISK_SCORE",
  });

  assert.equal(recommendation.userId, "u1");
  assert.equal(recommendation.category, "RISK");
  assert.equal(recommendation.status, "ACTIVE");
});

test("upsertRecommendation creates new recommendation when not exists", async () => {
  const prismaMock = buildPrismaMock();
  const repo = loadTsModule(
    "src/modules/recommendations/infrastructure/recommendationRepository.ts",
    {
      "@/lib/prisma": { prisma: prismaMock },
      "@/modules/recommendations/domain/recommendation": domain,
    },
  );

  const { recommendation, isNew } = await repo.upsertRecommendation({
    userId: "u1",
    category: "RISK",
    priority: "HIGH",
    title: "Riesgo alto",
    description: "Revisa alertas pendientes",
    actionLabel: "Revisar alertas",
    actionUrl: "/alertas",
    sourceType: "TAX_RISK_SCORE",
  });

  assert.equal(isNew, true);
  assert.equal(recommendation.status, "ACTIVE");
});

test("generateRecommendations source includes rule signals", () => {
  const source = read("src/modules/recommendations/application/generateRecommendations.ts");

  assert.match(source, /TAX_RISK_SCORE/);
  assert.match(source, /SMART_TAX_SCORE/);
  assert.match(source, /TAX_PROFILE_INCOMPLETE/);
  assert.match(source, /TAX_DOCUMENT_PENDING/);
  assert.match(source, /TAX_DOCUMENT_REJECTED/);
  assert.match(source, /SII_CERTIFICATE_EXPIRED/);
  assert.match(source, /EXCHANGE_CONNECTION_INACTIVE/);
  assert.match(source, /SUBSCRIPTION_NEAR_EXPIRATION/);
});

test("generateRecommendations registers recommendations_generated audit event", () => {
  const source = read("src/modules/recommendations/application/generateRecommendations.ts");

  assert.match(source, /recommendations_generated/);
  assert.match(source, /recordAuditEvent/);
});

test("dismissRecommendation and completeRecommendation emit correct audit events", () => {
  const source = read("src/modules/recommendations/application/dismissRecommendation.ts");

  assert.match(source, /recommendation_dismissed/);
  assert.match(source, /persistDismiss/);

  const completeSource = read("src/modules/recommendations/application/completeRecommendation.ts");
  assert.match(completeSource, /recommendation_completed/);
  assert.match(completeSource, /persistComplete/);
});

test("recommendation repository transitions active recommendation to DISMISSED and COMPLETED", async () => {
  const now = new Date();
  const prismaMock = buildPrismaMock({
    recommendation: {
      findUnique: async () => ({
        id: "r1",
        userId: "u1",
        category: "RISK",
        priority: "HIGH",
        title: "Riesgo alto",
        description: "Revisa alertas",
        actionLabel: "Revisar",
        actionUrl: "/alertas",
        status: "ACTIVE",
        sourceType: "TAX_RISK_SCORE",
        sourceId: null,
        metadata: null,
        createdAt: now,
        updatedAt: now,
      }),
      update: async (args) => ({
        id: args.where.id,
        userId: "u1",
        category: "RISK",
        priority: "HIGH",
        title: "Riesgo alto",
        description: "Revisa alertas",
        actionLabel: "Revisar",
        actionUrl: "/alertas",
        status: args.data.status,
        sourceType: "TAX_RISK_SCORE",
        sourceId: null,
        metadata: null,
        createdAt: now,
        updatedAt: now,
      }),
    },
  });

  const repo = loadTsModule(
    "src/modules/recommendations/infrastructure/recommendationRepository.ts",
    {
      "@/lib/prisma": { prisma: prismaMock },
      "@/modules/recommendations/domain/recommendation": domain,
    },
  );

  const dismissed = await repo.dismissRecommendation("r1");
  assert.equal(dismissed.status, "DISMISSED");

  const completed = await repo.completeRecommendation("r1");
  assert.equal(completed.status, "COMPLETED");
});
