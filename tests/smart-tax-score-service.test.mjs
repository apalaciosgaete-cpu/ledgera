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
      throw new Error(`Unexpected require: ${specifier} in ${relativePath}`);
    },
    console,
  };

  vm.runInNewContext(compiled, context, { filename: relativePath });
  return context.module.exports;
}

const domain = loadTsModule("src/modules/tax-score/domain/smartTaxScore.ts");

function buildServiceMocks(overrides = {}) {
  const prismaMock = {
    portfolioMovement: { count: async () => 0 },
    alert: { count: async () => 0 },
    taxDocument: { groupBy: async () => [] },
    exchangeConnection: { findMany: async () => [] },
    auditEvent: { groupBy: async () => [] },
    smartTaxScore: { findFirst: async () => null },
    ...overrides.prisma,
  };

  return {
    "@/lib/prisma": { prisma: prismaMock },
    "@/modules/alerts/application/createAlert": {
      createAlert: overrides.createAlert ?? (async () => ({ ok: true })),
    },
    "@/modules/audit/application/recordAuditEvent": {
      recordAuditEvent: overrides.recordAuditEvent ?? (async () => {}),
    },
    "@/modules/timeline/application/recordTimelineEvent": {
      recordTimelineEvent: overrides.recordTimelineEvent ?? (async () => {}),
    },
    "@/modules/risk/application/getLatestTaxRiskScore": {
      getLatestTaxRiskScore: overrides.getLatestTaxRiskScore ?? (async () => null),
    },
    "@/modules/tax/infrastructure/taxProfileRepository": {
      getTaxProfileByUserId: overrides.getTaxProfileByUserId ?? (async () => null),
    },
    "@/modules/sii/infrastructure/siiCredentialRepository": {
      getActiveCredential: overrides.getActiveCredential ?? (async () => null),
    },
    "@/modules/sii/infrastructure/siiCafRepository": {
      getActiveCaf: overrides.getActiveCaf ?? (async () => null),
    },
    "@/modules/tax-score/domain/smartTaxScore": domain,
    "@/modules/tax-score/infrastructure/smartTaxScoreRepository": {
      saveSmartTaxScore: overrides.saveSmartTaxScore ?? (async (input) => ({ id: "s1", ...input })),
      getLatestSmartTaxScoreByUserId: overrides.getLatestSmartTaxScoreByUserId ?? (async () => null),
    },
  };
}

test("calculateSmartTaxScore con usuario sin datos da score 40 y crea alerta", async () => {
  let createdAlert = null;
  let savedScore = null;

  const mocks = buildServiceMocks({
    createAlert: async (input) => {
      createdAlert = input;
      return { ok: true };
    },
    saveSmartTaxScore: async (input) => {
      savedScore = input;
      return { id: "s1", ...input };
    },
  });

  const { calculateSmartTaxScore } = loadTsModule(
    "src/modules/tax-score/application/calculateSmartTaxScore.ts",
    mocks
  );

  const result = await calculateSmartTaxScore("u1");

  assert.equal(result.ok, true);
  assert.equal(result.score, 40);
  assert.equal(result.level, "DEFICIENT");
  assert.ok(savedScore);
  assert.equal(savedScore.score, 40);
  assert.equal(savedScore.level, "DEFICIENT");

  assert.ok(createdAlert);
  assert.equal(createdAlert.severity, "HIGH");
  assert.equal(createdAlert.category, "COMPLIANCE");
  assert.equal(createdAlert.title, "Score tributario deficiente");
});

test("calculateSmartTaxScore con perfil validado y SII completo sube score", async () => {
  const mocks = buildServiceMocks({
    getTaxProfileByUserId: async () => ({
      isValidated: true,
      rut: "1-9",
      legalName: "Test",
      address: "Address",
      commune: "Commune",
      city: "City",
      dteEmail: "dte@test.com",
    }),
    getActiveCredential: async () => ({ isActive: true }),
    getActiveCaf: async () => ({ currentFolio: 1, folioEnd: 10 }),
  });

  const { calculateSmartTaxScore } = loadTsModule(
    "src/modules/tax-score/application/calculateSmartTaxScore.ts",
    mocks
  );

  const result = await calculateSmartTaxScore("u1");

  assert.equal(result.ok, true);
  // Identidad tributaria: 15
  // Completitud: perfil completo (3) = 3
  // Calidad clasificación: sin movimientos = 5
  // Resolución alertas: sin alertas = 15
  // DTE health: sin rechazados ni pendientes = 10
  // SII readiness: credencial activa + CAF = 10
  // Audit health: sin errores recientes = 10
  // Control de riesgo: sin risk score = 0
  // Total = 15 + 3 + 5 + 15 + 10 + 10 + 10 + 0 = 68
  assert.equal(result.score, 68);
  assert.equal(result.level, "HEALTHY");
});

test("calculateSmartTaxScore usa risk score inverso", async () => {
  const mocks1 = buildServiceMocks({
    getLatestTaxRiskScore: async () => ({ score: 20 }),
  });
  const mocks2 = buildServiceMocks({
    getLatestTaxRiskScore: async () => ({ score: 80 }),
  });

  const { calculateSmartTaxScore: calculate1 } = loadTsModule(
    "src/modules/tax-score/application/calculateSmartTaxScore.ts",
    mocks1
  );
  const { calculateSmartTaxScore: calculate2 } = loadTsModule(
    "src/modules/tax-score/application/calculateSmartTaxScore.ts",
    mocks2
  );

  const result1 = await calculate1("u1");
  const result2 = await calculate2("u1");

  // Aporte de control de riesgo para 20: round((100 - 20) * 0.15) = round(12) = 12
  // Aporte de control de riesgo para 80: round((100 - 80) * 0.15) = round(3) = 3
  const rc1 = result1.breakdown.find(b => b.factor === "RISK_CONTROL").score;
  const rc2 = result2.breakdown.find(b => b.factor === "RISK_CONTROL").score;

  assert.equal(rc1, 12);
  assert.equal(rc2, 3);
});

test("getLatestSmartTaxScore devuelve existente o calcula si no hay uno previo", async () => {
  const existingScore = {
    id: "s1",
    userId: "u1",
    score: 85,
    level: "HEALTHY",
    breakdown: [],
    evaluatedAt: new Date(),
  };

  let getCalled = 0;
  let calculateCalled = 0;

  const mocksRepository = {
    getLatestSmartTaxScoreByUserId: async () => {
      getCalled++;
      return getCalled === 1 ? null : existingScore;
    },
  };

  const calculateMock = async () => {
    calculateCalled++;
    return { ok: true, score: 85, level: "HEALTHY", breakdown: [], evaluatedAt: new Date() };
  };

  const { getLatestSmartTaxScore } = loadTsModule(
    "src/modules/tax-score/application/getLatestSmartTaxScore.ts",
    {
      "./calculateSmartTaxScore": { calculateSmartTaxScore: calculateMock },
      "@/modules/tax-score/infrastructure/smartTaxScoreRepository": mocksRepository,
    }
  );

  const result = await getLatestSmartTaxScore("u1");

  assert.ok(result);
  assert.equal(result.score, 85);
  assert.equal(calculateCalled, 1);
  assert.equal(getCalled, 2);
});
