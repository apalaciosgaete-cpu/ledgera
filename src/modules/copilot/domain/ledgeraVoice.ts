// src/modules/copilot/domain/ledgeraVoice.ts
// UX 3.0.04 — Identidad Vocal LEDGERA
// Motor de voz que implementa la personalidad, estructura de respuesta
// y adaptación por perfil del Sistema Operativo Financiero y Tributario.

import type { CopilotContext } from "./copilot";

// ─── Profile type ────────────────────────────────────────────────────────────

export type LedgeraProfile = "persona" | "empresa" | "profesional";

const PROFILE_ALIAS: Record<string, LedgeraProfile> = {
  personal: "persona",
  persona: "persona",
  empresa: "empresa",
  contador: "profesional",
  profesional: "profesional",
};

export function resolveProfile(raw: string | null | undefined): LedgeraProfile {
  return PROFILE_ALIAS[raw?.toLowerCase() ?? ""] ?? "persona";
}

// ─── Personality traits ──────────────────────────────────────────────────────

export type LedgeraPersonality = {
  traits: string[];
  verbalIdentity: string[];
  notIdentity: string[];
  fundamentalPrinciple: string;
  tone: string;
};

export const LEDGERA_PERSONALITY: LedgeraPersonality = {
  traits: ["Profesional", "Tranquilo", "Claro", "Cercano"],
  verbalIdentity: ["Preciso", "Confiable", "Analítico", "Objetivo", "Explicativo"],
  notIdentity: ["Vendedor", "Motivacional", "Sensacionalista", "Alarmista", "Dogmático"],
  fundamentalPrinciple: "LEDGERA no toma decisiones. Ayuda a comprender decisiones.",
  tone: "Asesor experto que no improvisa, no especula, no exagera.",
};

// ─── Never / Always rules ─────────────────────────────────────────────────────

export const NEVER_SAY: string[] = [
  "Debes hacer esto",
  "La mejor opción es",
  "Esto está mal",
  "Tienes que",
  "Hazlo así",
  "Lo correcto es",
  "Es obligatorio",
  "Te recomiendo que hagas",
];

export const ALWAYS_SAY: Record<string, string> = {
  "Debes hacer esto": "Estas son las alternativas disponibles",
  "La mejor opción es": "Cada alternativa presenta consecuencias distintas",
  "Esto está mal": "Existen elementos que conviene revisar",
  "Tienes que": "Una alternativa disponible es",
  "Hazlo así": "Entre las alternativas, esta presenta estas características",
  "Lo correcto es": "Desde la perspectiva normativa, lo que corresponde considerar es",
  "Es obligatorio": "La normativa establece ciertas obligaciones aplicables",
  "Te recomiendo que hagas": "Podrías evaluar la siguiente alternativa",
};

// ─── Vocabulary rules ────────────────────────────────────────────────────────

export const USE_VOCABULARY: string[] = [
  "Contexto",
  "Alternativas",
  "Escenarios",
  "Consecuencias",
  "Patrimonio",
  "Obligaciones",
  "Riesgos",
  "Cumplimiento",
  "Normativa",
  "Efectos",
  "Criterios",
  "Elementos",
  "Situación",
];

export const AVOID_VOCABULARY: string[] = [
  "Hack",
  "Truco",
  "Secreto",
  "Garantizado",
  "Imperdible",
  "Urgente",
  "Explosivo",
  "Increíble",
  "Revolucionario",
  "Mágico",
];

// ─── Profile voice adaptation ────────────────────────────────────────────────

export type ProfileVoice = {
  objective: string;
  example: string;
  characteristics: string[];
  style: string;
  complexityLevel: "low" | "medium" | "high";
};

export const PROFILE_VOICE: Record<LedgeraProfile, ProfileVoice> = {
  persona: {
    objective: "Reducir complejidad.",
    example: "Si vendes ese activo, podrían existir efectos tributarios. Veamos cuáles aplican en tu caso.",
    characteristics: ["lenguaje cotidiano", "términos simples", "explicaciones paso a paso"],
    style: "conversacional cercano",
    complexityLevel: "low",
  },
  empresa: {
    objective: "Apoyar decisiones ejecutivas.",
    example: "Esta operación podría afectar la carga tributaria, el flujo financiero y ciertas obligaciones futuras. Analicemos los escenarios.",
    characteristics: ["ejecutivo", "directo", "orientado a impacto"],
    style: "ejecutivo directo",
    complexityLevel: "medium",
  },
  profesional: {
    objective: "Aumentar capacidad analítica.",
    example: "Identifico tres criterios tributarios relevantes para este caso. Revisemos cada uno.",
    characteristics: ["técnico", "preciso", "normativo"],
    style: "técnico preciso",
    complexityLevel: "high",
  },
};

// ─── Base phrases ────────────────────────────────────────────────────────────

export const BASE_PHRASES: Record<string, string> = {
  greeting: "Hola.\n\nCuéntame qué necesitas resolver.",
  needContext: "Necesito un poco más de contexto para ayudarte mejor.",
  uncertainty: "Con la información disponible, no es posible concluir todavía.",
  riskPresent: "Hay algunos elementos que conviene revisar.",
  alternativesExist: "Existe más de una alternativa posible.",
  closure: "Ya tienes los elementos necesarios para evaluar esta decisión.",
  personalize: "Veamos cuáles aplican en tu caso.",
  letMeAnalyze: "Revisemos cada uno.",
};

// ─── Profile-adapted greetings ───────────────────────────────────────────────

export function buildGreeting(profile: LedgeraProfile): string {
  switch (profile) {
    case "persona":
      return "Hola.\n\nCuéntame qué necesitas resolver.";
    case "empresa":
      return "Hola.\n\n¿Qué decisión necesitas evaluar?";
    case "profesional":
      return "Hola.\n\n¿En qué caso estás trabajando hoy?";
  }
}

// ─── Step labels for the 6-step structure ────────────────────────────────────

export type ResponseStep = {
  label: string;
  content: string;
};

const STEP_LABELS: Record<string, string> = {
  context: "Contexto",
  observation: "Observación",
  normativa: "Normativa Aplicable",
  alternatives: "Alternativas",
  consequences: "Consecuencias",
  nextStep: "Próximo Paso",
};

// ─── Sanitize language: replace forbidden vocabulary ────────────────────────

export function sanitizeLanguage(text: string): string {
  let result = text;
  for (const word of AVOID_VOCABULARY) {
    const re = new RegExp(word, "gi");
    result = result.replace(re, "");
  }
  return result;
}

// ─── Apply Never/Say transformations ────────────────────────────────────────

export function applyNeverSayRules(text: string): string {
  let result = text;
  for (const [forbidden, replacement] of Object.entries(ALWAYS_SAY)) {
    const re = new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    result = result.replace(re, replacement);
  }
  return result;
}

// ─── Profile prefix for responses ────────────────────────────────────────────

function profilePrefix(profile: LedgeraProfile): string {
  switch (profile) {
    case "empresa":
      return "Desde una perspectiva ejecutiva, ";
    case "profesional":
      return "Analíticamente, ";
    default:
      return "";
  }
}

// ─── Main response builder — 6-step structure ────────────────────────────────

export type BuildResponseInput = {
  message: string;
  context: CopilotContext;
  profile: LedgeraProfile;
};

export type StructuredResponse = {
  steps: ResponseStep[];
  fullText: string;
};

/** @future — LLM integration: full 6-step structured response */
/**
 * Builds a structured response following the official 6-step format:
 * 1. Contexto — what is understood
 * 2. Observación — what is observed
 * 3. Normativa Aplicable — relevant rules
 * 4. Alternativas — possible paths
 * 5. Consecuencias — effects of each alternative
 * 6. Próximo Paso — what to review next
 *
 * Adapts tone, complexity, and examples based on the user profile.
 */
export function buildStructuredResponse(input: BuildResponseInput): StructuredResponse {
  const { message, context, profile } = input;
  const normalized = message.toLowerCase();
  const prefix = profilePrefix(profile);

  const steps: ResponseStep[] = [];

  // Step 1: Contexto
  const contextStep = buildContextStep(normalized, profile);
  steps.push({ label: "Contexto", content: contextStep });

  // Step 2: Observación
  const observationStep = buildObservationStep(normalized, context, profile);
  steps.push({ label: "Observación", content: observationStep });

  // Step 3: Normativa Aplicable
  const normativaStep = buildNormativaStep(normalized, profile);
  steps.push({ label: "Normativa Aplicable", content: normativaStep });

  // Step 4: Alternativas
  const alternativesStep = buildAlternativesStep(normalized, context, profile);
  steps.push({ label: "Alternativas", content: alternativesStep });

  // Step 5: Consecuencias
  const consequencesStep = buildConsequencesStep(normalized, context, profile);
  steps.push({ label: "Consecuencias", content: consequencesStep });

  // Step 6: Próximo Paso
  const nextStepContent = buildNextStepStep(normalized, context, profile);
  steps.push({ label: "Próximo Paso", content: nextStepContent });

  const fullText = steps
    .map((s, i) => `${i + 1}. **${s.label}**\n${s.content}`)
    .join("\n\n");

  return { steps, fullText };
}

// ─── Single response builder (simple, non-structured) ───────────────────────

/**
 * Generates a simple conversational response to the user's message,
 * adapted to their profile and current context, following LEDGERA voice rules.
 *
 * This is the main function used by processCopilotMessage.
 */
export function buildVoiceResponse(input: BuildResponseInput): string {
  const { message, context, profile } = input;
  const normalized = message.toLowerCase();
  const voice = PROFILE_VOICE[profile];

  // Determine intent
  const intent = detectIntent(normalized);
  const prefix = profilePrefix(profile);

  switch (intent) {
    case "urgent":
      return buildUrgentResponse(context, profile, voice);
    case "score":
      return buildScoreResponse(context, profile, voice);
    case "risk":
      return buildRiskResponse(context, profile, voice);
    case "memory":
      return buildMemoryResponse(context, profile, voice);
    default:
      return buildGeneralResponse(message, context, profile, voice);
  }
}

// ─── Intent detection ────────────────────────────────────────────────────────

type Intent = "urgent" | "score" | "risk" | "memory" | "general";

function detectIntent(normalized: string): Intent {
  if (normalized.includes("urgente") || normalized.includes("hoy") || normalized.includes("prioridad")) {
    return "urgent";
  }
  if (normalized.includes("score") || normalized.includes("mejorar") || normalized.includes("puntaje")) {
    return "score";
  }
  if (normalized.includes("riesgo") || normalized.includes("alerta") || normalized.includes("peligro")) {
    return "risk";
  }
  if (normalized.includes("memoria") || normalized.includes("perfil") || normalized.includes("historial")) {
    return "memory";
  }
  return "general";
}

// ─── Step builders ───────────────────────────────────────────────────────────

function buildContextStep(normalized: string, profile: LedgeraProfile): string {
  if (normalized.includes("urgente") || normalized.includes("hoy")) {
    return "Entiendo que necesitas conocer qué requiere atención prioritaria en tu situación actual.";
  }
  if (normalized.includes("score")) {
    return "Entiendo que deseas información sobre tu score tributario y cómo mejorarlo.";
  }
  if (normalized.includes("riesgo")) {
    return "Entiendo que quieres conocer el nivel de riesgo asociado a tu situación actual.";
  }
  if (normalized.includes("memoria")) {
    return "Entiendo que quieres revisar lo que LEDGERA ha identificado sobre tu comportamiento tributario.";
  }
  return "Entiendo tu consulta. Revisemos los elementos disponibles.";
}

function buildObservationStep(normalized: string, context: CopilotContext, profile: LedgeraProfile): string {
  if (context.criticalAlerts > 0 || context.rejectedDocuments > 0) {
    const items: string[] = [];
    if (context.criticalAlerts > 0) items.push(`${context.criticalAlerts} alerta(s) crítica(s)`);
    if (context.rejectedDocuments > 0) items.push(`${context.rejectedDocuments} documento(s) rechazado(s)`);
    return `Según tu situación actual, existen elementos que conviene revisar: ${items.join(" y ")}.`;
  }
  if (context.openAlerts > 0 || context.pendingTasks > 0) {
    return `Actualmente registras ${context.openAlerts} alerta(s) abierta(s) y ${context.pendingTasks} tarea(s) pendiente(s).`;
  }
  if (context.riskLevel) {
    return `Tu nivel de riesgo actual es ${context.riskLevel} con un score de ${context.riskScore ?? "sin dato"}.`;
  }
  return "Tu situación no presenta elementos críticos identificados en este momento.";
}

function buildNormativaStep(normalized: string, profile: LedgeraProfile): string {
  // Generic normative reference — rule-based system cannot provide specific legal advice
  switch (profile) {
    case "persona":
      return "La normativa tributaria chilena considera cada operación según su naturaleza, monto y periodicidad. Es importante revisar las obligaciones que aplican a tu caso particular.";
    case "empresa":
      return "Las normas tributarias chilenas establecen criterios específicos según el tipo societario, régimen tributario y naturaleza de las operaciones. Cada alternativa debe evaluarse considerando la normativa vigente.";
    case "profesional":
      return "El ordenamiento tributario chileno contempla disposiciones específicas en el Código Tributario, la Ley sobre Impuesto a la Renta y la normativa del SII. Se deben considerar los criterios jurisprudenciales y administrativos aplicables al caso.";
  }
}

function buildAlternativesStep(normalized: string, context: CopilotContext, profile: LedgeraProfile): string {
  const alternatives: string[] = [];

  if (context.pendingTasks > 0) {
    alternatives.push(`Resolver las ${context.pendingTasks} tarea(s) pendiente(s) identificadas`);
  }
  if (context.rejectedDocuments > 0) {
    alternatives.push(`Regularizar los ${context.rejectedDocuments} documento(s) rechazado(s)`);
  }
  if (context.activeRecommendations > 0) {
    alternatives.push(`Revisar las ${context.activeRecommendations} recomendación(es) activa(s) disponibles`);
  }
  if (context.criticalAlerts > 0) {
    alternatives.push("Atender las alertas críticas como primera prioridad");
  }

  if (alternatives.length === 0) {
    return "Existen estos caminos posibles:\n• Mantener la situación actual y monitorear cambios\n• Programar una revisión periódica de tu perfil";
  }

  return `Existen estos caminos posibles:\n${alternatives.map(a => `• ${a}`).join("\n")}`;
}

function buildConsequencesStep(normalized: string, context: CopilotContext, profile: LedgeraProfile): string {
  switch (profile) {
    case "persona":
      return "Cada alternativa puede generar efectos distintos en tu situación tributaria. La elección depende de tu contexto particular y objetivos.";
    case "empresa":
      return "Cada alternativa presenta implicancias distintas en la carga tributaria, el flujo financiero y las obligaciones futuras de la empresa.";
    case "profesional":
      return "Cada alternativa genera efectos distintos en el cumplimiento normativo, la exposición fiscal y la documentación requerida.";
  }
}

function buildNextStepStep(normalized: string, context: CopilotContext, profile: LedgeraProfile): string {
  if (context.criticalAlerts > 0) {
    return "Podrías revisar las alertas críticas como primera acción. Te sugiero comenzar por ahí.";
  }
  if (context.pendingTasks > 0) {
    return "Podrías revisar tus tareas pendientes y definir un orden de prioridad.";
  }
  if (context.rejectedDocuments > 0) {
    return "Podrías revisar los documentos rechazados y las observaciones asociadas.";
  }
  return "Ya tienes los elementos necesarios para evaluar esta decisión.";
}

// ─── Intent-specific response builders ───────────────────────────────────────

function buildUrgentResponse(context: CopilotContext, profile: LedgeraProfile, voice: ProfileVoice): string {
  const parts: string[] = [];

  if (context.criticalAlerts > 0 || context.rejectedDocuments > 0) {
    const items: string[] = [];
    if (context.criticalAlerts > 0) items.push(`${context.criticalAlerts} alerta(s) crítica(s)`);
    if (context.rejectedDocuments > 0) items.push(`${context.rejectedDocuments} documento(s) rechazado(s)`);
    parts.push(`Hay algunos elementos que conviene revisar: ${items.join(" y ")}.`);
  } else if (context.pendingTasks > 0) {
    parts.push(`Registras ${context.pendingTasks} tarea(s) pendiente(s) que podrían requerir atención.`);
  } else {
    parts.push("No se identifican elementos críticos en este momento. Puedes mantener tu situación actual.");
  }

  if (context.riskLevel && context.riskScore != null) {
    parts.push(`Tu riesgo actual es ${context.riskLevel} con score ${context.riskScore}.`);
  }

  parts.push("Existe más de una alternativa posible. Podrías revisar qué elementos priorizar según tu contexto.");

  return parts.join("\n\n");
}

function buildScoreResponse(context: CopilotContext, profile: LedgeraProfile, voice: ProfileVoice): string {
  const parts: string[] = [];

  if (context.smartScore != null) {
    parts.push(`Tu score actual es ${context.smartScore}.`);
  } else {
    parts.push("Aún no tengo un score calculado para tu perfil.");
  }

  const factors: string[] = [];
  if (context.pendingTasks > 0) factors.push(`${context.pendingTasks} tarea(s) pendiente(s)`);
  if (context.openAlerts > 0) factors.push(`${context.openAlerts} alerta(s) abierta(s)`);
  if (context.activeRecommendations > 0) factors.push(`${context.activeRecommendations} recomendación(es) activa(s)`);

  if (factors.length > 0) {
    parts.push(`Para mejorar tu score, podrías revisar:\n• ${factors.join("\n• ")}`);
  } else {
    parts.push("No se identifican factores que requieran ajuste inmediato.");
  }

  parts.push("Cada elemento presenta consecuencias distintas. Revisemos cuáles aplicarían en tu caso.");

  return parts.join("\n\n");
}

function buildRiskResponse(context: CopilotContext, profile: LedgeraProfile, voice: ProfileVoice): string {
  const parts: string[] = [];

  if (context.riskLevel) {
    parts.push(`Tu riesgo actual es ${context.riskLevel} con score ${context.riskScore ?? "sin dato"}.`);
  } else {
    parts.push("Aún no tengo un riesgo calculado. Existen elementos que conviene revisar para evaluarlo.");
    return parts.join("\n\n");
  }

  const signals: string[] = [];
  if (context.openAlerts > 0) signals.push(`${context.openAlerts} alerta(s) abierta(s)`);
  if (context.pendingTasks > 0) signals.push(`${context.pendingTasks} tarea(s) pendiente(s)`);
  if (context.rejectedDocuments > 0) signals.push(`${context.rejectedDocuments} documento(s) rechazado(s)`);

  if (signals.length > 0) {
    parts.push(`Las principales señales identificadas son:\n• ${signals.join("\n• ")}`);
  }

  parts.push("Existe más de una alternativa posible. Cada una genera efectos distintos en tu perfil de riesgo.");

  return parts.join("\n\n");
}

function buildMemoryResponse(context: CopilotContext, profile: LedgeraProfile, voice: ProfileVoice): string {
  const parts: string[] = [];

  parts.push(`Tu perfil adaptativo actual es ${context.adaptiveProfileType ?? "sin clasificar"}.`);

  if (context.memoryPatterns > 0) {
    parts.push(`LEDGERA reconoce ${context.memoryPatterns} patrón(es) en tu memoria tributaria.`);
  } else {
    parts.push("Aún no se han identificado patrones significativos en tu historial.");
  }

  parts.push("Con la información disponible, estos son los elementos que conviene considerar para tu situación.");

  return parts.join("\n\n");
}

function buildGeneralResponse(
  message: string,
  context: CopilotContext,
  profile: LedgeraProfile,
  voice: ProfileVoice,
): string {
  const parts: string[] = [];

  const profilePrefix = profile === "empresa"
    ? "Desde una perspectiva ejecutiva, "
    : profile === "profesional"
      ? "Analíticamente, "
      : "";

  parts.push(`${profilePrefix}veo ${context.openAlerts} alerta(s), ${context.pendingTasks} tarea(s), ${context.activeRecommendations} recomendación(es) activa(s) y riesgo ${context.riskLevel ?? "sin calcular"}.`);

  if (context.rejectedDocuments > 0) {
    parts.push(`Hay ${context.rejectedDocuments} documento(s) rechazado(s) que conviene revisar.`);
  }

  parts.push("Existe más de una alternativa posible. Cada elemento presenta consecuencias distintas.");
  parts.push("Podrías revisar tus tareas pendientes como próximo paso.");

  return parts.join("\n\n");
}

// ─── Simple response (for backward compatibility) ────────────────────────────

/** @future — LLM integration: fallback for unauthenticated contexts */
/**
 * Simplified response when profile isn't available — uses persona as default.
 */
export function buildSimpleResponse(context: CopilotContext): string {
  return buildVoiceResponse({
    message: "",
    context,
    profile: "persona",
  });
}
