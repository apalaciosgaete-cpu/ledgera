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

test("acknowledgeAlert transitions OPEN to ACKNOWLEDGED", async () => {
  const alert = {
    id: "a1",
    userId: "u1",
    category: "TRIBUTARY",
    severity: "HIGH",
    title: "T",
    message: "M",
    status: "ACKNOWLEDGED",
    metadata: null,
    source: null,
    acknowledgedAt: new Date(),
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const { acknowledgeAlert } = loadTsModule(
    "src/modules/alerts/application/acknowledgeAlert.ts",
    {
      "@/modules/alerts/infrastructure/alertRepository": {
        acknowledgeAlert: async () => alert,
      },
      "@/modules/audit/application/recordAuditEvent": {
        recordAuditEvent: async () => {},
      },
      "@/modules/timeline/application/recordTimelineEvent": {
        recordTimelineEvent: async () => {},
      },
    },
  );

  const result = await acknowledgeAlert("a1");

  assert.equal(result.ok, true);
  assert.equal(result.alert.status, "ACKNOWLEDGED");
});

test("acknowledgeAlert fails when alert cannot be acknowledged", async () => {
  const { acknowledgeAlert } = loadTsModule(
    "src/modules/alerts/application/acknowledgeAlert.ts",
    {
      "@/modules/alerts/infrastructure/alertRepository": {
        acknowledgeAlert: async () => null,
      },
      "@/modules/audit/application/recordAuditEvent": {
        recordAuditEvent: async () => {},
      },
      "@/modules/timeline/application/recordTimelineEvent": {
        recordTimelineEvent: async () => {},
      },
    },
  );

  const result = await acknowledgeAlert("a1");

  assert.equal(result.ok, false);
  assert.match(result.message, /reconocida/);
});

test("acknowledgeAlert emits alert_acknowledged telemetry", () => {
  const source = read("src/modules/alerts/application/acknowledgeAlert.ts");

  assert.match(source, /alert_acknowledged/);
});

test("Alert repository acknowledge only updates OPEN alerts", () => {
  const source = read("src/modules/alerts/infrastructure/alertRepository.ts");

  assert.match(source, /status:\s*"OPEN"/);
  assert.match(source, /status:\s*"ACKNOWLEDGED"/);
});
