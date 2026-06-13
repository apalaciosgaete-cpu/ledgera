import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("Risk score API route supports GET", () => {
  const source = read("src/app/api/risk/score/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /GET/);
  assert.match(source, /getLatestTaxRiskScore/);
});

test("Risk evaluate API route supports POST", () => {
  const source = read("src/app/api/risk/evaluate/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /POST/);
  assert.match(source, /calculateTaxRiskScore/);
});

test("Risk scores API route is admin protected", () => {
  const source = read("src/app/api/risk/scores/route.ts");

  assert.match(source, /getSessionFromRequest/);
  assert.match(source, /admin/);
  assert.match(source, /listTaxRiskScores/);
});

test("Prisma schema includes TaxRiskScore model", () => {
  const source = read("prisma/schema.prisma");

  assert.match(source, /model TaxRiskScore/);
  assert.match(source, /tax_risk_scores/);
  assert.match(source, /taxRiskScores/);
});

test("Tax risk scores migration SQL exists", () => {
  const migrations = fs.readdirSync(path.join(root, "prisma/migrations"));
  const riskMigration = migrations.find((m) => m.includes("tax_risk_scores"));

  assert.ok(riskMigration, "No se encontró migración de tax_risk_scores");

  const source = read(`prisma/migrations/${riskMigration}/migration.sql`);

  assert.match(source, /tax_risk_scores/);
  assert.match(source, /"score"/);
  assert.match(source, /"level"/);
});
