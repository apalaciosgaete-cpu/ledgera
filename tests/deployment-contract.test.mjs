import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("Vercel executes the repository build script", () => {
  const config = JSON.parse(read("vercel.json"));
  const packageJson = JSON.parse(read("package.json"));

  assert.equal(config.buildCommand, "npm run build");
  assert.equal(packageJson.scripts.build, "node scripts/deploy-database.mjs && next build");
  assert.equal(packageJson.scripts["db:deploy"], "node scripts/deploy-database.mjs");
});

test("Prisma uses the canonical config file and schema folder", () => {
  const config = read("prisma.config.ts");
  const packageJson = JSON.parse(read("package.json"));

  assert.match(config, /defineConfig/);
  assert.match(config, /schema: "prisma\/schema"/);
  assert.match(config, /path: "prisma\/migrations"/);
  assert.equal(packageJson.prisma, undefined);
});

test("existing production database baseline is bounded and fail-closed", () => {
  const script = read("scripts/deploy-database.mjs");

  assert.match(script, /baselineCutoff = "20260713010000_remove_unused_domains"/);
  assert.match(script, /deployOutput\.includes\("P3005"\)/);
  assert.match(script, /migrate", "resolve", "--applied"/);
  assert.match(script, /pendingMigrations\.length === 0/);
  assert.match(script, /migrate", "deploy"/);
});

test("known failed smart tax migration can be recovered safely", () => {
  const script = read("scripts/deploy-database.mjs");
  const migration = read(
    "prisma/migrations/20260613000000_add_smart_tax_scores/migration.sql",
  );

  assert.match(script, /recoverableFailedMigration = "20260613000000_add_smart_tax_scores"/);
  assert.match(script, /output\.includes\("P3009"\)/);
  assert.match(script, /"migrate",\s*"resolve",\s*"--rolled-back"/);
  assert.match(migration, /TIMESTAMP\(3\)/);
  assert.doesNotMatch(migration, /DATETIME/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS/);
});

test("professional workflow migration is versioned", () => {
  const migration = read(
    "prisma/migrations/20260721001000_add_professional_client_workflow/migration.sql",
  );

  assert.match(migration, /workflowStatus/);
  assert.match(migration, /workflowNote/);
  assert.match(migration, /workflowUpdatedAt/);
});
