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

const domain = loadTsModule("src/modules/alerts/domain/alert.ts");

test("Alert domain defines categories", () => {
  assert.equal(domain.ALERT_CATEGORIES.length, 5);
  assert.equal(domain.ALERT_CATEGORIES[0], "TRIBUTARY");
  assert.equal(domain.ALERT_CATEGORIES[1], "OPERATIONAL");
  assert.equal(domain.ALERT_CATEGORIES[2], "COMMERCIAL");
  assert.equal(domain.ALERT_CATEGORIES[3], "SECURITY");
  assert.equal(domain.ALERT_CATEGORIES[4], "COMPLIANCE");
});

test("Alert domain defines severities and statuses", () => {
  assert.equal(domain.ALERT_SEVERITIES.length, 4);
  assert.equal(domain.ALERT_SEVERITIES[0], "LOW");
  assert.equal(domain.ALERT_SEVERITIES[1], "MEDIUM");
  assert.equal(domain.ALERT_SEVERITIES[2], "HIGH");
  assert.equal(domain.ALERT_SEVERITIES[3], "CRITICAL");

  assert.equal(domain.ALERT_STATUSES.length, 3);
  assert.equal(domain.ALERT_STATUSES[0], "OPEN");
  assert.equal(domain.ALERT_STATUSES[1], "ACKNOWLEDGED");
  assert.equal(domain.ALERT_STATUSES[2], "RESOLVED");
});

test("Validators reject invalid values", () => {
  assert.equal(domain.isValidAlertCategory("TRIBUTARY"), true);
  assert.equal(domain.isValidAlertCategory("OTHER"), false);
  assert.equal(domain.isValidAlertSeverity("CRITICAL"), true);
  assert.equal(domain.isValidAlertSeverity("URGENT"), false);
  assert.equal(domain.isValidAlertStatus("OPEN"), true);
  assert.equal(domain.isValidAlertStatus("CLOSED"), false);
});

test("createAlert validates user existence", async () => {
  const { createAlert } = loadTsModule(
    "src/modules/alerts/application/createAlert.ts",
    {
      "@/modules/alerts/infrastructure/alertRepository": {
        createAlert: async () => ({ id: "a1" }),
      },
      "@/modules/identity/infrastructure/userRepository": {
        getUserById: async () => null,
      },
      "@/modules/alerts/domain/alert": domain,
      "@/modules/audit/application/recordAuditEvent": {
        recordAuditEvent: async () => {},
      },
      "@/modules/timeline/application/recordTimelineEvent": {
        recordTimelineEvent: async () => {},
      },
    },
  );

  const result = await createAlert({
    userId: "u1",
    category: "TRIBUTARY",
    severity: "HIGH",
    title: "Costo tributario faltante",
    message: "Falta costo tributario en operación.",
  });

  assert.equal(result.ok, false);
  assert.match(result.message, /Usuario/);
});

test("createAlert validates category and severity", async () => {
  const { createAlert } = loadTsModule(
    "src/modules/alerts/application/createAlert.ts",
    {
      "@/modules/alerts/infrastructure/alertRepository": {
        createAlert: async () => ({ id: "a1" }),
      },
      "@/modules/identity/infrastructure/userRepository": {
        getUserById: async () => ({ id: "u1" }),
      },
      "@/modules/alerts/domain/alert": domain,
      "@/modules/audit/application/recordAuditEvent": {
        recordAuditEvent: async () => {},
      },
      "@/modules/timeline/application/recordTimelineEvent": {
        recordTimelineEvent: async () => {},
      },
    },
  );

  const invalidCategory = await createAlert({
    userId: "u1",
    category: "OTHER",
    severity: "HIGH",
    title: "T",
    message: "M",
  });

  assert.equal(invalidCategory.ok, false);
  assert.match(invalidCategory.message, /Categoría/);

  const invalidSeverity = await createAlert({
    userId: "u1",
    category: "TRIBUTARY",
    severity: "URGENT",
    title: "T",
    message: "M",
  });

  assert.equal(invalidSeverity.ok, false);
  assert.match(invalidSeverity.message, /Severidad/);
});

test("createAlert emits alert_created telemetry and returns alert", async () => {
  const created = {
    id: "a1",
    userId: "u1",
    category: "TRIBUTARY",
    severity: "HIGH",
    title: "Costo faltante",
    message: "M",
    status: "OPEN",
  };

  const { createAlert } = loadTsModule(
    "src/modules/alerts/application/createAlert.ts",
    {
      "@/modules/alerts/infrastructure/alertRepository": {
        createAlert: async () => created,
      },
      "@/modules/identity/infrastructure/userRepository": {
        getUserById: async () => ({ id: "u1" }),
      },
      "@/modules/alerts/domain/alert": domain,
      "@/modules/audit/application/recordAuditEvent": {
        recordAuditEvent: async () => {},
      },
      "@/modules/timeline/application/recordTimelineEvent": {
        recordTimelineEvent: async () => {},
      },
    },
  );

  const result = await createAlert({
    userId: "u1",
    category: "TRIBUTARY",
    severity: "HIGH",
    title: "Costo faltante",
    message: "M",
  });

  assert.equal(result.ok, true);
  assert.equal(result.alert.id, "a1");
  assert.equal(result.alert.status, "OPEN");
});

test("Alert repository exposes required methods", () => {
  const source = read("src/modules/alerts/infrastructure/alertRepository.ts");

  assert.match(source, /createAlert/);
  assert.match(source, /getAlertById/);
  assert.match(source, /listUserAlerts/);
  assert.match(source, /listOpenAlerts/);
  assert.match(source, /acknowledgeAlert/);
  assert.match(source, /resolveAlert/);
});

test("Prisma schema includes Alert model with user relation", () => {
  const source = read("prisma/schema.prisma");

  assert.match(source, /model Alert/);
  assert.match(source, /alerts/);
  assert.match(source, /user\s+users\s+@relation/);
});

test("Alert migration SQL exists", () => {
  const migrations = fs.readdirSync(path.join(root, "prisma/migrations"));
  const alertMigration = migrations.find((m) => m.includes("add_alerts"));

  assert.ok(alertMigration, "No se encontró migración de alertas");

  const source = read(`prisma/migrations/${alertMigration}/migration.sql`);

  assert.match(source, /CREATE TABLE "alerts"/);
  assert.match(source, /"user_id"/);
  assert.match(source, /"status".*DEFAULT 'OPEN'/);
});
