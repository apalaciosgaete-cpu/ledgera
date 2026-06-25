import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (filePath) => fs.readFileSync(filePath, "utf8");

test("package has production scripts", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts.build, "next build");
  assert.equal(pkg.scripts.typecheck, "tsc --noEmit");
});

test("configuration routes require auth", () => {
  assert.match(read("src/app/api/configuracion/route.ts"), /requireAuth/);
  assert.match(read("src/app/api/configuracion/audit/route.ts"), /requireAuth/);
});

test("configuration audit route checks admin role", () => {
  assert.match(read("src/app/api/configuracion/audit/route.ts"), /admin/);
});
