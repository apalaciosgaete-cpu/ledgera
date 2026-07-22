import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("Legacy user tasks shim remains removed", () => {
  assert.equal(
    fs.existsSync(path.join(root, "src/app/(protected)/tareas/page.tsx")),
    false,
  );
});

test("Task API remains available after the legacy page cleanup", () => {
  const source = read("src/app/api/tasks/route.ts");

  assert.match(source, /export async function GET/);
  assert.match(source, /export async function POST/);
  assert.match(source, /requireActiveSubscription/);
});

test("Expert tasks page includes filters and table", () => {
  const source = read("src/app/(protected)/experto/tareas/page.tsx");

  assert.match(source, /\/api\/tasks\/admin/);
  assert.match(source, /Usuario/);
  assert.match(source, /Tarea/);
  assert.match(source, /Prioridad/);
  assert.match(source, /Estado/);
  assert.match(source, /Vencimiento/);
});

test("Unified shell omits the removed legacy expert tasks link", () => {
  const source = read("src/app/(protected)/layout.tsx");

  assert.match(source, /BASE_SIDEBAR_GROUPS/);
  assert.doesNotMatch(source, /\/experto\/tareas/);
});

test("Expert dashboard includes task metrics", () => {
  const source = read("src/app/(protected)/experto/dashboard/page.tsx");

  assert.match(source, /Tareas pendientes/);
  assert.match(source, /Tareas vencidas/);
  assert.match(source, /Tareas críticas/);
  assert.match(source, /Tiempo promedio resolución/);
});
