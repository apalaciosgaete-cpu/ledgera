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

function loadTsModule(relativePath, customRequire) {
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
    require:
      customRequire ??
      ((specifier) => {
        throw new Error(`Unexpected require: ${specifier}`);
      }),
  };

  vm.runInNewContext(compiled, context, { filename: relativePath });

  return context.module.exports;
}

function loadPureModule(relativePath) {
  return loadTsModule(relativePath, (specifier) => {
    if (specifier.startsWith("@/")) {
      throw new Error(
        `Module ${relativePath} should not import ${specifier} in pure tests`,
      );
    }

    throw new Error(`Unexpected require: ${specifier}`);
  });
}

// ─── 1. Plan features ─────────────────────────────────────────────────────────

test("planFeatures normalizes legacy plans and resolves access", () => {
  const {
    normalizePlan,
    canAccessFeature,
    requiredPlanForFeature,
    getPlanLabel,
    Plan,
    Feature,
  } = loadPureModule("src/modules/subscription/domain/planFeatures.ts");

  assert.equal(normalizePlan("BASICO"), Plan.FREE);
  assert.equal(normalizePlan("BASIC"), Plan.FREE);
  assert.equal(normalizePlan("FREE"), Plan.FREE);
  assert.equal(normalizePlan("PERSONAL"), Plan.PERSONAL);
  assert.equal(normalizePlan("PROFESIONAL"), Plan.PROFESIONAL);
  assert.equal(normalizePlan("EMPRESA"), Plan.PROFESIONAL);
  assert.equal(normalizePlan("PRO"), Plan.PROFESIONAL);
  assert.equal(normalizePlan(null), Plan.FREE);
  assert.equal(normalizePlan("desconocido"), Plan.FREE);

  assert.equal(canAccessFeature("BASICO", Feature.SII_STATUS), true);
  assert.equal(canAccessFeature("BASICO", Feature.PDF_EXPORT), false);
  assert.equal(canAccessFeature("PERSONAL", Feature.PDF_EXPORT), true);
  assert.equal(canAccessFeature("EMPRESA", Feature.EXPERT_MODE), true);

  assert.equal(requiredPlanForFeature(Feature.SII_STATUS), Plan.FREE);
  assert.equal(requiredPlanForFeature(Feature.PDF_EXPORT), Plan.PERSONAL);
  assert.equal(requiredPlanForFeature(Feature.EXPERT_MODE), Plan.PROFESIONAL);

  assert.equal(getPlanLabel("BASICO"), "Gratuito");
  assert.equal(getPlanLabel("PERSONAL"), "Personal");
  assert.equal(getPlanLabel("EMPRESA"), "Profesional");
});

// ─── 2. Subscription state resolver ───────────────────────────────────────────

test("resolveSubscriptionState covers all portal-relevant states", () => {
  const planFeatures = loadPureModule(
    "src/modules/subscription/domain/planFeatures.ts",
  );
  const { resolveSubscriptionState } = loadTsModule(
    "src/modules/subscription/application/resolveSubscriptionState.ts",
    (specifier) => {
      if (specifier === "@/modules/subscription/domain/planFeatures") {
        return planFeatures;
      }

      throw new Error(`Unexpected require: ${specifier}`);
    },
  );

  const admin = resolveSubscriptionState({
    role: "admin",
    subscriptionPlan: "BASICO",
  });
  assert.equal(admin.state, "ADMIN");
  assert.equal(admin.isActive, true);

  const active = resolveSubscriptionState({
    role: "personal",
    status: "active",
    subscriptionPlan: "EMPRESA",
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  assert.equal(active.state, "ACTIVE");
  assert.equal(active.isActive, true);

  const warning = resolveSubscriptionState({
    role: "personal",
    status: "active",
    subscriptionPlan: "EMPRESA",
    subscriptionExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  });
  assert.equal(warning.state, "WARNING");
  assert.equal(warning.isActive, true);

  const expired = resolveSubscriptionState({
    role: "personal",
    status: "active",
    subscriptionPlan: "EMPRESA",
    subscriptionExpiresAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  });
  assert.equal(expired.state, "EXPIRED");
  assert.equal(expired.isActive, false);
  assert.equal(expired.isBlocked, true);

  const suspended = resolveSubscriptionState({
    role: "personal",
    status: "suspended",
    subscriptionPlan: "EMPRESA",
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  assert.equal(suspended.state, "SUSPENDED");
  assert.equal(suspended.isActive, false);
  assert.equal(suspended.isBlocked, true);

  const inactive = resolveSubscriptionState({
    role: "personal",
    status: "active",
    subscriptionPlan: "EMPRESA",
    subscriptionExpiresAt: null,
  });
  assert.equal(inactive.state, "INACTIVE");
  assert.equal(inactive.isActive, false);
  assert.equal(inactive.isBlocked, true);

  const free = resolveSubscriptionState({
    role: "personal",
    status: "active",
    subscriptionPlan: "BASICO",
    subscriptionExpiresAt: null,
  });
  assert.equal(free.state, "ACTIVE");
  assert.equal(free.isActive, true);
});

// ─── 3. Service contracts ─────────────────────────────────────────────────────

test("reactivateSubscription service supports payment-required reactivation", () => {
  const source = read("src/modules/billing/application/reactivateSubscription.ts");

  assert.match(source, /export async function reactivateSubscription/);
  assert.match(source, /status: "reactivated" | "payment_required" | "ignored"/);
  assert.match(source, /createPendingPayment/);
  assert.match(source, /CANCEL_AT_PERIOD_END/);
  assert.match(source, /EXPIRED/);
  assert.match(source, /FAILED/);
  assert.match(source, /portalVersion: "4\.3\.01"/);
});

test("changePlan service handles immediate downgrade and paid changes", () => {
  const source = read("src/modules/billing/application/changePlan.ts");

  assert.match(source, /export async function changePlan/);
  assert.match(source, /type: "immediate"/);
  assert.match(source, /type: "payment_required"/);
  assert.match(source, /targetPlan === "BASICO"/);
  assert.match(source, /createPendingPayment/);
  assert.match(source, /isUpgrade/);
  assert.match(source, /isDowngrade/);
});

test("activateSubscriptionFromPayment resolves plan from metadata", () => {
  const source = read("src/modules/billing/application/activateSubscription.ts");

  assert.match(source, /function resolvePlanFromPayment/);
  assert.match(source, /metadata\?\.plan/);
  assert.match(source, /previousMetadata/);
});

// ─── 4. Route contracts ───────────────────────────────────────────────────────

const ROUTES = [
  {
    path: "src/app/api/billing/reactivate/route.ts",
    checks: [
      /export async function POST/,
      /reactivateSubscription\(/,
      /No autorizado/,
      /paymentId: result\.paymentId/,
    ],
  },
  {
    path: "src/app/api/billing/change-plan/route.ts",
    checks: [
      /export async function POST/,
      /changePlan\(/,
      /No autorizado/,
      /Plan inválido/,
      /plan !== "BASICO"/,
      /checkout externo/,
      /subscriptionId:/,
    ],
  },
  {
    path: "src/app/api/billing/payments/\[id\]/confirm/route.ts",
    checks: [
      /export async function POST/,
      /activateSubscriptionFromPayment\(/,
      /No autorizado/,
      /Pago no encontrado/,
      /El pago ya fue procesado/,
    ],
  },
];

for (const route of ROUTES) {
  test(`${route.path} route is implemented`, () => {
    const source = read(route.path);

    for (const check of route.checks) {
      assert.match(source, check);
    }
  });
}

// ─── 5. UI contracts ──────────────────────────────────────────────────────────

test("SubscriptionPortalPanel shows reactivate button for expired/cancelled/failed", () => {
  const source = read("src/components/billing/SubscriptionPortalPanel.tsx");

  assert.match(source, /createBillingReactivate/);
  assert.match(source, /Reactivar suscripción/);
  assert.match(source, /EXPIRED/);
  assert.match(source, /CANCELLED/);
  assert.match(source, /FAILED/);
});

test("PlanComparison uses change-plan for authenticated users", () => {
  const source = read("src/components/subscription/PlanComparison.tsx");

  assert.match(source, /action=\{action\}/);
  assert.match(source, /isAuthenticated \? "change-plan" : "checkout"/);
});

test("BillingCheckoutButton supports change-plan action", () => {
  const source = read("src/components/billing/BillingCheckoutButton.tsx");

  assert.match(source, /action\?: BillingAction/);
  assert.match(source, /createBillingChangePlan/);
  assert.match(source, /action === "change-plan"/);
});

test("billingClient exports reactivate, change-plan and confirm helpers", () => {
  const source = read("src/modules/billing/client/billingClient.ts");

  assert.match(source, /export async function createBillingChangePlan/);
  assert.match(source, /export async function createBillingReactivate/);
  assert.match(source, /export async function confirmBillingPayment/);
  assert.match(source, /\/api\/billing\/change-plan/);
  assert.match(source, /\/api\/billing\/reactivate/);
  assert.match(source, /\/api\/billing\/payments/);
});
