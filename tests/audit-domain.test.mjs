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

const domain = loadTsModule("src/modules/audit/domain/audit.ts");

test("Audit domain defines categories", () => {
  assert.equal(domain.AUDIT_CATEGORIES.length, 12);
  assert.equal(domain.AUDIT_CATEGORIES[0], "AUTH");
  assert.ok(domain.AUDIT_CATEGORIES.includes("RISK"));
  assert.ok(domain.AUDIT_CATEGORIES.includes("SECURITY"));
});

test("Audit domain defines severities and results", () => {
  assert.equal(domain.AUDIT_SEVERITIES.length, 4);
  assert.equal(domain.AUDIT_RESULTS.length, 3);
});

test("Validators reject invalid values", () => {
  assert.equal(domain.isValidAuditCategory("RISK"), true);
  assert.equal(domain.isValidAuditCategory("OTHER"), false);
  assert.equal(domain.isValidAuditSeverity("CRITICAL"), true);
  assert.equal(domain.isValidAuditSeverity("DEBUG"), false);
  assert.equal(domain.isValidAuditResult("SUCCESS"), true);
  assert.equal(domain.isValidAuditResult("OK"), false);
});

test("AuditEvent interface includes 5W1H fields", () => {
  const source = read("src/modules/audit/domain/audit.ts");

  assert.match(source, /userId/);
  assert.match(source, /actorId/);
  assert.match(source, /event/);
  assert.match(source, /description/);
  assert.match(source, /result/);
  assert.match(source, /ipAddress/);
  assert.match(source, /userAgent/);
  assert.match(source, /metadata/);
});
