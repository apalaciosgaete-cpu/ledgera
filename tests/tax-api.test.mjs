import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("tax profile API route uses requireAuth", () => {
  const source = read("src/app/api/tax/profile/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /GET/);
  assert.match(source, /POST/);
});

test("tax profile API validates RUT before saving", () => {
  const source = read("src/app/api/tax/profile/route.ts");

  assert.match(source, /validateRut/);
});

test("tax profile API restricts FACTURA to paid plans", () => {
  const source = read("src/app/api/tax/profile/route.ts");

  assert.match(source, /FACTURA/);
  assert.match(source, /PROFESIONAL/);
  assert.match(source, /EMPRESA/);
});

test("tax profile API emits telemetry", () => {
  const source = read("src/app/api/tax/profile/route.ts");

  assert.match(source, /tax_profile_saved/);
});

test("configuration shell includes tax identity section", () => {
  const source = read("src/app/(protected)/configuracion/ConfiguracionShell.tsx");

  assert.match(source, /identidadTributaria/);
  assert.match(source, /Identidad Tributaria/);
  assert.match(source, /\/api\/tax\/profile/);
});

test("tax identity configuration page exists", () => {
  const source = read("src/app/(protected)/configuracion/identidad-tributaria/page.tsx");

  assert.match(source, /ConfiguracionShell/);
  assert.match(source, /identidadTributaria/);
});
