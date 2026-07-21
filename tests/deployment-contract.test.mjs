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
  assert.equal(packageJson.scripts.build, "prisma migrate deploy && next build");
});

test("Prisma uses the canonical config file and schema folder", () => {
  const config = read("prisma.config.ts");
  const packageJson = JSON.parse(read("package.json"));

  assert.match(config, /defineConfig/);
  assert.match(config, /schema: "prisma\/schema"/);
  assert.match(config, /path: "prisma\/migrations"/);
  assert.equal(packageJson.prisma, undefined);
});

test("professional workflow migration is versioned", () => {
  const migration = read(
    "prisma/migrations/20260721001000_add_professional_client_workflow/migration.sql",
  );

  assert.match(migration, /workflowStatus/);
  assert.match(migration, /workflowNote/);
  assert.match(migration, /workflowUpdatedAt/);
});
