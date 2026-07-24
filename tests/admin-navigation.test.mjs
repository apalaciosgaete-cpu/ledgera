import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("administrator workspace is visible only to administrators in the application menu", () => {
  const layout = read("src/app/(protected)/layout.tsx");

  assert.match(layout, /ADMIN_SIDEBAR_GROUP/);
  assert.match(layout, /href: "\/admin"/);
  assert.match(layout, /label: "Administración"/);
  assert.match(layout, /isAdmin\s*\?\s*\[\.\.\.BASE_SIDEBAR_GROUPS, ADMIN_SIDEBAR_GROUP\]/);
});

test("administrator profile menu exposes a direct workspace shortcut", () => {
  const profile = read("src/components/profile/UserProfileDropdown.tsx");

  assert.match(profile, /isAdmin \? \(/);
  assert.match(profile, /href="\/admin"/);
  assert.match(profile, /Panel administrativo/);
});

test("administrator routes enforce role access and preserve support chat access", () => {
  const layout = read("src/app/admin/layout.tsx");

  assert.match(layout, /AuthGuard/);
  assert.match(layout, /user\?\.role === "admin"/);
  assert.match(layout, /user\?\.role === "support"/);
  assert.match(layout, /pathname === "\/admin\/chat"/);
  assert.match(layout, /router\.replace\(isSupport \? "\/admin\/chat" : "\/panel"\)/);
});

test("administrator dashboard data is prefetched from the application menu", () => {
  const prefetch = read("src/shared/http/prefetchProtectedRoute.ts");

  assert.match(prefetch, /case "\/admin":/);
  assert.match(prefetch, /"\/api\/admin\/users"/);
  assert.match(prefetch, /"\/api\/admin\/metrics"/);
});

test("administrator access is not redirected into customer onboarding", () => {
  const guard = read("src/modules/identity/client/AuthGuard.tsx");

  assert.match(guard, /const isAdmin = user\?\.role === "admin"/);
  assert.match(guard, /!isSupport && !isAdmin/);
});
