import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("Expert dashboard page renders executive title and sections", () => {
  const source = read("src/app/(protected)/experto/dashboard/page.tsx");

  assert.match(source, /Dashboard Ejecutivo/);
  assert.match(source, /\/api\/dashboard\/executive/);
  assert.match(source, /Top Riesgo/);
  assert.match(source, /Últimas Alertas/);
  assert.match(source, /Eventos Críticos/);
  assert.match(source, /Usuarios críticos/);
  assert.match(source, /Alertas críticas/);
  assert.match(source, /DTE pendientes/);
  assert.match(source, /Pagos pendientes/);
});

test("Expert layout includes dashboard link", () => {
  const source = read("src/app/(protected)/experto/layout.tsx");

  assert.match(source, /Dashboard/);
  assert.match(source, /\/experto\/dashboard/);
});

test("Investor dashboard includes new user widgets", () => {
  const source = read("src/app/(protected)/panel/InvestorDashboard.tsx");

  assert.match(source, /\/api\/dashboard\/user/);
  assert.match(source, /Mi Riesgo Tributario/);
  assert.match(source, /Alertas Abiertas/);
  assert.match(source, /Estado Tributario/);
  assert.match(source, /Estado Suscripción/);
  assert.match(source, /WidgetRisk/);
  assert.match(source, /WidgetAlerts/);
  assert.match(source, /WidgetTax/);
  assert.match(source, /WidgetSubscription/);
});
