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

function loadTsModule(relativePath) {
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
    require: () => {
      throw new Error("Unexpected require");
    },
  };

  vm.runInNewContext(compiled, context, { filename: relativePath });

  return context.module.exports;
}

const { validateRut, formatRut } = loadTsModule("src/modules/tax/application/validateRut.ts");

test("validates correct RUT with dots", () => {
  const result = validateRut("12.345.678-5");
  assert.equal(result.valid, true);
  assert.equal(result.normalized, "12.345.678-5");
});

test("validates correct RUT without dots", () => {
  const result = validateRut("12345678-5");
  assert.equal(result.valid, true);
  assert.equal(result.normalized, "12.345.678-5");
});

test("validates RUT with K digit verifier", () => {
  const result = validateRut("7.123.456-K");
  assert.equal(result.valid, false);
});

test("rejects RUT with invalid digit verifier", () => {
  const result = validateRut("12.345.678-9");
  assert.equal(result.valid, false);
});

test("rejects incomplete RUT", () => {
  const result = validateRut("12345");
  assert.equal(result.valid, false);
});

test("formatRut normalizes to dotted format", () => {
  assert.equal(formatRut("12345678-5"), "12.345.678-5");
  assert.equal(formatRut("12345678-5"), "12.345.678-5");
});
