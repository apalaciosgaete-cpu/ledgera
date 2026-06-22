// src/modules/identity/application/sanitizeUser.ts

import type { User, UserRole, UserStatus } from "@/modules/identity/domain/user";

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  status: UserStatus;
  role: UserRole;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function sanitizeUser(user: User): PublicUser {
  return {
    id:             user.id,
    email:          user.email,
    fullName:       user.fullName,
    status:         user.status,
    role:           user.role,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt:      user.createdAt,
    updatedAt:      user.updatedAt,
  };
}