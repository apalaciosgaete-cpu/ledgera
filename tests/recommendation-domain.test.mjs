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

const domain = loadTsModule("src/modules/recommendations/domain/recommendation.ts");

test("Recommendation categories are defined", () => {
  assert.equal(domain.RECOMMENDATION_CATEGORIES.length, 6);
  assert.ok(domain.RECOMMENDATION_CATEGORIES.includes("TRIBUTARY"));
  assert.ok(domain.RECOMMENDATION_CATEGORIES.includes("COMPLIANCE"));
  assert.ok(domain.RECOMMENDATION_CATEGORIES.includes("OPERATIONS"));
  assert.ok(domain.RECOMMENDATION_CATEGORIES.includes("CONNECTIONS"));
  assert.ok(domain.RECOMMENDATION_CATEGORIES.includes("BILLING"));
  assert.ok(domain.RECOMMENDATION_CATEGORIES.includes("RISK"));
});

test("Recommendation priorities are defined", () => {
  assert.equal(domain.RECOMMENDATION_PRIORITIES.length, 4);
  assert.ok(domain.RECOMMENDATION_PRIORITIES.includes("LOW"));
  assert.ok(domain.RECOMMENDATION_PRIORITIES.includes("MEDIUM"));
  assert.ok(domain.RECOMMENDATION_PRIORITIES.includes("HIGH"));
  assert.ok(domain.RECOMMENDATION_PRIORITIES.includes("CRITICAL"));
});

test("Recommendation statuses are defined", () => {
  assert.equal(domain.RECOMMENDATION_STATUSES.length, 3);
  assert.ok(domain.RECOMMENDATION_STATUSES.includes("ACTIVE"));
  assert.ok(domain.RECOMMENDATION_STATUSES.includes("DISMISSED"));
  assert.ok(domain.RECOMMENDATION_STATUSES.includes("COMPLETED"));
});

test("Validators accept valid values", () => {
  assert.equal(domain.isValidRecommendationCategory("TRIBUTARY"), true);
  assert.equal(domain.isValidRecommendationPriority("CRITICAL"), true);
  assert.equal(domain.isValidRecommendationStatus("ACTIVE"), true);
});

test("Validators reject invalid values", () => {
  assert.equal(domain.isValidRecommendationCategory("INVALID"), false);
  assert.equal(domain.isValidRecommendationPriority("URGENT"), false);
  assert.equal(domain.isValidRecommendationStatus("PENDING"), false);
});

test("recommendationKey deduplicates by userId, sourceType and optional sourceId", () => {
  const keyWithoutSource = domain.recommendationKey({
    userId: "u1",
    sourceType: "TAX_RISK_SCORE",
  });
  const keyWithSource = domain.recommendationKey({
    userId: "u1",
    sourceType: "TAX_RISK_SCORE",
    sourceId: "s1",
  });

  assert.equal(keyWithoutSource, "u1:TAX_RISK_SCORE");
  assert.equal(keyWithSource, "u1:TAX_RISK_SCORE:s1");
  assert.notEqual(keyWithoutSource, keyWithSource);
});

test("Recommendation interface is defined", () => {
  const source = read("src/modules/recommendations/domain/recommendation.ts");

  assert.match(source, /interface Recommendation/);
  assert.match(source, /actionLabel/);
  assert.match(source, /actionUrl/);
  assert.match(source, /sourceType/);
  assert.match(source, /sourceId/);
});
