import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("tax profile domain defines TaxProfile interface", () => {
  const source = read("src/modules/tax/domain/taxProfile.ts");

  assert.match(source, /interface TaxProfile/);
  assert.match(source, /documentType/);
  assert.match(source, /BOLETA/);
  assert.match(source, /FACTURA/);
});

test("tax profile repository exposes get and upsert", () => {
  const source = read("src/modules/tax/infrastructure/taxProfileRepository.ts");

  assert.match(source, /getTaxProfileByUserId/);
  assert.match(source, /upsertTaxProfile/);
});

test("Prisma schema includes TaxProfile model", () => {
  const source = read("prisma/schema.prisma");

  assert.match(source, /model TaxProfile/);
  assert.match(source, /tax_profiles/);
});

test("tax profile migration SQL exists", () => {
  const migrations = fs.readdirSync(path.join(root, "prisma/migrations"));
  const taxMigration = migrations.find((m) => m.includes("tax_profile"));

  assert.ok(taxMigration, "No se encontró migración de tax profile");

  const source = read(`prisma/migrations/${taxMigration}/migration.sql`);

  assert.match(source, /tax_profiles/);
});
