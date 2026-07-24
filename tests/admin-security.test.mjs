import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("support is an explicit limited platform role", () => {
  const domain = read("src/modules/identity/domain/user.ts");
  const migration = read("prisma/migrations/20260720235000_add_support_role/migration.sql");
  const guard = read("src/modules/identity/application/requirePlatformRole.ts");

  assert.match(domain, /"support"/);
  assert.match(migration, /'support'/);
  assert.match(guard, /PLATFORM_ROLE_REQUIRED/);
});

for (const routePath of [
  "src/app/api/admin/chat/conversations/route.ts",
  "src/app/api/admin/chat/reply/route.ts",
  "src/app/api/admin/chat/heartbeat/route.ts",
]) {
  test(`${routePath} permits support only through the centralized role guard`, () => {
    const source = read(routePath);
    assert.match(source, /requirePlatformRole/);
    assert.match(source, /\["admin", "support"\]/);
    assert.match(source, /SUPPORT_CHAT_ONLY/);
  });
}

test("support is redirected away from tax application routes", () => {
  const source = read("src/modules/identity/client/AuthGuard.tsx");

  assert.match(source, /user\?\.role === "support"/);
  assert.match(source, /router\.replace\("\/admin\/chat"\)/);
  assert.match(source, /if \(isSupport && appRoute\)/);
});

for (const routePath of [
  "src/app/api/admin/users/[id]/route.ts",
  "src/app/api/admin/users/[id]/status/route.ts",
  "src/app/api/admin/users/[id]/subscription/route.ts",
]) {
  test(`${routePath} accepts mutations only from an authenticated administrator`, () => {
    const source = read(routePath);
    assert.match(source, /enforceCsrfProtection/);
    assert.match(source, /requirePlatformRole\(req, \["admin"\]\)/);
    assert.match(source, /isPlatformAuth/);
    assert.match(source, /createAdminAuditLog/);
    assert.match(source, /authorization: "admin_session"/);
    assert.doesNotMatch(source, /requireAdminReauthentication/);
  });
}

test("admin UI executes actions without requesting password and 2FA again", () => {
  const page = read("src/app/admin/page.tsx");

  assert.doesNotMatch(page, /AdminReauthenticationModal/);
  assert.doesNotMatch(page, /getAdminReauthenticationHeaders/);
  assert.doesNotMatch(page, /criticalHeaders/);
  assert.doesNotMatch(page, /Confirmar acción crítica/);
  assert.match(page, /onClick=\{\(\) => void toggleStatus\(user\)\}/);
  assert.match(page, /onClick=\{\(\) => void updateSubscription\(\)\}/);
});
