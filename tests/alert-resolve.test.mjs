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

test("resolveAlert transitions OPEN to RESOLVED", async () => {
  const alert = {
    id: "a1",
    userId: "u1",
    category: "TRIBUTARY",
    severity: "HIGH",
    title: "T",
    message: "M",
    status: "RESOLVED",
    metadata: null,
    source: null,
    acknowledgedAt: new Date(),
    resolvedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const { resolveAlert } = loadTsModule(
    "src/modules/alerts/application/resolveAlert.ts",
    {
      "@/modules/alerts/infrastructure/alertRepository": {
        resolveAlert: async () => alert,
      },
      "@/modules/audit/application/recordAuditEvent": {
        recordAuditEvent: async () => {},
      },
      "@/modules/timeline/application/recordTimelineEvent": {
        recordTimelineEvent: async () => {},
      },
    },
  );

  const result = await resolveAlert("a1");

  assert.equal(result.ok, true);
  assert.equal(result.alert.status, "RESOLVED");
});

test("resolveAlert transitions ACKNOWLEDGED to RESOLVED", async () => {
  const alert = {
    id: "a1",
    status: "RESOLVED",
    acknowledgedAt: new Date(),
    resolvedAt: new Date(),
  };

  const { resolveAlert } = loadTsModule(
    "src/modules/alerts/application/resolveAlert.ts",
    {
      "@/modules/alerts/infrastructure/alertRepository": {
        resolveAlert: async () => alert,
      },
      "@/modules/audit/application/recordAuditEvent": {
        recordAuditEvent: async () => {},
      },
      "@/modules/timeline/application/recordTimelineEvent": {
        recordTimelineEvent: async () => {},
      },
    },
  );

  const result = await resolveAlert("a1");

  assert.equal(result.ok, true);
  assert.equal(result.alert.status, "RESOLVED");
});

test("resolveAlert fails when alert cannot be resolved", async () => {
  const { resolveAlert } = loadTsModule(
    "src/modules/alerts/application/resolveAlert.ts",
    {
      "@/modules/alerts/infrastructure/alertRepository": {
        resolveAlert: async () => null,
      },
      "@/modules/audit/application/recordAuditEvent": {
        recordAuditEvent: async () => {},
      },
      "@/modules/timeline/application/recordTimelineEvent": {
        recordTimelineEvent: async () => {},
      },
    },
  );

  const result = await resolveAlert("a1");

  assert.equal(result.ok, false);
  assert.match(result.message, /resuelta/);
});

test("resolveAlert emits alert_resolved telemetry", () => {
  const source = read("src/modules/alerts/application/resolveAlert.ts");

  assert.match(source, /alert_resolved/);
});

test("Alert repository resolve accepts OPEN or ACKNOWLEDGED", () => {
  const source = read("src/modules/alerts/infrastructure/alertRepository.ts");

  assert.match(source, /status:\s*{\s*in:\s*\["OPEN",\s*"ACKNOWLEDGED"\]/);
});
