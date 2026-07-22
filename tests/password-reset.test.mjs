import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("password recovery replaces the placeholder with an integrated form", async () => {
  const page = await source("src/app/forgot-password/page.tsx");
  assert.match(page, /api\/password-reset\/request/);
  assert.match(page, /type="email"/);
  assert.doesNotMatch(page, /Pantalla inicial de recuperación/);
});

test("password reset request is neutral and protected", async () => {
  const route = await source("src/app/api/password-reset/request/route.ts");
  assert.match(route, /enforceCsrfProtection/);
  assert.match(route, /enforceRequestRateLimit/);
  assert.match(route, /NEUTRAL_MESSAGE/);
  assert.match(route, /website/);
});

test("password reset uses expiring one-time tokens and revokes sessions", async () => {
  const flow = await source("src/modules/identity/application/passwordReset.ts");
  const confirm = await source("src/app/api/password-reset/confirm/route.ts");
  assert.match(flow, /30 \* 60 \* 1000/);
  assert.match(confirm, /consumeOneTimeToken/);
  assert.match(confirm, /validatePasswordComplexity/);
  assert.match(confirm, /deleteSessionsByUserId/);
  assert.match(confirm, /recordAuditEvent/);
});
