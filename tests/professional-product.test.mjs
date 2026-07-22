import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

const retiredRuntimePaths = [
  "src/app/(protected)/accesos-profesionales/page.tsx",
  "src/app/(protected)/profesional/clientes/page.tsx",
  "src/app/api/professional/clients/route.ts",
  "src/app/api/professional/clients/[clientId]/route.ts",
  "src/app/api/professional/invitations/route.ts",
  "src/app/api/professional/invitations/[id]/respond/route.ts",
  "src/app/api/professional/invitations/[id]/revoke/route.ts",
  "src/app/api/billing/professional-client-seat/checkout/route.ts",
];

test("client and professional-access surfaces stay retired", () => {
  for (const relativePath of retiredRuntimePaths) {
    assert.equal(exists(relativePath), false, `${relativePath} must remain removed`);
  }
});

test("protected navigation does not advertise retired modules", () => {
  const source = read("src/app/(protected)/layout.tsx");

  assert.doesNotMatch(source, /\/profesional\/clientes/);
  assert.doesNotMatch(source, /\/accesos-profesionales/);
  assert.doesNotMatch(source, /Accesos profesionales/);
});

test("cross-account APIs allow only the owner or an administrator", () => {
  for (const relativePath of [
    "src/app/api/audit/events/route.ts",
    "src/app/api/documents/metrics/route.ts",
    "src/app/api/expert/tax-cases/route.ts",
  ]) {
    const source = read(relativePath);

    assert.match(source, /auth\.user\.role === "admin"/);
    assert.match(source, /requestedUserId !== auth\.user\.id|userId !== auth\.user\.id/);
    assert.doesNotMatch(source, /requireProfessionalClientAccess/);
    assert.doesNotMatch(source, /ProfessionalPermission/);
  }
});

test("commercial surfaces do not promise clients or multi-client access", () => {
  for (const relativePath of [
    "src/app/planes/page.tsx",
    "src/app/checkout/page.tsx",
    "src/components/subscription/PlanComparison.tsx",
    "src/modules/billing/application/billingPlans.ts",
    "src/app/legal/comercial/page.tsx",
  ]) {
    const source = read(relativePath);

    assert.doesNotMatch(source, /clientes incluidos/i);
    assert.doesNotMatch(source, /panel multicliente/i);
    assert.doesNotMatch(source, /cliente adicional/i);
    assert.doesNotMatch(source, /administra(?:r)? (?:hasta \d+ )?clientes/i);
  }
});

test("historical professional-access schema remains non-destructive", () => {
  const schema = read("prisma/schema/professional.prisma");
  const migration = read(
    "prisma/migrations/20260720231000_add_professional_client_access/migration.sql",
  );
  const retirement = read(
    "prisma/migrations/20260722210000_retire_professional_access/migration.sql",
  );

  assert.match(schema, /model ProfessionalClientAccess/);
  assert.match(migration, /CREATE TABLE "professional_client_access"/);
  assert.match(retirement, /"status" = 'REVOKED'/);
  assert.match(retirement, /WHERE "status" IN \('PENDING', 'ACTIVE'\)/);
  assert.match(retirement, /to_regclass\('public\.professional_client_access'\)/);
  assert.match(retirement, /ADD COLUMN IF NOT EXISTS "workflowStatus"/);
  assert.equal(
    fs.readdirSync(path.join(root, "prisma/migrations")).some(
      (name) => /drop.*professional/i.test(name),
    ),
    false,
  );
});
