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
    require: (specifier) => {
      if (specifier === "@/modules/billing/domain/coupons") {
      return {
        calculateCouponDiscount: (coupon, amount) => {
          if (coupon.type === "PERCENTAGE") return Math.round((amount * coupon.value) / 100);
          return Math.min(Math.round(coupon.value), amount);
        },
      };
    }

    if (specifier === "@/modules/billing/infrastructure/couponRepository") {
        return {
          findCouponByCode: async (code) => {
            const normalized = code.toUpperCase();
            if (normalized === "LANZAMIENTO50") {
              return {
                id: "c1",
                code: "LANZAMIENTO50",
                name: "Lanzamiento 50%",
                type: "PERCENTAGE",
                value: 50,
                maxRedemptions: null,
                currentRedemptions: 0,
                validFrom: new Date("2020-01-01"),
                validUntil: null,
                applicablePlans: ["PROFESIONAL"],
                status: "ACTIVE",
              };
            }
            if (normalized === "FIJO5000") {
              return {
                id: "c2",
                code: "FIJO5000",
                name: "Descuento fijo",
                type: "FIXED_AMOUNT",
                value: 5000,
                maxRedemptions: null,
                currentRedemptions: 0,
                validFrom: new Date("2020-01-01"),
                validUntil: null,
                applicablePlans: [],
                status: "ACTIVE",
              };
            }
            if (normalized === "EXPIRADO") {
              return {
                id: "c3",
                code: "EXPIRADO",
                type: "PERCENTAGE",
                value: 50,
                status: "EXPIRED",
                validFrom: new Date("2020-01-01"),
                applicablePlans: [],
              };
            }
            if (normalized === "DESHABILITADO") {
              return {
                id: "c4",
                code: "DESHABILITADO",
                type: "PERCENTAGE",
                value: 50,
                status: "DISABLED",
                validFrom: new Date("2020-01-01"),
                applicablePlans: [],
              };
            }
            if (normalized === "LIMITADO") {
              return {
                id: "c5",
                code: "LIMITADO",
                type: "PERCENTAGE",
                value: 50,
                status: "ACTIVE",
                maxRedemptions: 1,
                currentRedemptions: 1,
                validFrom: new Date("2020-01-01"),
                applicablePlans: [],
              };
            }
            if (normalized === "PERSONAL") {
              return {
                id: "c6",
                code: "PERSONAL",
                type: "PERCENTAGE",
                value: 50,
                status: "ACTIVE",
                validFrom: new Date("2020-01-01"),
                applicablePlans: ["PERSONAL"],
              };
            }
            if (normalized === "FUTURO") {
              return {
                id: "c7",
                code: "FUTURO",
                type: "PERCENTAGE",
                value: 50,
                status: "ACTIVE",
                validFrom: new Date("2030-01-01"),
                applicablePlans: [],
              };
            }
            return null;
          },
        };
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(compiled, context, { filename: relativePath });

  return context.module.exports;
}

const { validateCoupon } = loadTsModule("src/modules/billing/application/validateCoupon.ts");

test("validates active percentage coupon", async () => {
  const result = await validateCoupon({ code: "LANZAMIENTO50", plan: "PROFESIONAL", amount: 29990 });

  assert.equal(result.valid, true);
  assert.equal(result.discountAmount, 14995);
  assert.equal(result.finalAmount, 14995);
});

test("validates fixed amount coupon", async () => {
  const result = await validateCoupon({ code: "FIJO5000", plan: "EMPRESA", amount: 59990 });

  assert.equal(result.valid, true);
  assert.equal(result.discountAmount, 5000);
  assert.equal(result.finalAmount, 54990);
});

test("rejects expired coupon", async () => {
  const result = await validateCoupon({ code: "EXPIRADO", plan: "PROFESIONAL", amount: 29990 });

  assert.equal(result.valid, false);
  assert.match(result.message, /expirado/i);
});

test("rejects disabled coupon", async () => {
  const result = await validateCoupon({ code: "DESHABILITADO", plan: "PROFESIONAL", amount: 29990 });

  assert.equal(result.valid, false);
  assert.match(result.message, /deshabilitado/i);
});

test("rejects coupon with max redemptions reached", async () => {
  const result = await validateCoupon({ code: "LIMITADO", plan: "PROFESIONAL", amount: 29990 });

  assert.equal(result.valid, false);
  assert.match(result.message, /límite/i);
});

test("rejects coupon not applicable to plan", async () => {
  const result = await validateCoupon({ code: "PERSONAL", plan: "PROFESIONAL", amount: 29990 });

  assert.equal(result.valid, false);
  assert.match(result.message, /no aplica/i);
});

test("rejects not yet valid coupon", async () => {
  const result = await validateCoupon({ code: "FUTURO", plan: "PROFESIONAL", amount: 29990 });

  assert.equal(result.valid, false);
  assert.match(result.message, /vigente/i);
});

test("coupon validation API route exists", () => {
  const source = read("src/app/api/billing/coupons/validate/route.ts");

  assert.match(source, /validateCoupon/);
  assert.match(source, /coupon_validated/);
});

test("coupon admin API route exists and protects admin access", () => {
  const source = read("src/app/api/billing/coupons/route.ts");

  assert.match(source, /listCoupons/);
  assert.match(source, /createCoupon/);
  assert.match(source, /role === "admin"/);
  assert.match(source, /super_admin/);
});

test("coupon domain defines types and discount calculation", () => {
  const source = read("src/modules/billing/domain/coupons.ts");

  assert.match(source, /PERCENTAGE/);
  assert.match(source, /FIXED_AMOUNT/);
  assert.match(source, /calculateCouponDiscount/);
});
