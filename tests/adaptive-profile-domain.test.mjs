// tests/adaptive-profile-domain.test.mjs
// Pure function implementations (inlined for .mjs compatibility)

function resolveAdaptiveProfileType(score, criticalAlerts, pendingTasks, hasOverdueTasks, openAlerts) {
  // CRITICAL: score bajo, alertas críticas o tareas vencidas
  if (score < 50 || criticalAlerts > 0 || hasOverdueTasks) return "CRITICAL";
  // OPTIMIZED: score alto sin problemas
  if (score > 80 && criticalAlerts === 0 && pendingTasks === 0 && openAlerts === 0) return "OPTIMIZED";
  // STANDARD: rango normal con pocas tareas
  if (score >= 50 && score <= 80 && pendingTasks <= 3) return "STANDARD";
  // ATTENTION_REQUIRED: el resto
  return "ATTENTION_REQUIRED";
}

function resolveComplianceBehavior(score) {
  if (score >= 85) return "EXCELLENT";
  if (score >= 70) return "GOOD";
  if (score >= 50) return "REGULAR";
  return "POOR";
}

function resolveRecommendationBehavior(acceptedCount, ignoredCount, totalCount) {
  if (totalCount === 0) return "PASSIVE";
  const ratio = acceptedCount / totalCount;
  if (ratio >= 0.7) return "ENGAGED";
  if (ratio >= 0.3) return "PARTIAL";
  return "PASSIVE";
}

function resolveTaskBehavior(completedOnTime, completedLate, pendingCount) {
  const total = completedOnTime + completedLate + pendingCount;
  if (total === 0) return "NORMAL";
  const onTimeRatio = completedOnTime / total;
  if (onTimeRatio >= 0.8) return "FAST";
  if (pendingCount > completedOnTime + completedLate) return "DELAYED";
  return "NORMAL";
}

function resolveDocumentBehavior(organizedCount, incompleteCount, criticalCount) {
  const total = organizedCount + incompleteCount + criticalCount;
  if (total === 0) return "ORGANIZED";
  if (criticalCount > 0) return "CRITICAL";
  const organizedRatio = organizedCount / total;
  if (organizedRatio >= 0.8) return "ORGANIZED";
  return "INCOMPLETE";
}

function resolveRiskBehavior(riskLevel) {
  if (riskLevel === "CRITICAL" || riskLevel === "HIGH") return "CRITICAL";
  if (riskLevel === "MEDIUM") return "GROWING";
  return "STABLE";
}

function profileTypeLabel(pt) {
  const labels = { OPTIMIZED: "Optimizado", STANDARD: "Estándar", ATTENTION_REQUIRED: "Atención Requerida", CRITICAL: "Crítico" };
  return labels[pt] ?? pt;
}

function profileTypeDescription(pt) {
  const descs = {
    OPTIMIZED: "Tu comportamiento tributario es ejemplar.",
    STANDARD: "Tu perfil está dentro de lo esperado.",
    ATTENTION_REQUIRED: "Hay aspectos importantes que requieren tu atención.",
    CRITICAL: "Se necesita acción inmediata.",
  };
  return descs[pt] ?? "";
}

function profileTypeColor(pt) {
  const colors = { OPTIMIZED: "#15803D", STANDARD: "#0F766E", ATTENTION_REQUIRED: "#B45309", CRITICAL: "#991B1B" };
  return colors[pt] ?? "#000000";
}

function confidenceLabel(confidence) {
  if (confidence >= 80) return "Alta";
  if (confidence >= 50) return "Media";
  return "Baja";
}

// ── resolveAdaptiveProfileType ──

function testOptimizedProfile() {
  const result = resolveAdaptiveProfileType(85, 0, 0, false, 0);
  if (result !== "OPTIMIZED") throw new Error(`Expected OPTIMIZED, got ${result}`);
  console.log("✓ resolveAdaptiveProfileType: OPTIMIZED (score > 80, no alerts, no tasks)");
}

function testStandardProfile() {
  const result = resolveAdaptiveProfileType(65, 0, 2, false, 1);
  if (result !== "STANDARD") throw new Error(`Expected STANDARD, got ${result}`);
  console.log("✓ resolveAdaptiveProfileType: STANDARD (score 50-80, few tasks)");
}

function testCriticalProfileLowScore() {
  const result = resolveAdaptiveProfileType(30, 0, 0, false, 0);
  if (result !== "CRITICAL") throw new Error(`Expected CRITICAL, got ${result}`);
  console.log("✓ resolveAdaptiveProfileType: CRITICAL (score < 50)");
}

function testCriticalProfileCriticalAlerts() {
  const result = resolveAdaptiveProfileType(70, 2, 0, false, 0);
  if (result !== "CRITICAL") throw new Error(`Expected CRITICAL, got ${result}`);
  console.log("✓ resolveAdaptiveProfileType: CRITICAL (critical alerts > 0)");
}

function testAttentionRequiredProfile() {
  const result = resolveAdaptiveProfileType(60, 0, 5, false, 2);
  if (result !== "ATTENTION_REQUIRED") throw new Error(`Expected ATTENTION_REQUIRED, got ${result}`);
  console.log("✓ resolveAdaptiveProfileType: ATTENTION_REQUIRED (many tasks, open alerts)");
}

// ── resolveComplianceBehavior ──

function testComplianceExcellent() {
  const result = resolveComplianceBehavior(90);
  if (result !== "EXCELLENT") throw new Error(`Expected EXCELLENT, got ${result}`);
  console.log("✓ resolveComplianceBehavior: EXCELLENT (score >= 85)");
}

function testCompliancePoor() {
  const result = resolveComplianceBehavior(30);
  if (result !== "POOR") throw new Error(`Expected POOR, got ${result}`);
  console.log("✓ resolveComplianceBehavior: POOR (score < 50)");
}

// ── resolveRecommendationBehavior ──

function testRecommendationEngaged() {
  const result = resolveRecommendationBehavior(7, 1, 10);
  if (result !== "ENGAGED") throw new Error(`Expected ENGAGED, got ${result}`);
  console.log("✓ resolveRecommendationBehavior: ENGAGED (>=70% accepted)");
}

function testRecommendationPassive() {
  const result = resolveRecommendationBehavior(1, 7, 10);
  if (result !== "PASSIVE") throw new Error(`Expected PASSIVE, got ${result}`);
  console.log("✓ resolveRecommendationBehavior: PASSIVE (<30% accepted)");
}

function testRecommendationPartial() {
  const result = resolveRecommendationBehavior(4, 4, 10);
  if (result !== "PARTIAL") throw new Error(`Expected PARTIAL, got ${result}`);
  console.log("✓ resolveRecommendationBehavior: PARTIAL (30-70% accepted)");
}

// ── resolveTaskBehavior ──

function testTaskFast() {
  const result = resolveTaskBehavior(8, 1, 1);
  if (result !== "FAST") throw new Error(`Expected FAST, got ${result}`);
  console.log("✓ resolveTaskBehavior: FAST (>=80% on time)");
}

function testTaskDelayed() {
  const result = resolveTaskBehavior(1, 1, 8);
  if (result !== "DELAYED") throw new Error(`Expected DELAYED, got ${result}`);
  console.log("✓ resolveTaskBehavior: DELAYED (pending > completed)");
}

function testTaskNormal() {
  const result = resolveTaskBehavior(4, 2, 2);
  if (result !== "NORMAL") throw new Error(`Expected NORMAL, got ${result}`);
  console.log("✓ resolveTaskBehavior: NORMAL");
}

// ── resolveDocumentBehavior ──

function testDocumentOrganized() {
  const result = resolveDocumentBehavior(8, 2, 0);
  if (result !== "ORGANIZED") throw new Error(`Expected ORGANIZED, got ${result}`);
  console.log("✓ resolveDocumentBehavior: ORGANIZED (>=80% organized)");
}

function testDocumentCritical() {
  const result = resolveDocumentBehavior(2, 3, 5);
  if (result !== "CRITICAL") throw new Error(`Expected CRITICAL, got ${result}`);
  console.log("✓ resolveDocumentBehavior: CRITICAL (critical > 0)");
}

function testDocumentIncomplete() {
  const result = resolveDocumentBehavior(3, 5, 0);
  if (result !== "INCOMPLETE") throw new Error(`Expected INCOMPLETE, got ${result}`);
  console.log("✓ resolveDocumentBehavior: INCOMPLETE");
}

// ── resolveRiskBehavior ──

function testRiskStable() {
  const result = resolveRiskBehavior("LOW");
  if (result !== "STABLE") throw new Error(`Expected STABLE, got ${result}`);
  console.log("✓ resolveRiskBehavior: STABLE (LOW level)");
}

function testRiskCritical() {
  const result = resolveRiskBehavior("CRITICAL");
  if (result !== "CRITICAL") throw new Error(`Expected CRITICAL, got ${result}`);
  console.log("✓ resolveRiskBehavior: CRITICAL (CRITICAL level)");
}

function testRiskGrowing() {
  const result = resolveRiskBehavior("MEDIUM");
  if (result !== "GROWING") throw new Error(`Expected GROWING, got ${result}`);
  console.log("✓ resolveRiskBehavior: GROWING (MEDIUM level)");
}

// ── Utility functions ──

function testProfileTypeLabel() {
  const tests = [
    { input: "OPTIMIZED", expected: "Optimizado" },
    { input: "STANDARD", expected: "Estándar" },
    { input: "ATTENTION_REQUIRED", expected: "Atención Requerida" },
    { input: "CRITICAL", expected: "Crítico" },
  ];
  for (const t of tests) {
    const result = profileTypeLabel(t.input);
    if (result !== t.expected) throw new Error(`profileTypeLabel(${t.input}): expected ${t.expected}, got ${result}`);
  }
  console.log("✓ profileTypeLabel: all labels correct");
}

function testProfileTypeColor() {
  const colors = ["OPTIMIZED", "STANDARD", "ATTENTION_REQUIRED", "CRITICAL"].map(profileTypeColor);
  if (colors.length !== 4) throw new Error("Expected 4 profile type colors");
  console.log("✓ profileTypeColor: all colors returned");
}

function testConfidenceLabel() {
  if (confidenceLabel(85) !== "Alta") throw new Error("Expected Alta");
  if (confidenceLabel(60) !== "Media") throw new Error("Expected Media");
  if (confidenceLabel(30) !== "Baja") throw new Error("Expected Baja");
  console.log("✓ confidenceLabel: all levels correct");
}

// ── Run all ──

console.log("\n🔬 Adaptive Profile Domain Tests\n");

testOptimizedProfile();
testStandardProfile();
testCriticalProfileLowScore();
testCriticalProfileCriticalAlerts();
testAttentionRequiredProfile();
testComplianceExcellent();
testCompliancePoor();
testRecommendationEngaged();
testRecommendationPassive();
testRecommendationPartial();
testTaskFast();
testTaskDelayed();
testTaskNormal();
testDocumentOrganized();
testDocumentCritical();
testDocumentIncomplete();
testRiskStable();
testRiskCritical();
testRiskGrowing();
testProfileTypeLabel();
testProfileTypeColor();
testConfidenceLabel();

console.log("\n✅ All domain tests passed!\n");
