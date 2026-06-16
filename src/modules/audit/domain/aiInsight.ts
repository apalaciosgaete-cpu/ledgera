export interface AIInsight {
  id: string;
  userId: string;
  title: string;
  summary: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  sourceType: string;
  createdAt: Date;
}