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

const domain = loadTsModule("src/modules/risk/domain/risk.ts");

test("resolveTaxRiskLevel returns correct levels", () => {
  assert.equal(domain.resolveTaxRiskLevel(0), "LOW");
  assert.equal(domain.resolveTaxRiskLevel(15), "LOW");
  assert.equal(domain.resolveTaxRiskLevel(30), "LOW");
  assert.equal(domain.resolveTaxRiskLevel(31), "MEDIUM");
  assert.equal(domain.resolveTaxRiskLevel(45), "MEDIUM");
  assert.equal(domain.resolveTaxRiskLevel(60), "MEDIUM");
  assert.equal(domain.resolveTaxRiskLevel(61), "HIGH");
  assert.equal(domain.resolveTaxRiskLevel(75), "HIGH");
  assert.equal(domain.resolveTaxRiskLevel(80), "HIGH");
  assert.equal(domain.resolveTaxRiskLevel(81), "CRITICAL");
  assert.equal(domain.resolveTaxRiskLevel(100), "CRITICAL");
});

test("capScore caps at max", () => {
  assert.equal(domain.capScore(20, 15), 15);
  assert.equal(domain.capScore(10, 15), 10);
  assert.equal(domain.capScore(100, 100), 100);
});

test("TaxRiskFactor includes all factors", () => {
  const source = read("src/modules/risk/domain/risk.ts");

  assert.match(source, /ALERTS/);
  assert.match(source, /TAX_PROFILE/);
  assert.match(source, /DTE/);
  assert.match(source, /SII/);
  assert.match(source, /UNCLASSIFIED_OPERATIONS/);
  assert.match(source, /CONNECTIONS/);
  assert.match(source, /COMMERCIAL/);
});

test("TaxRiskScore interface is defined", () => {
  const source = read("src/modules/risk/domain/risk.ts");

  assert.match(source, /interface TaxRiskScore/);
  assert.match(source, /breakdown/);
  assert.match(source, /evaluatedAt/);
});
