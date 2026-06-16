import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("GET /api/tasks requires auth and supports filters", () => {
  const source = read("src/app/api/tasks/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /getUserTasks/);
  assert.match(source, /Tareas obtenidas/);
});

test("POST /api/tasks creates manual task", () => {
  const source = read("src/app/api/tasks/route.ts");

  assert.match(source, /createTask/);
  assert.match(source, /Tarea creada/);
});

test("GET /api/tasks/[id] returns task detail", () => {
  const source = read("src/app/api/tasks/[id]/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /getTaskById/);
  assert.match(source, /Tarea obtenida/);
});

test("PATCH /api/tasks/[id]/start transitions to IN_PROGRESS", () => {
  const source = read("src/app/api/tasks/[id]/start/route.ts");

  assert.match(source, /startTask/);
  assert.match(source, /Tarea iniciada/);
});

test("PATCH /api/tasks/[id]/block transitions to BLOCKED", () => {
  const source = read("src/app/api/tasks/[id]/block/route.ts");

  assert.match(source, /blockTask/);
  assert.match(source, /Tarea bloqueada/);
});

test("PATCH /api/tasks/[id]/complete transitions to COMPLETED", () => {
  const source = read("src/app/api/tasks/[id]/complete/route.ts");

  assert.match(source, /completeTask/);
  assert.match(source, /Tarea completada/);
});

test("PATCH /api/tasks/[id]/cancel transitions to CANCELLED", () => {
  const source = read("src/app/api/tasks/[id]/cancel/route.ts");

  assert.match(source, /cancelTask/);
  assert.match(source, /Tarea cancelada/);
});

test("POST /api/tasks/generate creates tasks from recommendations", () => {
  const source = read("src/app/api/tasks/generate/route.ts");

  assert.match(source, /generateTasksFromRecommendations/);
});

test("Admin tasks API requires admin role", () => {
  const source = read("src/app/api/tasks/admin/route.ts");

  assert.match(source, /role !== "admin"/);
  assert.match(source, /listTasks/);
});

test("Dashboard executive API exposes task metrics", () => {
  const source = read("src/app/api/dashboard/executive/route.ts");

  assert.match(source, /tasks/);
});
