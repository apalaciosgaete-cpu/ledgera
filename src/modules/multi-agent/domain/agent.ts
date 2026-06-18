export type SpecializedAgentType =
  | "RISK_AGENT"
  | "COMPLIANCE_AGENT"
  | "DOCUMENT_AGENT"
  | "FINANCIAL_AGENT"
  | "EXECUTION_AGENT";

export type AgentAssessmentSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SubjectType =
  | "TaxCase"
  | "Workflow"
  | "Decision"
  | "MonitorSignal";

export interface AgentAssessment {
  id: string;
  userId: string;
  agentType: SpecializedAgentType;
  subjectType: SubjectType;
  subjectId: string;
  severity: AgentAssessmentSeverity;
  confidence: number;
  summary: string;
  recommendation: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface MultiAgentReport {
  userId: string;
  subjectType: SubjectType;
  subjectId: string;
  assessments: AgentAssessment[];
  finalSeverity: AgentAssessmentSeverity;
  finalSummary: string;
  finalRecommendation: string;
  generatedAt: Date;
}

export const AGENT_TYPES: SpecializedAgentType[] = [
  "RISK_AGENT",
  "COMPLIANCE_AGENT",
  "DOCUMENT_AGENT",
  "FINANCIAL_AGENT",
  "EXECUTION_AGENT",
];

export const AGENT_LABELS: Record<SpecializedAgentType, string> = {
  RISK_AGENT: "Agente de Riesgo",
  COMPLIANCE_AGENT: "Agente de Cumplimiento",
  DOCUMENT_AGENT: "Agente Documental",
  FINANCIAL_AGENT: "Agente Financiero",
  EXECUTION_AGENT: "Agente de Ejecución",
};

export const AGENT_EMOJIS: Record<SpecializedAgentType, string> = {
  RISK_AGENT: "🔴",
  COMPLIANCE_AGENT: "⚖️",
  DOCUMENT_AGENT: "📄",
  FINANCIAL_AGENT: "💰",
  EXECUTION_AGENT: "🤖",
};

export const SEVERITY_ORDER: Record<AgentAssessmentSeverity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export const SEVERITY_LABELS: Record<AgentAssessmentSeverity, string> = {
  LOW: "Bajo",
  MEDIUM: "Medio",
  HIGH: "Alto",
  CRITICAL: "Crítico",
};

export function severityColor(severity: AgentAssessmentSeverity): string {
  switch (severity) {
    case "CRITICAL": return "#B91C1C";
    case "HIGH": return "#B45309";
    case "MEDIUM": return "#0F766E";
    case "LOW": return "#64748B";
  }
}

export function resolveFinalSeverity(assessments: AgentAssessment[]): AgentAssessmentSeverity {
  let maxSeverity: AgentAssessmentSeverity = "LOW";
  for (const a of assessments) {
    if (SEVERITY_ORDER[a.severity] > SEVERITY_ORDER[maxSeverity]) {
      maxSeverity = a.severity;
    }
  }
  return maxSeverity;
}
