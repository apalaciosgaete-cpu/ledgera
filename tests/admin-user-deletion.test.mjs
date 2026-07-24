import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("deleted identities are excluded from the administrator user list", () => {
  const repository = read("src/modules/identity/infrastructure/userRepository.ts");

  assert.match(repository, /ANONYMIZED_EMAIL_SUFFIX/);
  assert.match(repository, /email:\s*\{ endsWith: ANONYMIZED_EMAIL_SUFFIX \}/);
});

test("administrator deletion anonymizes accounts without physical row deletion", () => {
  const repository = read("src/modules/identity/infrastructure/userRepository.ts");

  assert.match(repository, /export async function deleteUser/);
  assert.match(repository, /prisma\.users\.updateMany/);
  assert.doesNotMatch(repository, /prisma\.users\.delete\s*\(/);
  assert.match(repository, /"already_deleted"/);
  assert.match(repository, /full_name:\s*"Cuenta eliminada"/);
});

test("administrator deletion is idempotent and revokes active sessions", () => {
  const route = read("src/app/api/admin/users/[id]/route.ts");

  assert.match(route, /deletionResult === "already_deleted"/);
  assert.match(route, /deleteSessionsByUserId\(id\)/);
  assert.match(route, /deletionMode: "anonymized"/);
});

test("production users table includes every Prisma onboarding column", () => {
  const migration = read(
    "prisma/migrations/20260724130000_sync_users_onboarding_columns/migration.sql",
  );

  for (const column of [
    "onboardingCompleted",
    "onboardingData",
    "activatedAt",
    "activationSource",
  ]) {
    assert.match(migration, new RegExp(`ADD COLUMN IF NOT EXISTS "${column}"`));
  }
});
