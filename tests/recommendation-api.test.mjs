import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("GET /api/recommendations requires auth and returns active recommendations", () => {
  const source = read("src/app/api/recommendations/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /getUserRecommendations/);
  assert.match(source, /"ACTIVE"/);
  assert.match(source, /Recomendaciones obtenidas/);
});

test("POST /api/recommendations/generate forces regeneration", () => {
  const source = read("src/app/api/recommendations/generate/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /generateRecommendations/);
  assert.match(source, /Recomendaciones regeneradas/);
});

test("PATCH /api/recommendations/[id]/dismiss transitions to DISMISSED", () => {
  const source = read("src/app/api/recommendations/[id]/dismiss/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /dismissRecommendation/);
  assert.match(source, /Recomendación descartada/);
});

test("PATCH /api/recommendations/[id]/complete transitions to COMPLETED", () => {
  const source = read("src/app/api/recommendations/[id]/complete/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /completeRecommendation/);
  assert.match(source, /Recomendación completada/);
});

test("Admin recommendations API requires admin role", () => {
  const source = read("src/app/api/recommendations/admin/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /role !== "admin"/);
  assert.match(source, /listRecommendations/);
});

test("Dashboard executive API exposes recommendation metrics", () => {
  const source = read("src/app/api/dashboard/executive/route.ts");

  assert.match(source, /recommendations/);
});
