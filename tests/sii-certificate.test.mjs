import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function loadTsModule(relativePath, mocks = {}) {
  const source = read(relativePath);
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

  const exports = {};
  const context = {
    exports,
    module: { exports },
    require: (specifier) => {
      if (mocks[specifier]) return mocks[specifier];
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(compiled, context, { filename: relativePath });
  return context.module.exports;
}

test("validateCertificate returns valid for future expiry", async () => {
  const { validateCertificate } = loadTsModule(
    "src/modules/sii/application/validateCertificate.ts",
    {
      "@/modules/audit/application/recordAuditEvent": {
        recordAuditEvent: async () => {},
      },
    },
  );

  const future = new Date();
  future.setDate(future.getDate() + 30);

  const result = await validateCertificate({
    id: "cred-1",
    environment: "CERTIFICACION",
    issuerRut: "76.123.456-7",
    certificateName: "cert.p12",
    certificatePath: "/tmp/cert.p12",
    certificateExpires: future,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.equal(result.valid, true);
  assert.equal(result.expiresAt.getTime(), future.getTime());
});

test("validateCertificate returns invalid for expired certificate", async () => {
  const { validateCertificate } = loadTsModule(
    "src/modules/sii/application/validateCertificate.ts",
    {
      "@/modules/audit/application/recordAuditEvent": {
        recordAuditEvent: async () => {},
      },
    },
  );

  const past = new Date();
  past.setDate(past.getDate() - 1);

  const result = await validateCertificate({
    id: "cred-1",
    environment: "CERTIFICACION",
    issuerRut: "76.123.456-7",
    certificateName: "cert.p12",
    certificatePath: "/tmp/cert.p12",
    certificateExpires: past,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.equal(result.valid, false);
});

test("validateCertificate returns invalid for inactive credential", async () => {
  const { validateCertificate } = loadTsModule(
    "src/modules/sii/application/validateCertificate.ts",
    {
      "@/modules/audit/application/recordAuditEvent": {
        recordAuditEvent: async () => {},
      },
    },
  );

  const future = new Date();
  future.setDate(future.getDate() + 30);

  const result = await validateCertificate({
    id: "cred-1",
    environment: "CERTIFICACION",
    issuerRut: "76.123.456-7",
    certificateName: "cert.p12",
    certificatePath: "/tmp/cert.p12",
    certificateExpires: future,
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.equal(result.valid, false);
});

test("SII credential repository exposes getActiveCredential and createCredential", () => {
  const source = read("src/modules/sii/infrastructure/siiCredentialRepository.ts");

  assert.match(source, /getActiveCredential/);
  assert.match(source, /createCredential/);
  assert.match(source, /listCredentials/);
});

test("signXml fails closed while real certificate signing is unavailable", async () => {
  let auditEvent = null;
  const { signXml } = loadTsModule("src/modules/sii/application/signXml.ts", {
    "@/modules/audit/application/recordAuditEvent": {
      recordAuditEvent: async (event) => {
        auditEvent = event;
      },
    },
  });

  const result = await signXml("<DTE></DTE>");

  assert.equal(result.signed, false);
  assert.match(result.xml, /PENDING_SIGNATURE/);
  assert.equal(auditEvent.event, "xml_sign_placeholder");
  assert.equal(auditEvent.result, "PARTIAL");
});
