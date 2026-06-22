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

const domain = loadTsModule("src/modules/documents/domain/document.ts");

test("Document categories are defined", () => {
  assert.equal(domain.DOCUMENT_CATEGORIES.length, 9);
  assert.ok(domain.DOCUMENT_CATEGORIES.includes("TAX"));
  assert.ok(domain.DOCUMENT_CATEGORIES.includes("DTE"));
  assert.ok(domain.DOCUMENT_CATEGORIES.includes("SII"));
  assert.ok(domain.DOCUMENT_CATEGORIES.includes("BILLING"));
  assert.ok(domain.DOCUMENT_CATEGORIES.includes("AUDIT"));
  assert.ok(domain.DOCUMENT_CATEGORIES.includes("TASK"));
  assert.ok(domain.DOCUMENT_CATEGORIES.includes("REPORT"));
  assert.ok(domain.DOCUMENT_CATEGORIES.includes("LEGAL"));
  assert.ok(domain.DOCUMENT_CATEGORIES.includes("OTHER"));
});

test("Document types are defined", () => {
  assert.equal(domain.DOCUMENT_TYPES.length, 7);
  assert.ok(domain.DOCUMENT_TYPES.includes("PDF"));
  assert.ok(domain.DOCUMENT_TYPES.includes("XML"));
  assert.ok(domain.DOCUMENT_TYPES.includes("CSV"));
  assert.ok(domain.DOCUMENT_TYPES.includes("XLSX"));
  assert.ok(domain.DOCUMENT_TYPES.includes("JSON"));
  assert.ok(domain.DOCUMENT_TYPES.includes("TXT"));
  assert.ok(domain.DOCUMENT_TYPES.includes("IMAGE"));
});

test("Document statuses are defined", () => {
  assert.equal(domain.DOCUMENT_STATUSES.length, 3);
  assert.ok(domain.DOCUMENT_STATUSES.includes("ACTIVE"));
  assert.ok(domain.DOCUMENT_STATUSES.includes("ARCHIVED"));
  assert.ok(domain.DOCUMENT_STATUSES.includes("DELETED"));
});

test("Validators accept valid values", () => {
  assert.equal(domain.isValidDocumentCategory("TAX"), true);
  assert.equal(domain.isValidDocumentType("PDF"), true);
  assert.equal(domain.isValidDocumentStatus("ACTIVE"), true);
});

test("Validators reject invalid values", () => {
  assert.equal(domain.isValidDocumentCategory("INVALID"), false);
  assert.equal(domain.isValidDocumentType("DOC"), false);
  assert.equal(domain.isValidDocumentStatus("PENDING"), false);
});

test("documentTypeFromMimeType maps common mime types", () => {
  assert.equal(domain.documentTypeFromMimeType("application/pdf"), "PDF");
  assert.equal(domain.documentTypeFromMimeType("application/xml"), "XML");
  assert.equal(domain.documentTypeFromMimeType("text/csv"), "CSV");
  assert.equal(domain.documentTypeFromMimeType("application/json"), "JSON");
  assert.equal(domain.documentTypeFromMimeType("text/plain"), "TXT");
  assert.equal(domain.documentTypeFromMimeType("image/png"), "IMAGE");
  assert.ok(domain.DOCUMENT_TYPES.includes(domain.documentTypeFromMimeType("application/unknown")));
});

test("documentTypeFromFileName maps common extensions", () => {
  assert.equal(domain.documentTypeFromFileName("report.pdf"), "PDF");
  assert.equal(domain.documentTypeFromFileName("dte.xml"), "XML");
  assert.equal(domain.documentTypeFromFileName("data.csv"), "CSV");
  assert.equal(domain.documentTypeFromFileName("book.xlsx"), "XLSX");
  assert.equal(domain.documentTypeFromFileName("config.json"), "JSON");
  assert.equal(domain.documentTypeFromFileName("notes.txt"), "TXT");
  assert.equal(domain.documentTypeFromFileName("photo.jpg"), "IMAGE");
  assert.ok(domain.DOCUMENT_TYPES.includes(domain.documentTypeFromFileName("unknown")));
});

test("Document interface is defined", () => {
  const source = read("src/modules/documents/domain/document.ts");

  assert.match(source, /interface Document/);
  assert.match(source, /storageKey/);
  assert.match(source, /checksum/);
  assert.match(source, /relatedEntityType/);
  assert.match(source, /uploadedBy/);
});
