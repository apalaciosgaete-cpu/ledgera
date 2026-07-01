import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (filePath) => fs.readFileSync(filePath, "utf8");

test("IGC engine is versioned and contains AT2026 SII brackets", () => {
  const source = read("src/modules/tax/domain/globalComplementaryTax.ts");

  assert.ok(source.includes("DEFAULT_GLOBAL_COMPLEMENTARY_TAX_YEAR = 2026"));
  assert.ok(source.includes("toClpInclusive: 11_265_804"));
  assert.ok(source.includes("fromClpInclusive: 11_265_805"));
  assert.ok(source.includes("deductionClp: 450_632.16"));
  assert.ok(source.includes("fromClpInclusive: 258_696_241"));
  assert.ok(source.includes("deductionClp: 32_395_445.28"));
});

test("tax policy delegates habitual person calculation to IGC engine", () => {
  const source = read("src/modules/tax/domain/taxPolicy.ts");

  assert.ok(source.includes("calculateApplicableTaxClp"));
  assert.ok(source.includes("calculateGlobalComplementaryTax"));
  assert.ok(source.includes("No usar como tasa plana"));
});
