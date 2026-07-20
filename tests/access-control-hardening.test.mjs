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
    feature: "Feature.CSV_EXPORT",
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

test("expert mode is capability-gated and cannot select another tenant", () => {
  const source = read("src/app/api/expert/tax-cases/route.ts");

  assert.match(source, /requireFeatureAccess\(auth\.user, Feature\.EXPERT_MODE\)/);
  assert.match(source, /const isAdmin = auth\.user\.role === "admin"/);
  assert.match(source, /userId: isAdmin \? requestedUserId : auth\.user\.id/);
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
