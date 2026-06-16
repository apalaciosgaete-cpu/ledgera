import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("User tasks page shows actionable task list", () => {
  const source = read("src/app/(protected)/tareas/page.tsx");

  assert.match(source, /Qué hacer ahora/);
  assert.match(source, /\/api\/tasks/);
  assert.match(source, /Generar tareas desde recomendaciones/);
  assert.match(source, /Iniciar/);
  assert.match(source, /Completar/);
  assert.match(source, /Cancelar/);
});

test("User tasks page handles empty state", () => {
  const source = read("src/app/(protected)/tareas/page.tsx");

  assert.match(source, /Sin tareas activas/);
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

test("Expert layout links to tasks", () => {
  const source = read("src/app/(protected)/experto/layout.tsx");

  assert.match(source, /Tareas/);
  assert.match(source, /\/experto\/tareas/);
});

test("Expert dashboard includes task metrics", () => {
  const source = read("src/app/(protected)/experto/dashboard/page.tsx");

  assert.match(source, /Tareas pendientes/);
  assert.match(source, /Tareas vencidas/);
  assert.match(source, /Tareas críticas/);
  assert.match(source, /Tiempo promedio resolución/);
});
