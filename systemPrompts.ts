// systemPrompts.ts
// UX 3.0.04 — Identidad Vocal LEDGERA
// Configuración de personalidad y voz del Sistema Operativo Financiero y Tributario.
//
// Este archivo exporta la configuración de personalidad para uso en:
// - El copiloto conversacional (backend rule-based)
// - Futura integración con LLM
// - Componentes UI que muestran mensajes de LEDGERA

export {
  LEDGERA_PERSONALITY,
  PROFILE_VOICE,
  BASE_PHRASES,
  USE_VOCABULARY,
  AVOID_VOCABULARY,
  NEVER_SAY,
  ALWAYS_SAY,
  buildGreeting,
  resolveProfile,
  buildVoiceResponse,
  buildStructuredResponse,
  sanitizeLanguage,
  applyNeverSayRules,
  type LedgeraProfile,
  type ProfileVoice,
} from "@/modules/copilot/domain/ledgeraVoice";
