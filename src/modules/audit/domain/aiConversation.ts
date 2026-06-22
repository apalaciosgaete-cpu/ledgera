export interface AIConversation {
  id: string;
  userId: string;
  role: "USER" | "ASSISTANT";
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}