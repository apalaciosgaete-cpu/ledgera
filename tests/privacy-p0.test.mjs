import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("users listing is restricted to admins", () => {
  const source = read("src/app/api/users/route.ts");

  assert.match(source, /requireAdmin\(request\)/);
  assert.match(source, /isApiAuthError/);
  assert.match(source, /apiAuthErrorResponse/);
});

test("Buda connector derives user id from authenticated actor", () => {
  const source = read("src/app/api/connectors/buda/route.ts");

  assert.match(source, /requireApiUser\(request\)/);
  assert.match(source, /const userId = actor\.id/);
  assert.doesNotMatch(source, /body\.userId/);
  assert.doesNotMatch(source, /userId\?: string/);
});

test("TOTP setup stores protected seed and verifiers open it before use", () => {
  const setup = read("src/app/api/2fa/registration/setup/route.ts");
  const registrationVerify = read("src/app/api/2fa/registration/verify/route.ts");
  const login = read("src/app/api/2fa/login/route.ts");
  const validate = read("src/app/api/2fa/validate/route.ts");
  const verify = read("src/app/api/2fa/verify/route.ts");
  const disable = read("src/app/api/2fa/disable/route.ts");

  assert.match(setup, /sealTotpSeed\(seed\)/);
  assert.match(registrationVerify, /openTotpSeed\(user\.twoFactorSecret\)/);
  assert.match(login, /openTotpSeed\(user\.twoFactorSecret\)/);
  assert.match(validate, /openTotpSeed\(user\.twoFactorSecret\)/);
  assert.match(verify, /openTotpSeed\(user\.twoFactorSecret\)/);
  assert.match(disable, /openTotpSeed\(user\.twoFactorSecret\)/);
});

test("user repository includes stored 2FA fields", () => {
  const source = read("src/modules/identity/infrastructure/userRepository.ts");

  assert.match(source, /twoFactorSecret:\s+true/);
  assert.match(source, /twoFactorEnabled:\s+true/);
  assert.match(source, /twoFactorSecret:\s+row\.twoFactorSecret/);
  assert.match(source, /twoFactorEnabled:\s+row\.twoFactorEnabled/);
});
