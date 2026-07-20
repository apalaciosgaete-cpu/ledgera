import type { UUID } from "@/shared/types/common";

export type SubscriptionPlan = "BASICO" | "PERSONAL" | "PROFESIONAL" | "EMPRESA";
export type UserRole = "personal" | "contador" | "empresa" | "admin";
export type UserStatus = "active" | "inactive" | "suspended";

export interface User {
  id:                   UUID;
  email:                string;
  fullName:             string;
  passwordHash:         string;
  status:               UserStatus;
  role:                 UserRole;
  emailVerifiedAt:      Date | null;
  createdAt:            Date;
  updatedAt:            Date;
  subscriptionPlan:     SubscriptionPlan;
  subscriptionExpiresAt: Date | null;
  twoFactorSecret:      string | null;
  twoFactorEnabled:     boolean;
  rut:                  string | null;
  phone:                string | null;
  address:              string | null;
  commune:              string | null;
  country:              string | null;
}

export function isSubscriptionActive(user: User): boolean {
  if (!user.subscriptionExpiresAt) return false;
  return new Date(user.subscriptionExpiresAt) > new Date();
}
