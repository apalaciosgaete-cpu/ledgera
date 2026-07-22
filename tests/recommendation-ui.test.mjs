import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("User recommendations page shows actionable guidance", () => {
  const source = read("src/app/(protected)/recomendaciones/page.tsx");

  assert.match(source, /Qué hacer ahora/);
  assert.match(source, /\/api\/recommendations/);
  assert.match(source, /Actualizar recomendaciones/);
  assert.match(source, /Descartar/);
  assert.match(source, /actionUrl/);
  assert.match(source, /actionLabel/);
});

test("User recommendations page handles empty state", () => {
  const source = read("src/app/(protected)/recomendaciones/page.tsx");

  assert.match(source, /Todo en orden/);
  assert.match(source, /No tienes recomendaciones activas/);
});

test("Expert recommendations page includes filters and table", () => {
  const source = read("src/app/(protected)/experto/recomendaciones/page.tsx");

  assert.match(source, /\/api\/recommendations\/admin/);
  assert.match(source, /Categoría/);
  assert.match(source, /Prioridad/);
  assert.match(source, /Estado/);
  assert.match(source, /Usuario/);
  assert.match(source, /Recomendación/);
});

test("Unified shell omits the removed legacy expert recommendations link", () => {
  const source = read("src/app/(protected)/layout.tsx");

  assert.match(source, /BASE_SIDEBAR_GROUPS/);
  assert.doesNotMatch(source, /\/experto\/recomendaciones/);
});

test("Expert dashboard includes recommendation metrics", () => {
  const source = read("src/app/(protected)/experto/dashboard/page.tsx");

  assert.match(source, /Recomendaciones activas/);
  assert.match(source, /Recomendaciones críticas/);
  assert.match(source, /Usuarios con recomendaciones/);
  assert.match(source, /recommendations/);
});
