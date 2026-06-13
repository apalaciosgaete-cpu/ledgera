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

test("Audit repository exposes required methods", () => {
  const source = read("src/modules/audit/infrastructure/auditRepository.ts");

  assert.match(source, /createAuditEvent/);
  assert.match(source, /getAuditEventById/);
  assert.match(source, /listAuditEvents/);
  assert.match(source, /listUserAuditEvents/);
  assert.match(source, /listCategoryAuditEvents/);
});

test("createAuditEvent persists event", async () => {
  const repository = loadTsModule(
    "src/modules/audit/infrastructure/auditRepository.ts",
    {
      "@/lib/prisma": {
        prisma: {
          auditEvent: {
            create: async (args) => ({
              id: "ae1",
              ...args.data,
              createdAt: new Date("2026-01-01"),
            }),
          },
        },
      },
      "@prisma/client": {},
    },
  );

  const event = await repository.createAuditEvent({
    userId: "u1",
    category: "RISK",
    severity: "INFO",
    event: "tax_risk_score_calculated",
    description: "Score calculado",
    result: "SUCCESS",
    metadata: { score: 50 },
  });

  assert.equal(event.id, "ae1");
  assert.equal(event.category, "RISK");
  assert.equal(event.event, "tax_risk_score_calculated");
});

test("recordAuditEvent delegates to repository", async () => {
  let created = null;

  const { recordAuditEvent } = loadTsModule(
    "src/modules/audit/application/recordAuditEvent.ts",
    {
      "@/modules/audit/infrastructure/auditRepository": {
        createAuditEvent: async (input) => {
          created = input;
          return {
            id: "ae1",
            userId: input.userId ?? null,
            actorId: input.actorId ?? null,
            category: input.category,
            severity: input.severity,
            event: input.event,
            description: input.description,
            result: input.result ?? "SUCCESS",
            entityType: input.entityType ?? null,
            entityId: input.entityId ?? null,
            metadata: input.metadata ?? null,
            ipAddress: input.ipAddress ?? null,
            userAgent: input.userAgent ?? null,
            createdAt: new Date(),
          };
        },
      },
    },
  );

  await recordAuditEvent({
    userId: "u1",
    category: "ALERT",
    severity: "WARNING",
    event: "alert_created",
    description: "Alerta creada",
  });

  assert.equal(created.category, "ALERT");
  assert.equal(created.result, "SUCCESS");
});

test("recordAuditEvent emits audit_event_recorded telemetry", () => {
  const source = read("src/modules/audit/application/recordAuditEvent.ts");

  assert.match(source, /audit_event_recorded/);
});
