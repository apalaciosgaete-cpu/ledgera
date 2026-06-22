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

const domain = loadTsModule("src/modules/tax-file/domain/taxFile.ts");

test("Tax file statuses are defined", () => {
  assert.equal(domain.TAX_FILE_STATUSES.length, 4);
  assert.ok(domain.TAX_FILE_STATUSES.includes("HEALTHY"));
  assert.ok(domain.TAX_FILE_STATUSES.includes("ATTENTION_REQUIRED"));
  assert.ok(domain.TAX_FILE_STATUSES.includes("HIGH_RISK"));
  assert.ok(domain.TAX_FILE_STATUSES.includes("CRITICAL"));
});

test("resolveTaxFileStatus returns CRITICAL for critical risk", () => {
  const status = domain.resolveTaxFileStatus({
    riskLevel: "CRITICAL",
    criticalOverdueTasks: 0,
    rejectedDocuments: 0,
    openCriticalAlerts: 0,
    smartScoreLevel: "HEALTHY",
    openAlerts: 0,
    pendingTasks: 0,
    profileValidated: true,
  });

  assert.equal(status, "CRITICAL");
});

test("resolveTaxFileStatus returns CRITICAL for rejected documents", () => {
  const status = domain.resolveTaxFileStatus({
    riskLevel: "LOW",
    criticalOverdueTasks: 0,
    rejectedDocuments: 1,
    openCriticalAlerts: 0,
    smartScoreLevel: "HEALTHY",
    openAlerts: 0,
    pendingTasks: 0,
    profileValidated: true,
  });

  assert.equal(status, "CRITICAL");
});

test("resolveTaxFileStatus returns HIGH_RISK for high risk level", () => {
  const status = domain.resolveTaxFileStatus({
    riskLevel: "HIGH",
    criticalOverdueTasks: 0,
    rejectedDocuments: 0,
    openCriticalAlerts: 0,
    smartScoreLevel: "HEALTHY",
    openAlerts: 0,
    pendingTasks: 0,
    profileValidated: true,
  });

  assert.equal(status, "HIGH_RISK");
});

test("resolveTaxFileStatus returns HIGH_RISK for open critical alerts", () => {
  const status = domain.resolveTaxFileStatus({
    riskLevel: "LOW",
    criticalOverdueTasks: 0,
    rejectedDocuments: 0,
    openCriticalAlerts: 1,
    smartScoreLevel: "HEALTHY",
    openAlerts: 1,
    pendingTasks: 0,
    profileValidated: true,
  });

  assert.equal(status, "HIGH_RISK");
});

test("resolveTaxFileStatus returns HIGH_RISK for deficient smart score", () => {
  const status = domain.resolveTaxFileStatus({
    riskLevel: "LOW",
    criticalOverdueTasks: 0,
    rejectedDocuments: 0,
    openCriticalAlerts: 0,
    smartScoreLevel: "DEFICIENT",
    openAlerts: 0,
    pendingTasks: 0,
    profileValidated: true,
  });

  assert.equal(status, "HIGH_RISK");
});

test("resolveTaxFileStatus returns ATTENTION_REQUIRED for open alerts", () => {
  const status = domain.resolveTaxFileStatus({
    riskLevel: "LOW",
    criticalOverdueTasks: 0,
    rejectedDocuments: 0,
    openCriticalAlerts: 0,
    smartScoreLevel: "HEALTHY",
    openAlerts: 1,
    pendingTasks: 0,
    profileValidated: true,
  });

  assert.equal(status, "ATTENTION_REQUIRED");
});

test("resolveTaxFileStatus returns ATTENTION_REQUIRED for pending tasks", () => {
  const status = domain.resolveTaxFileStatus({
    riskLevel: "LOW",
    criticalOverdueTasks: 0,
    rejectedDocuments: 0,
    openCriticalAlerts: 0,
    smartScoreLevel: "HEALTHY",
    openAlerts: 0,
    pendingTasks: 1,
    profileValidated: true,
  });

  assert.equal(status, "ATTENTION_REQUIRED");
});

test("resolveTaxFileStatus returns ATTENTION_REQUIRED for unvalidated profile", () => {
  const status = domain.resolveTaxFileStatus({
    riskLevel: "LOW",
    criticalOverdueTasks: 0,
    rejectedDocuments: 0,
    openCriticalAlerts: 0,
    smartScoreLevel: "HEALTHY",
    openAlerts: 0,
    pendingTasks: 0,
    profileValidated: false,
  });

  assert.equal(status, "ATTENTION_REQUIRED");
});

test("resolveTaxFileStatus returns HEALTHY when no signals", () => {
  const status = domain.resolveTaxFileStatus({
    riskLevel: "LOW",
    criticalOverdueTasks: 0,
    rejectedDocuments: 0,
    openCriticalAlerts: 0,
    smartScoreLevel: "HEALTHY",
    openAlerts: 0,
    pendingTasks: 0,
    profileValidated: true,
  });

  assert.equal(status, "HEALTHY");
});

test("TaxFileSummary interface is defined", () => {
  const source = read("src/modules/tax-file/domain/taxFile.ts");

  assert.match(source, /interface TaxFileSummary/);
  assert.match(source, /taxProfile/);
  assert.match(source, /smartScore/);
  assert.match(source, /taxDocuments/);
});
