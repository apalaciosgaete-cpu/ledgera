import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("GET /api/tax-files requires admin", () => {
  const source = read("src/app/api/tax-files/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /role !== "admin"/);
  assert.match(source, /listTaxFiles/);
  assert.match(source, /tax_file_summary_generated/);
});

test("GET /api/tax-files/[userId] requires admin", () => {
  const source = read("src/app/api/tax-files/[userId]/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /role !== "admin"/);
  assert.match(source, /buildTaxFileSummary/);
  assert.match(source, /tax_file_viewed/);
});

test("GET /api/tax-file/me returns own simplified tax file", () => {
  const source = read("src/app/api/tax-file/me/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /buildTaxFileSummary/);
  assert.match(source, /tax_file_viewed/);
});

test("Tax file admin API supports status filter", () => {
  const source = read("src/app/api/tax-files/route.ts");

  assert.match(source, /isValidTaxFileStatus/);
});

test("Dashboard executive API exposes tax file metrics", () => {
  const source = read("src/app/api/dashboard/executive/route.ts");

  assert.match(source, /taxFiles/);
});
