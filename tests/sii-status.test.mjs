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

const domain = loadTsModule("src/modules/sii/domain/sii.ts");

const checkTaxpayerStatus = loadTsModule(
  "src/modules/sii/application/checkTaxpayerStatus.ts",
);

test("SII domain defines environments", () => {
  const source = read("src/modules/sii/domain/sii.ts");

  assert.match(source, /CERTIFICACION/);
  assert.match(source, /PRODUCCION/);
});

test("SII domain defines connection statuses", () => {
  const source = read("src/modules/sii/domain/sii.ts");

  assert.match(source, /CONNECTED/);
  assert.match(source, /DISCONNECTED/);
  assert.match(source, /CERTIFICATE_EXPIRED/);
  assert.match(source, /NOT_CONFIGURED/);
});

test("SII domain defines submission statuses", () => {
  const source = read("src/modules/sii/domain/sii.ts");

  assert.match(source, /XML_GENERATED/);
  assert.match(source, /XML_SIGNED/);
  assert.match(source, /READY_TO_SEND/);
  assert.match(source, /SENT/);
  assert.match(source, /PROCESSING/);
  assert.match(source, /ACCEPTED/);
  assert.match(source, /REJECTED/);
});

test("toSiiDocumentTypeCode maps document types", () => {
  assert.equal(domain.toSiiDocumentTypeCode("FACTURA_ELECTRONICA"), "33");
  assert.equal(domain.toSiiDocumentTypeCode("BOLETA_ELECTRONICA"), "39");
  assert.equal(domain.toSiiDocumentTypeCode("NOTA_CREDITO"), "61");
  assert.equal(domain.toSiiDocumentTypeCode("NOTA_DEBITO"), "56");
  assert.equal(domain.toSiiDocumentTypeCode("UNKNOWN"), null);
});

test("checkTaxpayerStatus returns placeholder CONNECTED", async () => {
  const result = await checkTaxpayerStatus.checkTaxpayerStatus();

  assert.equal(result.status, "CONNECTED");
});

test("SII status API route exists and requires auth", () => {
  const source = read("src/app/api/sii/status/route.ts");

  assert.match(source, /getSessionFromRequest/);
  assert.match(source, /GET/);
  assert.match(source, /getSiiStatus/);
});

test("SII test-connection API route exists and emits telemetry", () => {
  const source = read("src/app/api/sii/test-connection/route.ts");

  assert.match(source, /getSessionFromRequest/);
  assert.match(source, /POST/);
  assert.match(source, /sii_connection_tested/);
});

test("Prisma schema includes SiiCredential and SiiCaf models", () => {
  const source = read("prisma/schema.prisma");

  assert.match(source, /model SiiCredential/);
  assert.match(source, /model SiiCaf/);
  assert.match(source, /sii_credentials/);
  assert.match(source, /sii_cafs/);
});

test("TaxDocument model includes SII submission fields", () => {
  const source = read("prisma/schema.prisma");

  assert.match(source, /trackId/);
  assert.match(source, /submissionStatus/);
});

test("SII integration migration SQL exists", () => {
  const migrations = fs.readdirSync(path.join(root, "prisma/migrations"));
  const siiMigration = migrations.find((m) => m.includes("sii_integration"));

  assert.ok(siiMigration, "No se encontró migración de integración SII");

  const source = read(`prisma/migrations/${siiMigration}/migration.sql`);

  assert.match(source, /sii_credentials/);
  assert.match(source, /sii_cafs/);
  assert.match(source, /track_id/);
  assert.match(source, /submission_status/);
});
