import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("professional extra client price is explicit and tax-separated", () => {
  const source = read("src/modules/professional/domain/professionalSeatBilling.ts");

  assert.match(source, /PROFESSIONAL_EXTRA_CLIENT_PRODUCT = "PROFESSIONAL_EXTRA_CLIENT"/);
  assert.match(source, /PROFESSIONAL_EXTRA_CLIENT_NET_CLP = 4_990/);
  assert.match(source, /PROFESSIONAL_EXTRA_CLIENT_TAX_CLP = 948/);
  assert.match(source, /PROFESSIONAL_EXTRA_CLIENT_TOTAL_CLP = 5_938/);
});

test("extra client checkout requires professional capability and 2FA", () => {
  const source = read("src/app/api/billing/professional-client-seat/checkout/route.ts");

  assert.match(source, /Feature\.EXPERT_MODE/);
  assert.match(source, /TWO_FACTOR_REQUIRED/);
  assert.match(source, /PROFESSIONAL_EXTRA_CLIENT_PRODUCT/);
  assert.match(source, /professionalExtraClientPrice/);
  assert.match(source, /new URL\(/);
});

test("billing webhook activates an independent extra-seat subscription", () => {
  const source = read("src/modules/billing/application/processBillingWebhook.ts");

  assert.match(source, /processProfessionalExtraClientPayment/);
  assert.match(source, /plan: PROFESSIONAL_EXTRA_CLIENT_PRODUCT/);
  assert.match(source, /professional_extra_client_completed/);
  assert.match(source, /Cliente adicional activado/);
  assert.match(source, /plan: \{ not: PROFESSIONAL_EXTRA_CLIENT_PRODUCT \}/);
});

test("professional seat entitlement combines included and paid seats", () => {
  const source = read("src/modules/professional/application/getProfessionalSeatEntitlement.ts");

  assert.match(source, /PROFESSIONAL_INCLUDED_CLIENTS/);
  assert.match(source, /PROFESSIONAL_EXTRA_CLIENT_PRODUCT/);
  assert.match(source, /purchasedSeats/);
  assert.match(source, /totalSeats: PROFESSIONAL_INCLUDED_CLIENTS \+ purchasedSeats/);
});

test("professional client API enforces dynamic total seats", () => {
  const source = read("src/app/api/professional/clients/route.ts");

  assert.match(source, /getProfessionalSeatEntitlement/);
  assert.match(source, /occupiedSeats >= seatEntitlement\.totalSeats/);
  assert.match(source, /purchasedSeats/);
  assert.match(source, /extraSeatPrice/);
});

test("professional workflow has canonical states and persistence", () => {
  const domain = read("src/modules/professional/domain/clientAccess.ts");
  const schema = read("prisma/schema/professional.prisma");
  const migration = read("prisma/migrations/20260721001000_add_professional_client_workflow/migration.sql");

  for (const status of ["INVITED", "DATA_PENDING", "REVIEWING", "READY_TO_FILE", "COMPLETED", "BLOCKED"]) {
    assert.match(domain, new RegExp(status));
  }

  assert.match(schema, /workflowStatus\s+String\s+@default\("INVITED"\)/);
  assert.match(schema, /workflowNote\s+String\?/);
  assert.match(schema, /workflowUpdatedAt\s+DateTime/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "workflowStatus"/);
});

test("professional workflow changes require active mandates and are audited", () => {
  const route = read("src/app/api/professional/clients/[clientId]/route.ts");
  const repository = read("src/modules/professional/infrastructure/professionalClientAccessRepository.ts");

  assert.match(route, /export async function PATCH/);
  assert.match(route, /getActiveProfessionalClientAccess/);
  assert.match(route, /PROFESSIONAL_CLIENT_WORKFLOW_UPDATED/);
  assert.match(route, /workflowNote\.length > 500/);
  assert.match(repository, /status: ProfessionalAccessStatus\.ACTIVE/);
  assert.match(repository, /updateProfessionalClientWorkflow/);
});

test("professional panel exposes seat checkout and workflow editing", () => {
  const source = read("src/app/(protected)/profesional/clientes/page.tsx");

  assert.match(source, /professional-client-seat\/checkout/);
  assert.match(source, /Contratar cliente adicional/);
  assert.match(source, /Guardar avance/);
  assert.match(source, /READY_TO_FILE/);
  assert.match(source, /workflowNote/);
});
