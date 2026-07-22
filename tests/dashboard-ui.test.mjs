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

test("Unified shell omits retired client-management navigation", () => {
  const source = read("src/app/(protected)/layout.tsx");

  assert.doesNotMatch(source, /\/profesional\/clientes/);
  assert.doesNotMatch(source, /\/accesos-profesionales/);
  assert.doesNotMatch(source, /\/experto\/dashboard/);
});

test("Investor dashboard renders the current asset summary", () => {
  const source = read("src/app/(protected)/panel/InvestorDashboard.tsx");

  assert.match(source, /\/api\/assets\/summary/);
  assert.match(source, /\/api\/assets\/visibility/);
  assert.match(source, /Valor total actual/);
  assert.match(source, /Diferencia vs\. base de costo/);
  assert.match(source, /Activos detectados/);
  assert.match(source, /PortfolioValuationChart/);
});
