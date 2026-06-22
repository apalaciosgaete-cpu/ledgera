import type { UUID } from "@/shared/types/common";

export interface Session {
  id: UUID;
  userId: UUID;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}