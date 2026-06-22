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

const domain = loadTsModule("src/modules/tasks/domain/task.ts");

test("Task statuses are defined", () => {
  assert.equal(domain.TASK_STATUSES.length, 5);
  assert.ok(domain.TASK_STATUSES.includes("PENDING"));
  assert.ok(domain.TASK_STATUSES.includes("IN_PROGRESS"));
  assert.ok(domain.TASK_STATUSES.includes("BLOCKED"));
  assert.ok(domain.TASK_STATUSES.includes("COMPLETED"));
  assert.ok(domain.TASK_STATUSES.includes("CANCELLED"));
});

test("Task priorities are defined", () => {
  assert.equal(domain.TASK_PRIORITIES.length, 4);
  assert.ok(domain.TASK_PRIORITIES.includes("LOW"));
  assert.ok(domain.TASK_PRIORITIES.includes("MEDIUM"));
  assert.ok(domain.TASK_PRIORITIES.includes("HIGH"));
  assert.ok(domain.TASK_PRIORITIES.includes("CRITICAL"));
});

test("Task sources are defined", () => {
  assert.equal(domain.TASK_SOURCES.length, 7);
  assert.ok(domain.TASK_SOURCES.includes("ALERT"));
  assert.ok(domain.TASK_SOURCES.includes("RECOMMENDATION"));
  assert.ok(domain.TASK_SOURCES.includes("RISK"));
  assert.ok(domain.TASK_SOURCES.includes("DTE"));
  assert.ok(domain.TASK_SOURCES.includes("SII"));
  assert.ok(domain.TASK_SOURCES.includes("BILLING"));
  assert.ok(domain.TASK_SOURCES.includes("MANUAL"));
});

test("Task categories are defined", () => {
  assert.equal(domain.TASK_CATEGORIES.length, 6);
  assert.ok(domain.TASK_CATEGORIES.includes("TRIBUTARY"));
  assert.ok(domain.TASK_CATEGORIES.includes("COMPLIANCE"));
  assert.ok(domain.TASK_CATEGORIES.includes("OPERATIONS"));
  assert.ok(domain.TASK_CATEGORIES.includes("CONNECTIONS"));
  assert.ok(domain.TASK_CATEGORIES.includes("BILLING"));
  assert.ok(domain.TASK_CATEGORIES.includes("SECURITY"));
});

test("Validators accept valid values", () => {
  assert.equal(domain.isValidTaskStatus("PENDING"), true);
  assert.equal(domain.isValidTaskPriority("CRITICAL"), true);
  assert.equal(domain.isValidTaskSource("RECOMMENDATION"), true);
  assert.equal(domain.isValidTaskCategory("COMPLIANCE"), true);
});

test("Validators reject invalid values", () => {
  assert.equal(domain.isValidTaskStatus("ACTIVE"), false);
  assert.equal(domain.isValidTaskPriority("URGENT"), false);
  assert.equal(domain.isValidTaskSource("UNKNOWN"), false);
  assert.equal(domain.isValidTaskCategory("RISK"), false);
});

test("Status transition helpers enforce correct rules", () => {
  assert.equal(domain.canStartTask("PENDING"), true);
  assert.equal(domain.canStartTask("IN_PROGRESS"), false);
  assert.equal(domain.canBlockTask("IN_PROGRESS"), true);
  assert.equal(domain.canBlockTask("PENDING"), false);
  assert.equal(domain.canCompleteTask("PENDING"), true);
  assert.equal(domain.canCompleteTask("COMPLETED"), false);
  assert.equal(domain.canCancelTask("PENDING"), true);
  assert.equal(domain.canCancelTask("COMPLETED"), false);
});

test("taskKey deduplicates by userId, source and optional sourceId", () => {
  const keyWithoutSource = domain.taskKey({ userId: "u1", source: "RECOMMENDATION" });
  const keyWithSource = domain.taskKey({ userId: "u1", source: "RECOMMENDATION", sourceId: "s1" });

  assert.equal(keyWithoutSource, "u1:RECOMMENDATION");
  assert.equal(keyWithSource, "u1:RECOMMENDATION:s1");
  assert.notEqual(keyWithoutSource, keyWithSource);
});

test("Task interface is defined", () => {
  const source = read("src/modules/tasks/domain/task.ts");

  assert.match(source, /interface Task/);
  assert.match(source, /assignedTo/);
  assert.match(source, /dueDate/);
  assert.match(source, /startedAt/);
  assert.match(source, /completedAt/);
});
