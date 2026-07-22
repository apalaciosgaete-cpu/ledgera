import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("account deletion reads only the identity fields required for closure", async () => {
  const route = await source("src/app/api/user/account/route.ts");

  assert.match(route, /findUnique\(\{[\s\S]*?where: \{ id: userId \},[\s\S]*?select:/);
  assert.match(route, /id: true/);
  assert.match(route, /email: true/);
  assert.match(route, /status: true/);
  assert.doesNotMatch(route, /select: \{[\s\S]*?onboardingData:/);
});

test("account deletion still anonymizes identity, revokes sessions and records erasure", async () => {
  const route = await source("src/app/api/user/account/route.ts");

  assert.match(route, /status: "deleted"/);
  assert.match(route, /eliminado\+\$\{userId\}@anonimizado\.ledgera\.cl/);
  assert.match(route, /deleteSessionsByUserId\(userId\)/);
  assert.match(route, /type: "ERASURE"/);
  assert.match(route, /event: "account_deleted"/);
});
