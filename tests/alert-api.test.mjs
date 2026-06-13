import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("Alerts API route supports GET and POST", () => {
  const source = read("src/app/api/alerts/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /export async function GET/);
  assert.match(source, /export async function POST/);
  assert.match(source, /listUserAlerts/);
  assert.match(source, /createAlert/);
});

test("Alerts API supports status, severity and category filters", () => {
  const source = read("src/app/api/alerts/route.ts");

  assert.match(source, /status/);
  assert.match(source, /severity/);
  assert.match(source, /category/);
  assert.match(source, /isValidAlertStatus/);
  assert.match(source, /isValidAlertSeverity/);
  assert.match(source, /isValidAlertCategory/);
});

test("Alerts acknowledge API route exists", () => {
  const source = read("src/app/api/alerts/[id]/acknowledge/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /acknowledgeAlert/);
  assert.match(source, /export async function PATCH/);
});

test("Alerts resolve API route exists", () => {
  const source = read("src/app/api/alerts/[id]/resolve/route.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /resolveAlert/);
  assert.match(source, /export async function PATCH/);
});

test("User alerts page exists at /alertas", () => {
  const source = read("src/app/(protected)/alertas/page.tsx");

  assert.match(source, /Centro de Alertas/);
  assert.match(source, /\/api\/alerts/);
});

test("Expert alerts page exists at /experto/alertas", () => {
  const source = read("src/app/(protected)/experto/alertas/page.tsx");

  assert.match(source, /Gestión de Alertas/);
  assert.match(source, /\/api\/alerts/);
});
