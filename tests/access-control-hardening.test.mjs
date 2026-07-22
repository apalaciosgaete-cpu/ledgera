import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const protectedExports = [
  {
    path: "src/app/api/tax/declarations/support/pdf/route.ts",
    feature: "Feature.PDF_EXPORT",
  },
  {
    path: "src/app/api/tax/declarations/support/xlsx/route.ts",
    feature: "Feature.XLSX_EXPORT",
  },
  {
    path: "src/app/api/tax/declarations/f22-crypto/pdf/route.ts",
    feature: "Feature.DECLARATIONS",
  },
  {
    path: "src/app/api/tax/declarations/[id]/export/route.ts",
    feature: "Feature.CSV_EXPORT",
  },
  {
    path: "src/app/api/tax/declarations/[id]/export-pdf/route.ts",
    feature: "Feature.PDF_EXPORT",
  },
  {
    path: "src/app/api/tax/declarations/[id]/audit-pdf/route.ts",
    feature: "Feature.AUDIT",
  },
];

for (const route of protectedExports) {
  test(`${route.path} enforces paid feature access`, () => {
    const source = read(route.path);

    assert.match(source, /requireAuth\(/);
    assert.match(source, /requireFeatureAccess\(auth\.user,/);
    assert.ok(source.includes(route.feature), `${route.path} must require ${route.feature}`);
    assert.match(source, /if \(!access\.ok\) return access\.response/);
  });
}

test("public registration route does not expose the user directory", () => {
  const source = read("src/app/api/users/route.ts");
  const authIndex = source.indexOf("getSessionFromRequest(request)");
  const roleIndex = source.indexOf('auth.user.role !== "admin"');
  const queryIndex = source.indexOf("const users = await getUsers()");

  assert.ok(authIndex >= 0, "GET /api/users must authenticate");
  assert.ok(roleIndex > authIndex, "GET /api/users must require admin role");
  assert.ok(queryIndex > roleIndex, "authorization must run before querying users");
});

test("public registration always assigns the personal role", () => {
  const source = read("src/app/api/users/route.ts");

  assert.match(source, /PUBLIC_REGISTRATION_ROLE = "personal"/);
  assert.match(source, /const role = PUBLIC_REGISTRATION_ROLE/);
  assert.doesNotMatch(source, /isValidRole\(body\.role\)/);
  assert.doesNotMatch(source, /role:\s*body\.role/);
});

test("registration UI neither displays nor submits operational roles", () => {
  const source = read("src/app/register/page.tsx");

  assert.doesNotMatch(source, /type Role =/);
  assert.doesNotMatch(source, /id="role"/);
  assert.doesNotMatch(source, /body:\s*\{[^}]*role/s);
  assert.match(source, /Todas las cuentas públicas se crean como cuentas personales/);
});

test("expert mode is limited to the owner or an administrator", () => {
  const source = read("src/app/api/expert/tax-cases/route.ts");

  assert.match(source, /requireFeatureAccess\(auth\.user, Feature\.EXPERT_MODE\)/);
  assert.match(source, /auth\.user\.role === "admin"/);
  assert.match(source, /requestedUserId !== auth\.user\.id/);
  assert.doesNotMatch(source, /requireProfessionalClientAccess/);
  assert.match(source, /userId: requestedUserId/);
});

test("administrators bypass commercial feature checks explicitly", () => {
  const source = read("src/modules/subscription/application/requireFeature.ts");

  assert.match(source, /user\.role === "admin"/);
  assert.match(source, /return \{ ok: true \}/);
});

test("subscription updates do not rewrite operational roles", () => {
  const repositorySource = read("src/modules/identity/infrastructure/userRepository.ts");
  const routeSource = read("src/app/api/admin/users/[id]/subscription/route.ts");
  const domainSource = read("src/modules/identity/domain/user.ts");

  assert.doesNotMatch(repositorySource, /PLAN_TO_ROLE/);
  assert.doesNotMatch(domainSource, /PLAN_TO_ROLE/);
  assert.doesNotMatch(routeSource, /PLAN_TO_ROLE/);
  assert.match(routeSource, /"BASICO", "PERSONAL", "PROFESIONAL"/);
  assert.doesNotMatch(routeSource, /const VALID_PLANS[^\n]*EMPRESA/);
});

test("admin metrics are derived from billing records", () => {
  const routeSource = read("src/app/api/admin/metrics/route.ts");
  const pageSource = read("src/app/admin/page.tsx");

  assert.match(routeSource, /billingSubscription\.findMany/);
  assert.match(routeSource, /billingPayment\.findMany/);
  assert.match(routeSource, /monthlyEquivalent/);
  assert.match(routeSource, /PAID/);
  assert.match(routeSource, /APPROVED/);
  assert.match(routeSource, /AUTHORIZED/);
  assert.match(pageSource, /\/api\/admin\/metrics/);
  assert.doesNotMatch(pageSource, /PLAN_PRICES/);
  assert.doesNotMatch(pageSource, /PERSONAL:\s*4990/);
  assert.doesNotMatch(pageSource, /PROFESIONAL:\s*14990/);
  assert.doesNotMatch(pageSource, /EMPRESA:\s*29990/);
});

test("historical professional access relations remain for data compatibility", () => {
  const schema = read("prisma/schema/professional.prisma");
  const platform = read("prisma/schema/platform.prisma");

  assert.match(schema, /model ProfessionalClientAccess/);
  assert.match(schema, /@@unique\(\[professionalUserId, clientUserId\]\)/);
  assert.match(schema, /status\s+String\s+@default\("PENDING"\)/);
  assert.match(platform, /professionalClientLinks\s+ProfessionalClientAccess\[\]/);
  assert.match(platform, /professionalAdvisorLinks\s+ProfessionalClientAccess\[\]/);
});

test("professional client runtime endpoints remain removed", () => {
  for (const relativePath of [
    "src/app/api/professional/clients/route.ts",
    "src/app/api/professional/invitations/route.ts",
    "src/app/api/billing/professional-client-seat/checkout/route.ts",
  ]) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), false);
  }
});

const movementCreationPaths = [
  "src/app/api/movements/route.ts",
  "src/app/api/portfolio/movements/route.ts",
  "src/app/api/movements/import/route.ts",
  "src/app/api/portfolio/import/confirm/route.ts",
  "src/app/api/integrations/binance/imports/confirm/route.ts",
  "src/app/api/integrations/binance/imports/bulk-confirm/route.ts",
  "src/modules/integrations/binance/application/confirmExchangeRecord.ts",
  "src/modules/integrations/binance/application/autoConfirmImports.ts",
];

for (const sourcePath of movementCreationPaths) {
  test(`${sourcePath} enforces the free movement limit`, () => {
    const source = read(sourcePath);
    assert.match(source, /enforceMovementLimit/);
  });
}

const subscriptionWritePaths = [
  "src/app/api/movements/route.ts",
  "src/app/api/portfolio/movements/route.ts",
  "src/app/api/movements/import/route.ts",
  "src/app/api/portfolio/import/confirm/route.ts",
  "src/app/api/integrations/binance/imports/confirm/route.ts",
  "src/app/api/integrations/binance/imports/bulk-confirm/route.ts",
  "src/app/api/integrations/binance/connect/route.ts",
  "src/app/api/integrations/binance/sync/route.ts",
  "src/app/api/bank/import/route.ts",
  "src/app/api/documents/route.ts",
  "src/app/api/tasks/route.ts",
];

for (const sourcePath of subscriptionWritePaths) {
  test(`${sourcePath} blocks writes for expired subscriptions`, () => {
    const source = read(sourcePath);
    assert.match(source, /requireActiveSubscription/);
    assert.match(
      source,
      /if \(!subscriptionCheck\.ok\)\s*\{?\s*return subscriptionCheck\.response;/,
    );
  });
}

const csrfProtectedWrites = [
  "src/app/api/integrations/binance/connect/route.ts",
  "src/app/api/integrations/binance/sync/route.ts",
  "src/app/api/bank/import/route.ts",
  "src/app/api/documents/route.ts",
  "src/app/api/tasks/route.ts",
];

for (const sourcePath of csrfProtectedWrites) {
  test(`${sourcePath} enforces CSRF protection on writes`, () => {
    const source = read(sourcePath);
    assert.match(source, /enforceCsrfProtection/);
  });
}

test("expired subscriptions return an explicit read-only contract", () => {
  const source = read(
    "src/modules/subscription/application/requireActiveSubscription.ts",
  );

  assert.match(source, /SUBSCRIPTION_READ_ONLY/);
  assert.match(source, /accessMode: isExpired \? "READ_ONLY" : "BLOCKED"/);
  assert.match(source, /Puedes consultar tu información/);
  assert.match(source, /status: isSuspended \? 403 : 402/);
});

test("free movement limit is canonical and returns an upgrade error", () => {
  const source = read(
    "src/modules/subscription/application/enforceMovementLimit.ts",
  );
  const apiResponse = read("src/shared/apiResponse.ts");

  assert.match(source, /FREE_MOVEMENT_LIMIT = 50/);
  assert.match(source, /normalizePlan\(user\.subscription_plan\) !== Plan\.FREE/);
  assert.match(source, /currentCount \+ requestedCount > FREE_MOVEMENT_LIMIT/);
  assert.match(apiResponse, /code: "FREE_MOVEMENT_LIMIT"/);
  assert.match(apiResponse, /status: 403/);
});
