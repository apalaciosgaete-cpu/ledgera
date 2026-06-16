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

const domain = loadTsModule("src/modules/tax-score/domain/smartTaxScore.ts");

test("Smart Tax Score domain defines levels and factors", () => {
  assert.equal(domain.SMART_TAX_SCORE_LEVELS.length, 4);
  assert.ok(domain.SMART_TAX_SCORE_LEVELS.includes("DEFICIENT"));
  assert.ok(domain.SMART_TAX_SCORE_LEVELS.includes("OPTIMAL"));

  assert.equal(domain.SMART_TAX_SCORE_FACTORS.length, 8);
  assert.ok(domain.SMART_TAX_SCORE_FACTORS.includes("TAX_IDENTITY"));
  assert.ok(domain.SMART_TAX_SCORE_FACTORS.includes("RISK_CONTROL"));
});

test("resolveSmartTaxScoreLevel follows score ranges", () => {
  assert.equal(domain.resolveSmartTaxScoreLevel(0), "DEFICIENT");
  assert.equal(domain.resolveSmartTaxScoreLevel(40), "DEFICIENT");
  assert.equal(domain.resolveSmartTaxScoreLevel(41), "DEVELOPING");
  assert.equal(domain.resolveSmartTaxScoreLevel(65), "DEVELOPING");
  assert.equal(domain.resolveSmartTaxScoreLevel(66), "HEALTHY");
  assert.equal(domain.resolveSmartTaxScoreLevel(85), "HEALTHY");
  assert.equal(domain.resolveSmartTaxScoreLevel(86), "OPTIMAL");
  assert.equal(domain.resolveSmartTaxScoreLevel(100), "OPTIMAL");
});

test("Validators reject invalid values", () => {
  assert.equal(domain.isValidSmartTaxScoreLevel("DEFICIENT"), true);
  assert.equal(domain.isValidSmartTaxScoreLevel("CRITICAL"), false);
  assert.equal(domain.isValidSmartTaxScoreFactor("TAX_IDENTITY"), true);
  assert.equal(domain.isValidSmartTaxScoreFactor("OTHER"), false);
});

test("capSmartScore enforces 0-100 range", () => {
  assert.equal(domain.capSmartScore(-5), 0);
  assert.equal(domain.capSmartScore(0), 0);
  assert.equal(domain.capSmartScore(50), 50);
  assert.equal(domain.capSmartScore(100), 100);
  assert.equal(domain.capSmartScore(150), 100);
});
