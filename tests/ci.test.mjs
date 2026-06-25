import assert from "node:assert/strict";
import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
assert.equal(pkg.scripts.build, "next build");
assert.equal(pkg.scripts.typecheck, "tsc --noEmit");
assert.ok(fs.existsSync("src/app/api/configuracion/route.ts"));
assert.ok(fs.existsSync("src/app/api/configuracion/audit/route.ts"));

console.log("CI smoke checks passed");
