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

test("reserveNextFolio service returns folio when available", async () => {
  const reserveNextFolio = loadTsModule(
    "src/modules/sii/application/reserveNextFolio.ts",
    {
      "@/modules/sii/infrastructure/siiCafRepository": {
        reserveNextFolio: async () => ({ folio: 100001 }),
      },
      "@/modules/audit/application/recordAuditEvent": {
        recordAuditEvent: async () => {},
      },
    },
  );

  const result = await reserveNextFolio.reserveNextFolio("33");

  assert.equal(result.ok, true);
  assert.equal(result.folio, 100001);
});

test("reserveNextFolio service returns error when CAF exhausted", async () => {
  const reserveNextFolio = loadTsModule(
    "src/modules/sii/application/reserveNextFolio.ts",
    {
      "@/modules/sii/infrastructure/siiCafRepository": {
        reserveNextFolio: async () => null,
      },
      "@/modules/audit/application/recordAuditEvent": {
        recordAuditEvent: async () => {},
      },
    },
  );

  const result = await reserveNextFolio.reserveNextFolio("33");

  assert.equal(result.ok, false);
  assert.match(result.message, /folios/);
});

test("reserveNextFolio emits folio_reserved telemetry", () => {
  const source = read("src/modules/sii/application/reserveNextFolio.ts");

  assert.match(source, /folio_reserved/);
});
