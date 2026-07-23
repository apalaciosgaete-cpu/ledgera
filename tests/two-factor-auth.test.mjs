import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

test("2FA uses the maintained OTPAuth implementation through one validator", () => {
  const packageJson = JSON.parse(read("package.json"));
  const helper = read("src/modules/identity/application/twoFactorTotp.ts");

  assert.equal(packageJson.dependencies.otpauth, "9.5.1");
  assert.equal(packageJson.dependencies.speakeasy, undefined);
  assert.match(helper, /new OTPAuth\.TOTP/);
  assert.match(helper, /TOTP_VALIDATION_WINDOW = 2/);

  for (const routePath of [
    "src/app/api/2fa/login/route.ts",
    "src/app/api/2fa/registration/verify/route.ts",
    "src/app/api/2fa/disable/route.ts",
    "src/app/api/2fa/validate/route.ts",
    "src/app/api/2fa/verify/route.ts",
    "src/app/api/2fa/recovery/verify/route.ts",
    "src/app/api/admin/reauth/route.ts",
  ]) {
    const source = read(routePath);
    assert.match(source, /validateTwoFactorCode/);
    assert.doesNotMatch(source, /speakeasy/);
  }
});

test("malformed or undecryptable stored 2FA seeds fail explicitly", () => {
  const source = read(
    "src/modules/identity/application/twoFactorSecret.ts",
  );

  assert.match(source, /LEGACY_BASE32_FORMAT/);
  assert.match(source, /Formato de semilla TOTP almacenada inválido/);
  assert.match(source, /throw new Error\("No se pudo descifrar/);
});

test("2FA recovery keeps the active seed until the pending authenticator is verified", () => {
  const setup = read("src/app/api/2fa/recovery/setup/route.ts");
  const verify = read("src/app/api/2fa/recovery/verify/route.ts");
  const recovery = read(
    "src/modules/identity/application/twoFactorRecovery.ts",
  );

  assert.match(setup, /prepareTwoFactorRecovery/);
  assert.doesNotMatch(setup, /prisma\.users\.update/);
  assert.match(recovery, /pendingSecret/);
  assert.match(recovery, /replaceOneTimeTokenIdentifier/);

  const consumeIndex = verify.indexOf("consumeTwoFactorRecovery");
  const replaceIndex = verify.indexOf("twoFactorSecret: encryptTwoFactorSecret");
  assert.ok(consumeIndex >= 0);
  assert.ok(replaceIndex > consumeIndex);
});
