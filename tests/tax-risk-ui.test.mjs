import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("User risk page exists at /riesgo", () => {
  const source = read("src/app/(protected)/riesgo/page.tsx");

  assert.match(source, /Riesgo Tributario/);
  assert.match(source, /\/api\/risk\/score/);
  assert.match(source, /\/api\/risk\/evaluate/);
});

test("Expert risk page exists at /experto/riesgo", () => {
  const source = read("src/app/(protected)/experto/riesgo/page.tsx");

  assert.match(source, /Panel de Riesgo Tributario/);
  assert.match(source, /\/api\/risk\/scores/);
  assert.match(source, /\/experto\/alertas/);
});

test("Risk pages display score level and breakdown", () => {
  const userSource = read("src/app/(protected)/riesgo/page.tsx");
  const expertSource = read("src/app/(protected)/experto/riesgo/page.tsx");

  assert.match(userSource, /score.level/);
  assert.match(userSource, /breakdown/);
  assert.match(expertSource, /level/);
});
