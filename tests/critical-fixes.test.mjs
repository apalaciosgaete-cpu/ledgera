import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

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
    require: (specifier) => {
      if (specifier === "node:crypto") return crypto;
      if (specifier === "crypto") return crypto;
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(compiled, context, { filename: relativePath });

  return context.module.exports;
}

test("fx service uses mindicador cache and has no fixed 950 fallback", () => {
  const source = read("src/services/fxRateService.ts");

  assert.match(source, /mindicador\.cl\/api\/dolar/);
  assert.match(source, /prisma\.fxRate\.upsert/);
  assert.doesNotMatch(source, /return\s+950\b/);
});

test("tax classification marks SELL and SWAP as capital gain", () => {
  const { TaxClassificationService } = loadTsModule(
    "src/services/taxClassificationService.ts",
  );

  assert.equal(TaxClassificationService.classify("SELL"), "CAPITAL_GAIN");
  assert.equal(TaxClassificationService.classify("SWAP"), "CAPITAL_GAIN");
  assert.equal(TaxClassificationService.classify("BUY"), "NON_TAXABLE");
});

test("auth.js route and dependencies are present", () => {
  const packageJson = JSON.parse(read("package.json"));

  assert.match(read("src/app/api/auth/[...nextauth]/route.ts"), /NextAuth/);
  assert.ok(packageJson.dependencies["next-auth"]);
  assert.ok(packageJson.dependencies["@auth/prisma-adapter"]);
  assert.ok(packageJson.dependencies.bcrypt);
  assert.equal(packageJson.dependencies.bcryptjs, undefined);
});

test("stable stack pins Next 14, React 18, and Tailwind 3", () => {
  const packageJson = JSON.parse(read("package.json"));

  assert.match(packageJson.dependencies.next, /^(\^)?14\./);
  assert.match(packageJson.dependencies.react, /^(\^)?18\./);
  assert.match(packageJson.dependencies["react-dom"], /^(\^)?18\./);
  assert.match(packageJson.devDependencies.tailwindcss, /^(\^)?3\./);
  assert.equal(packageJson.devDependencies["@tailwindcss/postcss"], undefined);
});

test("buda connector signs requests with HMAC-SHA384", () => {
  const { BudaConnector } = loadTsModule(
    "src/services/connectors/budaConnector.ts",
  );
  const connector = new BudaConnector({
    apiKey: "key",
    apiSecret: "secret",
  });
  const expected = crypto
    .createHmac("sha384", "secret")
    .update("GET /balances 123")
    .digest("hex");

  assert.equal(connector.generateSignature("GET", "/balances", "123"), expected);
});
