import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (filePath) => fs.readFileSync(filePath, "utf8");

test("package has production scripts", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts.build, "node scripts/deploy-database.mjs && next build");
  assert.equal(pkg.scripts["db:deploy"], "node scripts/deploy-database.mjs");
  assert.equal(pkg.scripts.typecheck, "tsc --noEmit");
});

test("package lock matches direct production and development dependencies", () => {
  const pkg = JSON.parse(read("package.json"));
  const lock = JSON.parse(read("package-lock.json"));
  const lockedRoot = lock.packages[""];

  assert.deepEqual(lockedRoot.dependencies, pkg.dependencies);
  assert.deepEqual(lockedRoot.devDependencies, pkg.devDependencies);
});

test("package lock includes every Next.js SWC optional dependency", () => {
  const lock = JSON.parse(read("package-lock.json"));
  const next = lock.packages["node_modules/next"];

  for (const packageName of Object.keys(next.optionalDependencies)) {
    assert.ok(
      lock.packages[`node_modules/${packageName}`],
      `Missing ${packageName} from package-lock.json`,
    );
  }
});

test("configuration routes require auth", () => {
  assert.match(read("src/app/api/configuracion/route.ts"), /requireAuth/);
  assert.match(read("src/app/api/configuracion/audit/route.ts"), /requireAuth/);
});

test("configuration audit route checks admin role", () => {
  assert.match(read("src/app/api/configuracion/audit/route.ts"), /admin/);
});
