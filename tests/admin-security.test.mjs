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

test("admin reauthentication tokens are signed, session-bound and short-lived", () => {
  const source = read("src/modules/admin/application/adminReauthentication.ts");

  assert.match(source, /createHmac\("sha256"/);
  assert.match(source, /timingSafeEqual/);
  assert.match(source, /sessionId === input\.auth\.session\.id/);
  assert.match(source, /ADMIN_REAUTH_TTL_SECONDS = 10 \* 60/);
  assert.match(source, /ADMIN_REAUTH_REQUIRED/);
  assert.match(source, /ADMIN_2FA_REQUIRED/);
});

test("admin reauthentication verifies password and TOTP", () => {
  const source = read("src/app/api/admin/reauth/route.ts");

  assert.match(source, /verifyPassword/);
  assert.match(source, /validateTwoFactorCode/);
  assert.match(source, /issueAdminReauthenticationToken/);
  assert.match(source, /ADMIN_REAUTHENTICATED/);
  assert.match(source, /enforceRequestRateLimit/);
});

for (const routePath of [
  "src/app/api/admin/users/[id]/route.ts",
  "src/app/api/admin/users/[id]/status/route.ts",
  "src/app/api/admin/users/[id]/subscription/route.ts",
]) {
  test(`${routePath} requires recent admin reauthentication`, () => {
    const source = read(routePath);
    assert.match(source, /requireAdminReauthentication/);
    assert.match(source, /isPlatformAuth/);
    assert.match(source, /reauthenticated: true/);
  });
}

test("admin UI obtains and sends the reauthentication header", () => {
  const page = read("src/app/admin/page.tsx");
  const client = read("src/modules/admin/client/adminReauthenticationClient.ts");

  assert.match(page, /AdminReauthenticationModal/);
  assert.match(page, /getAdminReauthenticationHeaders/);
  assert.match(page, /headers: criticalHeaders\(\)/);
  assert.match(client, /X-LEDGERA-ADMIN-REAUTH/);
  assert.match(client, /window\.sessionStorage/);
});
