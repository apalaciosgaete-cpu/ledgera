import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("User tax file page uses simple language", () => {
  const source = read("src/app/(protected)/mi-expediente/page.tsx");

  assert.match(source, /Tu resumen tributario en LEDGERA/);
  assert.match(source, /\/api\/tax-file\/me/);
  assert.match(source, /Mi información tributaria/);
  assert.match(source, /Mis alertas y tareas/);
  assert.match(source, /Mis documentos/);
  assert.match(source, /Mi plan/);
});

test("User tax file page handles all statuses", () => {
  const source = read("src/app/(protected)/mi-expediente/page.tsx");

  assert.match(source, /HEALTHY/);
  assert.match(source, /ATTENTION_REQUIRED/);
  assert.match(source, /HIGH_RISK/);
  assert.match(source, /CRITICAL/);
});

test("Expert tax files page lists users with status filter", () => {
  const source = read("src/app/(protected)/experto/expedientes/page.tsx");

  assert.match(source, /\/api\/tax-files/);
  assert.match(source, /Expedientes tributarios/);
  assert.match(source, /\/experto\/expedientes/);
});

test("Expert tax file detail page shows all sections", () => {
  const source = read("src/app/(protected)/experto/expedientes/[userId]/page.tsx");

  assert.match(source, /\/api\/tax-files/);
  assert.match(source, /Identidad tributaria/);
  assert.match(source, /SII/);
  assert.match(source, /Suscripción/);
  assert.match(source, /Conexiones y auditoría/);
});

test("Expert layout links to tax files", () => {
  const source = read("src/app/(protected)/experto/layout.tsx");

  assert.match(source, /Expedientes/);
  assert.match(source, /\/experto\/expedientes/);
});

test("Expert dashboard includes tax file widgets", () => {
  const source = read("src/app/(protected)/experto/dashboard/page.tsx");

  assert.match(source, /Expedientes críticos/);
  assert.match(source, /Expedientes con atención/);
  assert.match(source, /Expedientes saludables/);
});
