import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (filePath) => fs.readFileSync(filePath, "utf8");

test("protected API authentication resolves session and user in one query", () => {
  const shared = read("src/shared.ts");

  assert.match(shared, /getSessionWithUserByToken/);
  assert.doesNotMatch(shared, /getSessionByToken/);
  assert.doesNotMatch(shared, /getUserById/);
});

test("authenticated GET requests are deduplicated and briefly cached", () => {
  const client = read("src/shared/http/httpClient.ts");

  assert.match(client, /DEFAULT_AUTH_GET_CACHE_TTL_MS = 30_000/);
  assert.match(client, /pendingGetRequests/);
  assert.match(client, /responseCache\.set/);
  assert.match(client, /isMutationMethod\(method\).*clearResponseCache/s);
  assert.match(read("src/modules/identity/client/authClient.ts"), /cacheTtlMs: 0/);
});

test("protected navigation warms the data needed by the destination", () => {
  const layout = read("src/app/(protected)/layout.tsx");
  const prefetch = read("src/shared/http/prefetchProtectedRoute.ts");

  assert.match(layout, /prefetchProtectedRoute/);
  assert.match(layout, /onMouseEnter/);
  assert.match(layout, /onFocus/);
  assert.match(prefetch, /\/api\/assets\/summary/);
  assert.match(prefetch, /\/api\/imports\/staging/);
  assert.match(prefetch, /\/api\/tax\/events/);
});

test("asset summary combines visibility and reuses public market responses", () => {
  const route = read("src/app/api/assets/summary/route.ts");
  const panel = read("src/app/(protected)/panel/InvestorDashboard.tsx");

  assert.match(route, /Promise\.all\(\[/);
  assert.match(route, /asset_visibility_preferences/);
  assert.match(route, /hiddenAssetSymbols/);
  assert.match(route, /next: \{ revalidate: 5 \* 60 \}/);
  assert.doesNotMatch(panel, /GET[\s\S]*\/api\/assets\/visibility/);
  assert.equal((panel.match(/\/api\/assets\/summary/g) ?? []).length, 1);
});

test("visibility schema is migrated once instead of created on every request", () => {
  const route = read("src/app/api/assets/visibility/route.ts");
  const migration = read(
    "prisma/migrations/20260722233000_add_asset_visibility_preferences/migration.sql",
  );

  assert.doesNotMatch(route, /CREATE TABLE/);
  assert.doesNotMatch(route, /CREATE INDEX/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS asset_visibility_preferences/);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS idx_asset_visibility_user/);
});

test("declarations uses the shared protected data cache", () => {
  const page = read("src/app/(protected)/declaraciones/page.tsx");

  assert.match(page, /httpClient<ApiResponse<TaxSummary>>/);
  assert.doesNotMatch(page, /cache: "no-store"/);
});

test("main workflow links preserve the client cache across navigation", () => {
  const importsPage = read("src/app/(protected)/importaciones/page.tsx");
  const obligationsPage = read("src/components/crypto-first/CryptoFirstModulePage.tsx");

  assert.match(importsPage, /import Link from "next\/link"/);
  assert.match(importsPage, /<Link href="\/cryptoactivos"/);
  assert.doesNotMatch(importsPage, /<a href="\/cryptoactivos"/);
  assert.match(obligationsPage, /import Link from "next\/link"/);
  assert.doesNotMatch(obligationsPage, /<a\s+href=\{href\}/);
});
