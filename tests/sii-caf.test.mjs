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

test("CAF API route supports GET and POST", () => {
  const source = read("src/app/api/sii/caf/route.ts");

  assert.match(source, /getSessionFromRequest/);
  assert.match(source, /export async function GET/);
  assert.match(source, /export async function POST/);
  assert.match(source, /caf_uploaded/);
});

test("SiiCaf repository exposes createCaf, listCafs and getActiveCaf", () => {
  const source = read("src/modules/sii/infrastructure/siiCafRepository.ts");

  assert.match(source, /createCaf/);
  assert.match(source, /listCafs/);
  assert.match(source, /getActiveCaf/);
  assert.match(source, /reserveNextFolio/);
});

test("createCaf builds active CAF with currentFolio equals folioStart", async () => {
  const repository = loadTsModule(
    "src/modules/sii/infrastructure/siiCafRepository.ts",
    {
      "@/lib/prisma": {
        prisma: {
          siiCaf: {
            create: async (args) => ({
              id: "caf-1",
              ...args.data,
              uploadedAt: new Date("2026-01-01"),
            }),
          },
        },
      },
    },
  );

  const caf = await repository.createCaf({
    documentType: "33",
    folioStart: 1000,
    folioEnd: 5000,
  });

  assert.equal(caf.documentType, "33");
  assert.equal(caf.folioStart, 1000);
  assert.equal(caf.folioEnd, 5000);
  assert.equal(caf.currentFolio, 1000);
  assert.equal(caf.isActive, true);
});
