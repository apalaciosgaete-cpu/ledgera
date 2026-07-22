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

test("Legacy expert risk page remains removed", () => {
  assert.equal(
    fs.existsSync(path.join(root, "src/app/(protected)/experto/riesgo/page.tsx")),
    false,
  );
});

test("Current user risk page displays score level and breakdown", () => {
  const userSource = read("src/app/(protected)/riesgo/page.tsx");

  assert.match(userSource, /score.level/);
  assert.match(userSource, /breakdown/);
  assert.match(userSource, /\/api\/risk\/score/);
});
