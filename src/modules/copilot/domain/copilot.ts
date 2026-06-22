export type CopilotRole = "USER" | "ASSISTANT" | "SYSTEM";

export interface CopilotConversation {
  id: string;
  userId: string;
  title: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CopilotMessage {
  id: string;
  conversationId: string;
  role: CopilotRole;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CopilotContext {
  userId: string;
  riskLevel: string | null;
  riskScore: number | null;
  smartScore: number | null;
  openAlerts: number;
  criticalAlerts: number;
  pendingTasks: number;
  activeRecommendations: number;
  rejectedDocuments: number;
  adaptiveProfileType: string | null;
  memoryPatterns: number;
  profileType: string | null;
}

export interface CopilotResponse {
  conversationId: string;
  answer: string;
  context: CopilotContext;
}
