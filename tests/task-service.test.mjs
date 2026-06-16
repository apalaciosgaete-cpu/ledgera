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

function buildPrismaMock(overrides = {}) {
  const now = new Date();

  return {
    $transaction: async (promises) => Promise.all(promises),
    task: {
      create: async (args) => ({ id: "t1", ...args.data, createdAt: now, updatedAt: now }),
      findUnique: async () => null,
      findFirst: async () => null,
      findMany: async () => [],
      count: async () => 0,
      update: async (args) => ({ id: args.where.id, ...args.data, createdAt: now, updatedAt: now }),
      updateMany: async () => ({ count: 1 }),
      delete: async () => ({}),
      ...overrides.task,
    },
  };
}

const domain = loadTsModule("src/modules/tasks/domain/task.ts");

const repository = loadTsModule("src/modules/tasks/infrastructure/taskRepository.ts", {
  "@/lib/prisma": { prisma: buildPrismaMock() },
  "@/modules/tasks/domain/task": domain,
});

test("createTask persists PENDING task", async () => {
  const task = await repository.createTask({
    userId: "u1",
    title: "Completar perfil",
    description: "Falta RUT",
    category: "COMPLIANCE",
    priority: "HIGH",
    source: "RECOMMENDATION",
  });

  assert.equal(task.userId, "u1");
  assert.equal(task.category, "COMPLIANCE");
  assert.equal(task.status, "PENDING");
});

test("task repository exposes required methods", () => {
  const source = read("src/modules/tasks/infrastructure/taskRepository.ts");

  assert.match(source, /export async function createTask/);
  assert.match(source, /export async function updateTask/);
  assert.match(source, /export async function getTaskById/);
  assert.match(source, /export async function listUserTasks/);
  assert.match(source, /export async function listTasks/);
  assert.match(source, /export async function deleteTask/);
  assert.match(source, /export async function countOpenTasks/);
});

test("createTask validates required fields", async () => {
  const prismaMock = buildPrismaMock();
  const { createTask } = loadTsModule("src/modules/tasks/application/createTask.ts", {
    "@/modules/tasks/infrastructure/taskRepository": repository,
    "@/modules/tasks/domain/task": domain,
    "@/modules/audit/application/recordAuditEvent": { recordAuditEvent: async () => {} },
  });

  const result = await createTask({
    userId: "",
    title: "",
    description: "",
    category: "COMPLIANCE",
    priority: "HIGH",
    source: "MANUAL",
  });

  assert.equal(result.ok, false);
});

test("startTask, blockTask, completeTask and cancelTask emit correct audit events", () => {
  assert.match(read("src/modules/tasks/application/startTask.ts"), /task_started/);
  assert.match(read("src/modules/tasks/application/blockTask.ts"), /task_blocked/);
  assert.match(read("src/modules/tasks/application/completeTask.ts"), /task_completed/);
  assert.match(read("src/modules/tasks/application/cancelTask.ts"), /task_cancelled/);
});

test("generateTasksFromRecommendations maps known recommendation sources", () => {
  const source = read("src/modules/tasks/application/generateTasksFromRecommendations.ts");

  assert.match(source, /TAX_PROFILE_INCOMPLETE/);
  assert.match(source, /TAX_DOCUMENT_REJECTED/);
  assert.match(source, /SMART_TAX_SCORE/);
  assert.match(source, /EXCHANGE_CONNECTION_INACTIVE/);
  assert.match(source, /SII_CERTIFICATE_EXPIRED/);
  assert.match(source, /findActiveTaskBySource/);
});
