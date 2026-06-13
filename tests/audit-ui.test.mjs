import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("User audit page exists at /configuracion/auditoria", () => {
  const source = read("src/app/(protected)/configuracion/auditoria/page.tsx");

  assert.match(source, /Auditoría de cuenta/);
  assert.match(source, /\/api\/audit\/events/);
});

test("Expert audit page exists at /experto/auditoria", () => {
  const source = read("src/app/(protected)/experto/auditoria/page.tsx");

  assert.match(source, /Auditoría Continua/);
  assert.match(source, /\/api\/audit\/events/);
  assert.match(source, /Exportar CSV/);
  assert.match(source, /Exportar JSON/);
});

test("Audit integrations exist in alert services", () => {
  const create = read("src/modules/alerts/application/createAlert.ts");
  const acknowledge = read("src/modules/alerts/application/acknowledgeAlert.ts");
  const resolve = read("src/modules/alerts/application/resolveAlert.ts");

  assert.match(create, /alert_created/);
  assert.match(acknowledge, /alert_acknowledged/);
  assert.match(resolve, /alert_resolved/);
});

test("Audit integration exists in risk service", () => {
  const source = read("src/modules/risk/application/calculateTaxRiskScore.ts");

  assert.match(source, /tax_risk_score_calculated/);
  assert.match(source, /risk_level_changed/);
});

test("Audit integration exists in DTE service", () => {
  const source = read("src/modules/tax/application/createTaxDocumentDraft.ts");

  assert.match(source, /tax_document_created/);
});

test("Audit integration exists in auth configuration", () => {
  const source = read("src/lib/auth.ts");

  assert.match(source, /login_success/);
  assert.match(source, /login_failed/);
});
