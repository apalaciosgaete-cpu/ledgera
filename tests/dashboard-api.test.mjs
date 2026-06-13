import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("Executive dashboard API requires admin", () => {
  const source = read("src/app/api/dashboard/executive/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /role !== "admin"/);
  assert.match(source, /buildExecutiveDashboard/);
  assert.match(source, /executive_dashboard_generated/);
  assert.match(source, /dashboard_viewed/);
  assert.match(source, /recordAuditEvent/);
  assert.match(source, /data:/);
});

test("Executive dashboard API returns complete snapshot shape", () => {
  const source = read("src/app/api/dashboard/executive/route.ts");

  assert.match(source, /metrics/);
  assert.match(source, /alerts/);
  assert.match(source, /risk/);
  assert.match(source, /tax/);
  assert.match(source, /billing/);
  assert.match(source, /operations/);
  assert.match(source, /audit/);
  assert.match(source, /topRisk/);
  assert.match(source, /latestAlerts/);
  assert.match(source, /criticalEvents/);
});

test("User dashboard API requires authentication", () => {
  const source = read("src/app/api/dashboard/user/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /buildUserDashboard/);
  assert.match(source, /dashboard_viewed/);
  assert.match(source, /recordAuditEvent/);
});

test("Dashboard routes use correct HTTP method", () => {
  const executive = read("src/app/api/dashboard/executive/route.ts");
  const user = read("src/app/api/dashboard/user/route.ts");

  assert.match(executive, /export async function GET/);
  assert.match(user, /export async function GET/);
});
