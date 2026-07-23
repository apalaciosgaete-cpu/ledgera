import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

function loadAssistantEngine() {
  const sourcePath = path.join(process.cwd(), "src", "components", "support", "assistantEngine.ts");
  const source = fs.readFileSync(sourcePath, "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  }).outputText;

  const module = { exports: {} };
  vm.runInNewContext(javascript, {
    module,
    exports: module.exports,
    require,
    console,
    Intl,
    Date,
    Map,
    Set,
    RegExp,
    Math,
  });
  return module.exports;
}

const engine = loadAssistantEngine();

test("recognizes natural Spanish variants for starting", () => {
  for (const question of [
    "donde empiezo",
    "¿Dónde debo empezar?",
    "por donde parto",
    "qué hago primero",
    "no sé qué hacer",
  ]) {
    const result = engine.detectAssistantIntent(question);
    assert.equal(result.intent, "START", question);
    assert.ok(result.confidence >= 0.9, question);
  }
});

test("recognizes product-purpose questions independently", () => {
  for (const question of [
    "para que sirve ledgera?",
    "¿Qué es LEDGERA?",
    "que hace ledgera",
    "cómo funciona ledgera",
  ]) {
    const result = engine.detectAssistantIntent(question);
    assert.equal(result.intent, "PRODUCT", question);
    assert.ok(result.confidence >= 0.9, question);
  }
});

test("returns different answers for start and product questions on the landing", () => {
  const startReply = engine.buildAssistantReply({
    input: "donde empiezo",
    pathname: "/",
    isAuthenticated: false,
    context: null,
  });
  const productReply = engine.buildAssistantReply({
    input: "para que sirve ledgera?",
    pathname: "/",
    isAuthenticated: false,
    context: null,
  });

  assert.equal(startReply.intent, "START");
  assert.equal(productReply.intent, "PRODUCT");
  assert.notEqual(startReply.text, productReply.text);
  assert.match(startReply.text, /Empieza creando una cuenta/i);
  assert.match(productReply.text, /transforma operaciones de exchanges/i);
});

test("unknown replies never expose internal route strings", () => {
  const reply = engine.buildAssistantReply({
    input: "consulta completamente ajena",
    pathname: "/login",
    isAuthenticated: false,
    context: null,
  });

  assert.equal(reply.intent, "UNKNOWN");
  assert.doesNotMatch(reply.text, /\/login/);
  assert.match(reply.text, /acceso a la cuenta/i);
});
